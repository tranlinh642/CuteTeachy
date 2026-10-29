# 02: S6-FE-02 — Chuông Thông báo (`NotificationBell`), Trung tâm Thông báo & Bộ đếm `LocalReminderTicker`

**What to build:** Thanh Topbar có biểu tượng Chuông thông báo hiển thị số lượng thông báo chưa đọc, mở danh sách `InAppNotification` để xem và điều hướng tới mục lịch/ghi chú; đồng thời bộ đếm `LocalReminderTicker` chạy ngầm để bật Toast/Banner thông báo ngay tại giây đến hạn khi giáo viên đang mở ứng dụng.

**Blocked by:** 01 (S6-FE-01 — Giờ nhắc Ghi chú, Xin quyền iOS/Android & Nút Gửi thông báo thử)

**Status:** in-progress

- [ ] Tạo service, hooks và mock handlers cho `/notifications`, `/notifications/:id/read`, `/notifications/read-all`.
- [ ] Đặt `NotificationBell` lên thanh Topbar trong `AppShell`, hiển thị badge `unreadCount`, popover/drawer danh sách thông báo, nút đánh dấu đã đọc từng mục hoặc tất cả, bấm vào điều hướng đúng `url`.
- [ ] Xây dựng `LocalReminderTicker` kiểm tra định kỳ các `Task`, `ClassSession`, `Note` sắp đến hạn theo `reminderLeadMinutes`, bật Toast/Banner nổi trong ứng dụng đúng thời điểm nhắc mà không báo trùng (dùng chung định dạng `tag` với Service Worker).
- [ ] Unit test cho `NotificationBell` và `LocalReminderTicker`; `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
