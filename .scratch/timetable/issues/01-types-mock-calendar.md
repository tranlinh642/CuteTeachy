# S4-FE-01: Kiểu dữ liệu, mock thời khoá biểu và lịch hiển thị buổi huỷ/buổi lẻ

**What to build:** Lịch tuần và tháng hiển thị Class Session sinh từ thời khoá biểu (trên mock backend), buổi đã huỷ hiển thị mờ/gạch, buổi lẻ có dấu riêng. Đây là ticket nền cho S4-FE-02, S4-FE-03.

**Blocked by:** S3-FE-01

**Status:** in-progress

**Đọc:** SPEC-004 mục *Class Session*, *API*, *Thay đổi FE*; `GLOSSARY.md`.

**Vùng sở hữu:** kiểu `TimetableSlot`, `ClassSession` (thêm `timetableSlotId`, `cancelled`, `updatedAt`; `room` tùy chọn), service + hook timetable/class-session, mock handler + seed (thay dữ liệu tiết dạy giả bằng slot + bản ghi đè), hiển thị buổi trong dashboard tuần và lịch tháng.

- [ ] Mock backend sinh buổi từ slot theo đúng quy tắc SPEC-004 (id ổn định, khoảng hiệu lực, áp bản ghi đè, buổi lẻ) — endpoint `/timetable-slots` và `/class-sessions` đủ contract.
- [ ] Seed mock tạo thời khoá biểu tương đương dữ liệu tiết dạy giả hiện tại.
- [ ] Lịch đọc `/class-sessions` theo khoảng (≤ 42 ngày) + `updatedSince`.
- [ ] Buổi `cancelled` hiển thị khác biệt rõ (kèm nhãn cho screen reader); buổi lẻ có dấu "Dạy bù/thay".
- [ ] Mọi chỗ đang dùng `room` xử lý được giá trị trống.
- [ ] Unit test mock: sinh buổi qua ranh giới tháng, áp bản ghi đè; `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
