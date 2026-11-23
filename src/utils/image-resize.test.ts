import { describe, expect, it } from 'vitest';
import {
  AI_IMAGE_MAX_DIMENSION_PX,
  AVATAR_TARGET_SIZE_PX,
  computeContainedDimensions,
  computeSquareCropRect,
  compressAiTimetableImage,
  compressAvatarImage,
} from './image-resize';

describe('image-resize utilities', () => {
  it('computes proportional contained dimensions without upscaling smaller images', () => {
    expect(computeContainedDimensions(4032, 3024, AI_IMAGE_MAX_DIMENSION_PX)).toEqual({
      width: 1600,
      height: 1200,
    });
    expect(computeContainedDimensions(3024, 4032, AI_IMAGE_MAX_DIMENSION_PX)).toEqual({
      width: 1200,
      height: 1600,
    });
    expect(computeContainedDimensions(1080, 1350, AI_IMAGE_MAX_DIMENSION_PX)).toEqual({
      width: 1080,
      height: 1350,
    });
  });

  it('computes centered square crop rectangles for portrait, landscape, and square avatars', () => {
    expect(computeSquareCropRect(4000, 3000)).toEqual({
      sx: 500,
      sy: 0,
      sWidth: 3000,
      sHeight: 3000,
    });
    expect(computeSquareCropRect(3000, 4000)).toEqual({
      sx: 0,
      sy: 500,
      sWidth: 3000,
      sHeight: 3000,
    });
    expect(computeSquareCropRect(AVATAR_TARGET_SIZE_PX, AVATAR_TARGET_SIZE_PX)).toEqual({
      sx: 0,
      sy: 0,
      sWidth: 512,
      sHeight: 512,
    });
  });

  it('returns original file safely when running outside a browser canvas environment', async () => {
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'photo.jpg', {
      type: 'image/jpeg',
    });
    expect(await compressAvatarImage(file)).toBe(file);
    expect(await compressAiTimetableImage(file)).toBe(file);
  });
});
