# 02: S7-FE-02 — Giao diện Trợ lý AI (`/assistant` & Floating Drawer) + Thẻ xác nhận Bản nháp (`AI Schedule Draft`)

**What to build:** Giáo viên mở được Trợ lý AI từ thanh điều hướng (`/assistant`) hoặc nút nổi nhanh tại màn hình Lịch/Thời khóa biểu, gửi ảnh chụp TKB hoặc tin nhắn văn bản, xem và chỉnh sửa thẻ Bản nháp lịch (`AI Schedule Draft`), chọn chế độ xử lý trùng lịch (`Thay thế lịch trùng` / `Bỏ qua mục trùng`) và bấm Xác nhận để lưu vào tài khoản.

**Blocked by:** 01 (S7-FE-01 — Hiển thị, Tạo/Sửa và Lọc theo 3 Loại lịch `ScheduleCategory`)

**Status:** ready-for-agent

- [ ] Tạo service, hooks và mock handlers cho `/ai-assistant/messages` và `/ai-assistant/drafts/:messageId/apply`.
- [ ] Xây dựng trang `/assistant` và nút mở nhanh `AiAssistantFabDrawer` trên màn hình Lịch / Thời khóa biểu.
- [ ] Hỗ trợ chọn/chụp ảnh Thời khóa biểu (`JPEG/PNG/WebP` ≤ 5MB) kèm xem trước ảnh và gửi tin nhắn văn bản, cùng các chip gợi ý câu hỏi nhanh (*"Hôm nay tôi có lịch gì?"*, *"Liệt kê việc trong tuần này"*).
- [ ] Xây dựng thẻ tương tác `AiScheduleDraftCard`: hiển thị danh sách mục lịch đề xuất, cho phép bỏ chọn hoặc sửa nhanh từng mục, hiển thị cảnh báo mục bị trùng giờ với lịch hiện có, chọn `replace_conflicts` hoặc `skip_conflicts`, bấm Xác nhận và tự động invalidate cache của `timetableSlots`, `classSessions`, `tasks`.
- [ ] Unit test đầy đủ; `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
