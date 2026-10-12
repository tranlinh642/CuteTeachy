/**
 * Helper thêm độ trong suốt (alpha) cho mã màu hex 6 chữ số (#RRGGBB).
 * Fallback giữ nguyên chuỗi màu nếu không khớp định dạng hex 6 ký tự.
 */
export function withAlpha(hex: string, alpha: number): string {
  const match = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex);
  if (!match) return hex;
  const r = parseInt(match[1]!, 16);
  const g = parseInt(match[2]!, 16);
  const b = parseInt(match[3]!, 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
