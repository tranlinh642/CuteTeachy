/**
 * Định dạng ngày bổ sung cho bộ chọn (dựa trên `Intl`, không có chuỗi cứng).
 * Tên thứ/tháng khác dùng formatter của `@/utils`.
 */

/** "14/10/2026" (vi) · "10/14/2026" (en). */
export const formatNumericDate = (date: Date, localeTag: string): string =>
  new Intl.DateTimeFormat(localeTag, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);

/** Nhãn đầy đủ cho trình đọc màn hình: "Thứ Tư, 14 tháng 10, 2026". */
export const formatFullDate = (date: Date, localeTag: string): string =>
  new Intl.DateTimeFormat(localeTag, { dateStyle: 'full' }).format(date);

/** Locale dùng đồng hồ 12 giờ (SA/CH) hay 24 giờ. */
export const usesHour12 = (localeTag: string): boolean =>
  new Intl.DateTimeFormat(localeTag, { hour: 'numeric' }).resolvedOptions().hour12 ?? false;
