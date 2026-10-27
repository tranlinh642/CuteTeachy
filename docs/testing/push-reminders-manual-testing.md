# Hướng dẫn kiểm thử thủ công Web Push Reminders (SPEC-005)

Tài liệu hướng dẫn kiểm thử đầu–cuối tính năng thông báo nhắc việc (Task) và tiết dạy (Timetable Slot / Class Session) trên thiết bị thật theo chuẩn Web Push VAPID (SPEC-005).

---

## 1. Yêu cầu & Chuẩn bị môi trường

### 1.1. Hạ tầng Backend (`CuteTeachy-BE`)
1. Khởi động Docker container cơ sở dữ liệu Postgres:
   ```sh
   docker compose up -d
   ```
2. Cặp khoá VAPID và Cron Secret trong `.env`:
   - `VAPID_PUBLIC_KEY`: Khóa công khai VAPID (cung cấp cho Frontend).
   - `VAPID_PRIVATE_KEY`: Khóa bí mật VAPID ký push payload.
   - `VAPID_SUBJECT`: `mailto:dev@cuteteachy.local`
   - `CRON_SECRET`: Bí mật xác thực endpoint dispatch nội bộ (mặc định: `dev-cron-secret-token`).
3. Khởi động server BE:
   ```sh
   pnpm dev
   ```
   Backend lắng nghe tại `http://localhost:4000`.

### 1.2. Mạng và điều kiện bảo mật cho thiết bị di động (Secure Context)
Trình duyệt di động (Chrome, Safari) **bắt buộc** ngữ cảnh an toàn (HTTPS hoặc `localhost`) để kích hoạt Service Worker và cấp quyền `Notification.requestPermission()`.

- **Đối với Android (Khuyên dùng qua Chrome USB Debugging):**
  1. Kết nối điện thoại Android với máy tính qua cáp USB, bật *USB Debugging*.
  2. Chạy lệnh forward port từ terminal máy tính:
     ```sh
     adb forward tcp:3000 tcp:3000
     adb forward tcp:4000 tcp:4000
     ```
  3. Mở Google Chrome trên Android, truy cập trực tiếp `http://localhost:3000`. Chrome coi `localhost` là Secure Context hợp lệ.

- **Đối với iOS (iPhone / iPad) hoặc Android qua Wi-Fi:**
  - Safari trên iOS từ chối Service Worker trên địa chỉ IP mạng nội bộ HTTP (`http://192.168.x.x:3000`).
  - Sử dụng tunnel HTTPS (Cloudflare Tunnel hoặc ngrok):
    ```sh
    cloudflared tunnel --url http://localhost:3000
    # Hoặc
    ngrok http 3000
    ```
  - Truy cập URL HTTPS được cấp trên thiết bị di động.

---

## 2. Kịch bản kiểm thử trên Android Chrome

### Các bước thực hiện:
1. Mở Chrome trên Android, truy cập app CuteTeachy.
2. Đăng ký tài khoản giáo viên mới và hoàn thành onboarding (nhập tên, chọn giới tính).
3. Đăng ký nhận thông báo:
   - Cách 1: Hộp thoại xin quyền tự động xuất hiện sau khi hoàn tất onboarding.
   - Cách 2: Vào **Hồ sơ (Profile)** -> Bật công tắc **"Nhận thông báo nhắc nhở"**.
4. Trình duyệt hiển thị popup hệ thống: *"cuteteachy muốn gửi thông báo cho bạn"*. Bấm **"Cho phép" (Allow)**.
5. Kiểm tra DevTools / Network:
   - Request `GET /push/vapid-public-key` trả về 200 `{ publicKey: "..." }`.
   - Request `POST /push/subscriptions` gửi endpoint và keys thành công (201 Created).
6. Tạo dữ liệu cần nhắc:
   - **Task:** Tạo một việc cần làm có giờ bắt đầu sau hiện tại đúng 15 phút (khớp `reminderLeadMinutes = 15`).
   - **Tiết dạy:** Tạo một tiết trong Thời khoá biểu cho thứ hôm nay, giờ bắt đầu sau hiện tại 15 phút.
7. Kích hoạt gửi thông báo (Dispatcher):
   - Từ terminal máy tính, gọi lệnh kích hoạt dispatch:
     ```sh
     curl -X POST http://localhost:4000/internal/reminders/dispatch \
       -H "X-Cron-Secret: dev-cron-secret-token"
     ```
   - Kết quả trả về: `{"sent": 2, "skipped": 0}` (hoặc tương ứng số lượng mục đến hạn).
8. Quan sát trên điện thoại:
   - Thông báo xuất hiện trên thanh trạng thái (Notification Shade) kèm chuông/rung.
   - Tiêu đề:
     - Task: `Nhắc nhở công việc: <Tiêu đề>` (Tiếng Việt) hoặc `Task reminder: <Title>` (Tiếng Anh).
     - Tiết dạy: `Tiết dạy` kèm nội dung `<Môn> - <Lớp>, <Giờ>, <Phòng>`.
9. Kiểm tra điều hướng:
   - Chạm vào thông báo: Ứng dụng tự động mở ra đúng màn hình và ngày của Task (`/tasks?date=YYYY-MM-DD`) hoặc Thời khoá biểu (`/timetable?date=YYYY-MM-DD`).

---

## 3. Kịch bản kiểm thử trên iOS Safari (PWA Standalone)

> [!IMPORTANT]
> **Đặc thù của iOS (iOS 16.4 trở lên):** Apple Safari **chỉ hỗ trợ** Web Push API khi ứng dụng web được thêm vào màn hình chính dưới dạng **PWA Độc lập (Standalone PWA)**. Chạy trong tab Safari thông thường sẽ không thể bật thông báo.

### Các bước thực hiện:
1. Mở Safari trên iPhone, truy cập URL HTTPS của ứng dụng CuteTeachy.
2. Đăng nhập tài khoản giáo viên.
3. Banner hướng dẫn cài đặt PWA sẽ hiển thị ở cuối màn hình:
   - Nhấn vào biểu tượng **Chia sẻ (Share)** ở thanh điều hướng Safari (hình vuông có mũi tên chỉ lên).
   - Cuộn xuống chọn **"Thêm vào MH chính" (Add to Home Screen)**.
   - Đặt tên và nhấn **"Thêm" (Add)**.
4. Đóng Safari. Chạm vào biểu tượng **CuteTeachy** mới xuất hiện trên Màn hình chính của iPhone (app sẽ mở ở chế độ toàn màn hình Standalone PWA).
5. Điều hướng vào **Hồ sơ (Profile)** -> Bật công tắc **"Nhận thông báo nhắc nhở"**.
6. Hộp thoại hệ thống iOS xuất hiện: *"“CuteTeachy” Muốn Gửi Thông Báo Cho Bạn"*.
7. Nhấn **"Cho phép" (Allow)**.
8. Tạo Task hoặc Tiết dạy có giờ bắt đầu sau 15 phút.
9. Gọi kích hoạt dispatch bằng curl/Postman qua header `X-Cron-Secret`.
10. Quan sát trên iPhone:
    - Banner thông báo xuất hiện trên Màn hình khóa (Lock Screen) và Trung tâm thông báo (Notification Center).
    - Chạm vào banner: App CuteTeachy PWA mở ra tức thì tại đúng ngày diễn ra công việc/tiết dạy.

---

## 4. Kiểm tra các ca biên & Logic nghiệp vụ (Edge Cases)

| STT | Kịch bản kiểm tra | Thao tác | Kết quả mong đợi |
| --- | ------------------ | -------- | ---------------- |
| 1 | **Chống spam (Idempotent)** | Chạy lệnh dispatch lần thứ 2 liên tiếp ngay sau lần 1 | Lần 2 trả lời `sent: 0`. Điện thoại **không** nhận thêm thông báo trùng lặp nào. |
| 2 | **Đổi số phút nhắc trước** | Vào Profile đổi từ 15 phút sang 30 phút. Đặt Task cách 30 phút | Dispatch gửi thông báo theo mốc 30 phút mới. |
| 3 | **Task hoàn tất / xoá** | Tick hoàn thành Task (`completed = true`) hoặc xoá Task | Dispatch bỏ qua, không gửi thông báo (`skipped` tăng). |
| 4 | **Tiết dạy bị huỷ** | Vào chi tiết buổi dạy chọn "Huỷ tiết này" (`cancelled = true`) | Dispatch bỏ qua, không gửi thông báo. |
| 5 | **Công tắc tổng (Tắt)** | Tắt công tắc thông báo trong Hồ sơ | Mọi dispatch đều bỏ qua, không gửi đến thiết bị của giáo viên này. |
| 6 | **Đăng xuất (Logout)** | Nhấn Đăng xuất trên thiết bị | Endpoint subscription của thiết bị được xoá khỏi hệ thống (`DELETE /push/subscriptions`). Thiết bị không còn nhận thông báo. |
| 7 | **Đổi múi giờ** | Đổi timeZone sang múi giờ khác trong cài đặt | Giờ nhắc được tính toán chuẩn xác theo múi giờ mới của giáo viên. |
| 8 | **Nhiều thiết bị** | Đăng nhập trên cả điện thoại và máy tính, bật thông báo cả 2 | Khi có việc đến hạn, cả 2 thiết bị cùng nhận được thông báo. |

---

## 5. Kiểm tra môi trường Production (cron-job.org)

Nếu đã triển khai Backend lên môi trường trực tuyến và cấu hình tài khoản cron-job.org:
1. Đăng nhập trang quản trị `cron-job.org`.
2. Tạo cron job mới:
   - **URL:** `https://<backend-domain>/internal/reminders/dispatch`
   - **Schedule:** Chạy mỗi 1 phút (`* * * * *`).
   - **HTTP Method:** `POST`
   - **Headers:** `X-Cron-Secret: <production-cron-secret>`
   - **Timeout:** 30 giây.
3. Kiểm tra log thực thi trên cron-job.org:
   - Mã HTTP trả về: `200 OK`.
   - Response body: `{"sent": <số lượng>, "skipped": <số lượng>}`.
   - Thời gian phản hồi: < 2 giây.

*Ghi chú:* Nếu chưa cấu hình khoá VAPID và cron-job.org trên môi trường production của người dùng, đánh dấu rõ trong biên bản: **"Chưa kiểm production (chờ tài khoản cron-job.org và domain thật)"**.
