# S5-FE-02: Service worker hiển thị Reminder và mở đúng ngày

**What to build:** Khi BE gửi Reminder, thiết bị hiển thị thông báo với nội dung đúng; bấm vào thông báo mở (hoặc đưa lên trước) app tại ngày của việc/tiết đó.

**Blocked by:** None (can start immediately — chỉ phụ thuộc payload trong SPEC-005)

**Status:** done

**Đọc:** SPEC-005 mục *Reminder* (nội dung, URL), *Thay đổi FE*; User Stories 11–12.

**Vùng sở hữu:** service worker (sự kiện `push`, `notificationclick`), hàm thuần dựng thông báo từ payload, icon/badge thông báo.

- [x] Hàm thuần nhận payload → `{ title, body, url, tag }`; payload thiếu trường → vẫn hiển thị nội dung mặc định an toàn.
- [x] `push`: hiển thị thông báo bằng kết quả hàm thuần (`tag` theo mục để không chồng thông báo trùng).
- [x] `notificationclick`: đóng thông báo, focus tab app nếu đang mở và điều hướng tới URL, nếu không thì mở cửa sổ mới.
- [x] Unit test hàm thuần (đủ trường, thiếu trường, URL ngày); không phá cache/Background Sync hiện có của service worker.
- [x] `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
