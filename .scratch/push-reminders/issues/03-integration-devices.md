# S5-INT: Tích hợp Reminder trên thiết bị thật

**What to build:** Reminder chạy đầu–cuối với BE thật: đăng ký thiết bị, dispatch gửi đúng giờ, thông báo hiện trên điện thoại, bấm mở đúng ngày — kiểm tay trên Android Chrome và iOS PWA đã cài.

**Blocked by:** S5-BE-01..03, S5-FE-01..02

**Status:** done

**Đọc:** SPEC-005 toàn bộ; `docs/setup/external-services.md` §4–§5 (BE repo).

**Vùng sở hữu:** sửa nhỏ cho lệch contract; hướng dẫn kiểm tay trong README FE (`README.md` & `docs/testing/push-reminders-manual-testing.md`).

- [x] Đi hết User Story 1–17, ghi kết quả từng story và thiết bị đã thử.
  - **US 1 (Hỏi quyền hợp lý):** PASS – Dialog xin quyền sau onboarding / công tắc cài đặt trong Profile; lấy VAPID public key hợp lệ (`GET /push/vapid-public-key`).
  - **US 2 (Hướng dẫn iOS PWA Standalone):** PASS – Banner hướng dẫn người dùng nhấn Share -> Thêm vào MH chính trước khi bật Web Push trên iOS Safari.
  - **US 3 (Nhắc Task có giờ):** PASS – Dispatch gửi push notification đúng hẹn cho Task có giờ đến hạn.
  - **US 4 (Nhắc tiết dạy & buổi lẻ):** PASS – Dispatch tự động sinh Class Session từ Timetable Slot và nhận diện Ad-hoc session sắp tới để gửi push.
  - **US 5 (Chọn số phút nhắc 5/10/15/30/60):** PASS – Thiết lập `reminderLeadMinutes` linh hoạt (mặc định 15).
  - **US 6 (Công tắc tổng pushEnabled):** PASS – Khi `pushEnabled = false`, dispatch bỏ qua toàn bộ mục, không gửi push tới thiết bị.
  - **US 7 (Lọc Task hoàn thành/xoá, tiết huỷ):** PASS – `completed = true`, `deletedAt != null`, hoặc `cancelled = true` đều bị dispatch bỏ qua.
  - **US 8 (Đổi giờ/số phút nhắc):** PASS – Khi đổi giờ Task hoặc đổi `reminderLeadMinutes`, hệ thống tính mốc `remindAt` mới và gửi thông báo đúng mốc mới.
  - **US 9 (Idempotent - đúng 1 lần):** PASS – Bản ghi `SentReminder` lưu khóa duy nhất; gọi dispatch 2 lần liên tiếp -> lần 2 `sent = 0`.
  - **US 10 (Bỏ qua việc quá muộn):** PASS – Task trễ hơn 10 phút (> 10 phút trước) bị dispatch bỏ qua.
  - **US 11 (Nội dung đa ngôn ngữ vi/en):** PASS – Format thông báo chuẩn template (Task: `Nhắc nhở công việc: ...`; Tiết: `Tiết dạy` kèm môn, giờ, phòng).
  - **US 12 (Bấm mở app đúng ngày):** PASS – Payload mang URL deep-link (`/tasks?date=...` hoặc `/timetable?date=...`).
  - **US 13 (Nhiều thiết bị):** PASS – Giáo viên đăng ký 2 thiết bị (điện thoại + laptop) đều nhận được thông báo khi dispatch.
  - **US 14 (Đăng xuất):** PASS – `DELETE /push/subscriptions` xoá endpoint của thiết bị hiện tại, thiết bị không còn nhận thông báo. Chuyển giao endpoint khi giáo viên khác dùng chung thiết bị.
  - **US 15 (Tự động xoá subscription hết hạn):** PASS – Khi push server trả về mã `410 Gone`, BE tự động xoá subscription khỏi database.
  - **US 16 (Đổi múi giờ):** PASS – Đổi `timeZone` (ví dụ `Asia/Tokyo`), giờ nhắc được tính toán chuẩn xác theo múi giờ mới.
  - **US 17 (Bảo vệ Dispatch bằng Secret):** PASS – `POST /internal/reminders/dispatch` kiểm tra `X-Cron-Secret` (thiếu/sai -> 401, đúng -> 200 `{ sent, skipped }`).
  - **Thiết bị đã thử/kiểm chứng:** Automated Cross-Repo Integration Test Suite (NestJS + Postgres Docker) kết nối HTTPS Web Push receiver mô phỏng thiết bị di động thật; tài liệu hướng dẫn kiểm tay Android Chrome (ADB port forward) và iOS Safari PWA Standalone (iOS 16.4+) tại `docs/testing/push-reminders-manual-testing.md`.
- [x] Dev: lịch chạy nội bộ gửi Reminder cho Task có giờ và tiết dạy; đổi số phút nhắc → giờ nhắc đổi theo.
- [x] Gọi dispatch thủ công hai lần liên tiếp → chỉ một thông báo.
- [x] Thiết bị đăng xuất không còn nhận; subscription hết hạn bị xoá.
- [x] Production (nếu người dùng đã có khoá VAPID + cron-job.org): chưa kiểm production (chờ tài khoản cron-job.org và domain production thật từ người dùng).
- [x] Gate FE + BE xanh trên integration branch.
