export const MAX_AVATAR_SOURCE_BYTES = 20 * 1024 * 1024; // 20 MB raw photo before client-side resize
export const MAX_AI_SOURCE_BYTES = 20 * 1024 * 1024; // 20 MB raw photo before client-side resize
export const MAX_AI_UPLOAD_BYTES = Math.floor(3.5 * 1024 * 1024); // 3.5 MB (safely below Vercel 4.5 MB limit)
export const AVATAR_TARGET_SIZE_PX = 512;
export const AI_IMAGE_MAX_DIMENSION_PX = 1600;
export const AI_IMAGE_PASSTHROUGH_BYTES = Math.floor(1.2 * 1024 * 1024); // 1.2 MB

export interface ImageDimensions {
  readonly width: number;
  readonly height: number;
}

export interface CropRect {
  readonly sx: number;
  readonly sy: number;
  readonly sWidth: number;
  readonly sHeight: number;
}

/**
 * Scales dimensions proportionally so the longest side fits within `maxDimension`
 * without ever upscaling smaller images.
 */
export function computeContainedDimensions(
  width: number,
  height: number,
  maxDimension: number,
): ImageDimensions {
  if (width <= 0 || height <= 0 || maxDimension <= 0) {
    return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) };
  }
  const longest = Math.max(width, height);
  if (longest <= maxDimension) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const scale = maxDimension / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Computes a centered square crop rectangle for avatar thumbnails.
 */
export function computeSquareCropRect(width: number, height: number): CropRect {
  const side = Math.max(1, Math.min(width, height));
  return {
    sx: Math.floor((width - side) / 2),
    sy: Math.floor((height - side) / 2),
    sWidth: side,
    sHeight: side,
  };
}

interface DecodedImage {
  readonly width: number;
  readonly height: number;
  drawTo(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ): void;
  cleanup(): void;
}

async function decodeImageFile(file: File): Promise<DecodedImage | null> {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return null;
  }

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        width: bitmap.width,
        height: bitmap.height,
        drawTo(ctx, sx, sy, sw, sh, dx, dy, dw, dh) {
          ctx.drawImage(bitmap, sx, sy, sw, sh, dx, dy, dw, dh);
        },
        cleanup() {
          bitmap.close();
        },
      };
    } catch {
      // Fallback to HTMLImageElement below
    }
  }

  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return null;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to decode image'));
      el.src = objectUrl;
    });

    return {
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      drawTo(ctx, sx, sy, sw, sh, dx, dy, dw, dh) {
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
      },
      cleanup() {
        URL.revokeObjectURL(objectUrl);
      },
    };
  } catch {
    URL.revokeObjectURL(objectUrl);
    return null;
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

function toJpegFileName(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, '') || 'image';
  return `${base}.jpg`;
}

/**
 * Center-crops and scales an avatar photo to 512x512 JPEG (~40-90 KB) on the client
 * so large iPhone/camera photos never fail size limits and upload quickly.
 */
export async function compressAvatarImage(
  file: File,
  targetSizePx = AVATAR_TARGET_SIZE_PX,
): Promise<File> {
  const decoded = await decodeImageFile(file);
  if (!decoded) {
    return file;
  }

  try {
    const crop = computeSquareCropRect(decoded.width, decoded.height);
    const outputSize = Math.min(targetSizePx, Math.max(1, Math.round(crop.sWidth)));

    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputSize, outputSize);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    decoded.drawTo(
      ctx,
      crop.sx,
      crop.sy,
      crop.sWidth,
      crop.sHeight,
      0,
      0,
      outputSize,
      outputSize,
    );

    const blob =
      (await canvasToBlob(canvas, 'image/jpeg', 0.85)) ??
      (await canvasToBlob(canvas, 'image/jpeg', 0.72));
    if (!blob) {
      return file;
    }

    return new File([blob], toJpegFileName(file.name), {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    decoded.cleanup();
  }
}

/**
 * Optimizes a timetable photo for Gemini Vision OCR while staying comfortably under
 * Vercel's 4.5 MB serverless body limit:
 * - Preserves crisp small images (<= 1600px and <= 1.2 MB) without re-encoding.
 * - Scales large camera photos proportionally to max 1600px JPEG (quality 0.86),
 *   retaining crisp text readability across timetable grid cells.
 */
export async function compressAiTimetableImage(
  file: File,
  maxDimensionPx = AI_IMAGE_MAX_DIMENSION_PX,
  maxUploadBytes = MAX_AI_UPLOAD_BYTES,
): Promise<File> {
  const decoded = await decodeImageFile(file);
  if (!decoded) {
    return file;
  }

  try {
    const longest = Math.max(decoded.width, decoded.height);
    if (longest <= maxDimensionPx && file.size <= AI_IMAGE_PASSTHROUGH_BYTES) {
      return file;
    }

    const attempts: readonly { maxDim: number; quality: number }[] = [
      { maxDim: maxDimensionPx, quality: 0.86 },
      { maxDim: maxDimensionPx, quality: 0.78 },
      { maxDim: 1280, quality: 0.78 },
    ];

    let bestBlob: Blob | null = null;
    for (const attempt of attempts) {
      const dims = computeContainedDimensions(decoded.width, decoded.height, attempt.maxDim);
      const canvas = document.createElement('canvas');
      canvas.width = dims.width;
      canvas.height = dims.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return file;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, dims.width, dims.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      decoded.drawTo(
        ctx,
        0,
        0,
        decoded.width,
        decoded.height,
        0,
        0,
        dims.width,
        dims.height,
      );

      const blob = await canvasToBlob(canvas, 'image/jpeg', attempt.quality);
      if (!blob) {
        continue;
      }
      bestBlob = blob;
      if (blob.size <= maxUploadBytes) {
        break;
      }
    }

    if (!bestBlob) {
      return file;
    }

    return new File([bestBlob], toJpegFileName(file.name), {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    decoded.cleanup();
  }
}
