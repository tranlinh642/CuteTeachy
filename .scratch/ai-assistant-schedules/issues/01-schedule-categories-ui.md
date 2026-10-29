# 01: S7-FE-01 — Hiển thị, Tạo/Sửa và Lọc theo 3 Loại lịch (`ScheduleCategory`) trên Thời khóa biểu & Lịch

**What to build:** Giáo viên chọn được loại lịch (`Lịch trên lớp` / `Lịch dạy thêm` / `Lịch học thêm`) khi tạo/sửa `TimetableSlot` và `ClassSession` buổi lẻ, đồng thời nhìn thấy nhãn phân biệt và bộ lọc theo loại lịch trên màn hình Thời khóa biểu và Lịch.

**Blocked by:** None (can start immediately)

**Status:** in-progress

- [ ] Mở rộng kiểu `TimetableSlot` và `ClassSession` trên FE với `category: 'school_teaching' | 'extra_teaching' | 'self_study'` (mặc định `'school_teaching'`).
- [ ] Bổ sung bộ chọn `ScheduleCategory` vào `TimetableSlotDialog` và `AdHocSessionDialog`.
- [ ] Hiển thị badge/icon phân biệt 3 loại lịch trên `TimetableSlotCard`, `ClassCard`, `SessionDetailDialog` và thêm bộ lọc nhanh theo loại lịch trên màn hình Thời khóa biểu / Lịch.
- [ ] Cập nhật `session-generator` và mock handlers trên FE để kế thừa và lưu đúng `category`.
- [ ] Unit test đầy đủ; `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
