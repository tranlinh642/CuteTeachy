# 03: S7-INT — Tích hợp End-to-End Trợ lý AI & 3 Loại lịch (FE ↔ BE)

**What to build:** Toàn bộ luồng 3 loại lịch (`ScheduleCategory`) và Trợ lý AI Đa phương thức (gửi ảnh/tin nhắn, xác nhận `AI Schedule Draft`, hỏi việc trong ngày, tự xóa ảnh sau 45 ngày) hoạt động đồng bộ giữa FE và BE.

**Blocked by:** S7-BE-02, S7-FE-02, S6-INT

**Status:** done

- [x] Khớp hoàn toàn contract HTTP giữa `CuteTeachy-FE` và `CuteTeachy-BE` cho `ScheduleCategory` và `/ai-assistant/*`.
- [x] Toàn bộ unit test và e2e test ở cả 2 repo đều xanh (`pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm test:e2e`).
