# Spec 006: Dual-Layer Notifications, Mobile Permission Flow & Note Reminders

- **Trạng thái:** ready-for-agent
- **Phạm vi:** `CuteTeachy-BE` + `CuteTeachy-FE`
- **Nguồn:** [ADR BE 0006 — Hệ thống Thông báo 2 tầng](../../../CuteTeachy-BE/docs/adr/0006-dual-layer-notifications.md) · [ADR BE 0002 — Reminder qua cron ngoài](../../../CuteTeachy-BE/docs/adr/0002-external-cron-reminders.md) · [ADR BE 0005 — Serverless trên Vercel](../../../CuteTeachy-BE/docs/adr/0005-serverless-on-vercel.md)
- **Phụ thuộc:** SPEC-003 (Task, Note, Settings), SPEC-004 (Timetable Slot, Class Session), SPEC-005 (Push & Reminder).
- **Thuật ngữ:** Reminder, In-App Notification, Note, Task, Class Session — [`GLOSSARY.md`](../../GLOSSARY.md)

## Problem Statement

Thông báo và lời nhắc là tính năng sống còn đối với giáo viên, nhưng hệ thống hiện tại (SPEC-005) chỉ dựa vào một tầng Web Push duy nhất và còn nhiều điểm mù thực tế:
1. Khi giáo viên đang mở trực tiếp ứng dụng trên màn hình hoặc khi trình duyệt/hệ điều hành chặn Web Push ngầm, giáo viên không thấy biểu tượng Chuông thông báo, không có trung tâm lưu lịch sử thông báo chưa đọc, và không có bộ đếm tại chỗ để báo ngay lập tức.
2. Trên iOS (Safari, Chrome, Edge trên iPhone/iPad), hàm kiểm tra thiết bị hiện tại bỏ sót các trình duyệt ngoài Safari trên iOS và banner xin quyền bị ẩn cho đến khi tạo xong mục đầu tiên, khiến nhiều giáo viên dùng iOS và Android không biết cách bật thông báo hoặc không có nút kiểm tra xem thiết bị đã nhận thông báo thành công chưa.
3. Bộ quét Reminder hiện chỉ sinh Class Session cho đúng ngày `teacherToday`, gây lỗi bỏ sót lời nhắc khi tiết học hoặc công việc diễn ra ngay sau nửa đêm (ví dụ `00:05` ngày hôm sau nhưng thời điểm nhắc trước 15 phút rơi vào `23:50` ngày hôm trước).
4. Ghi chú (`Note`) có ngày hạn (`dueDate`) nhưng chưa có giờ nhắc (`remindTime`) và chưa được đưa vào luồng nhắc việc.

## Solution

Nâng cấp hệ thống thông báo lên kiến trúc 2 tầng đồng bộ và toàn diện:
1. **Tầng 1 (In-App Notification Center & Local Real-time Ticker):** Mọi lời nhắc đến hạn đều được lưu thành `In-App Notification` có trạng thái đã đọc/chưa đọc (`readAt`), hiển thị tại biểu tượng Chuông trên thanh Topbar kèm badge số lượng chưa đọc. Đồng thời, một bộ đếm thời gian thực ngay trên trình duyệt (`LocalReminderTicker`) kiểm tra các mục sắp đến hạn trong ngày để hiển thị Toast/Banner nổi và âm báo nhẹ đúng từng giây ngay cả khi Web Push bị chặn.
2. **Tầng 2 (Web Push nền + Luồng xin quyền iOS/Android + Test Push):** Chuẩn hóa nhận diện mọi trình duyệt trên iOS (hướng dẫn cài PWA ra Màn hình chính kèm nút kích hoạt 1 chạm khi đã ở chế độ standalone) và Android (xin quyền trực tiếp); bổ sung nút **"Gửi thông báo thử"** trong phần cài đặt thông báo để giáo viên xác nhận thiết bị hoạt động ngay lập tức.
3. **Sửa lỗi biên nửa đêm & Mở rộng sang Note:** Bộ điều phối quét đồng thời 3 ngày liền kề (`yesterday`, `today`, `tomorrow` theo múi giờ của giáo viên) để không bao giờ sót lịch qua nửa đêm. Bổ sung `remindTime` (tùy chọn, `HH:mm`) cho `Note`: nếu có `dueDate` + `remindTime` thì nhắc trước `reminderLeadMinutes`; nếu chỉ có `dueDate` thì nhắc vào `07:00` sáng ngày `dueDate`.

## User Stories

1. As a teacher using the app on desktop or mobile, I want to see a notification bell icon in the top bar with an unread badge count, so that I immediately know if I have missed any upcoming schedule or note reminders.
2. As a teacher, I want to click the notification bell to open an In-App Notification Center listing my recent reminders, so that I can review what was reminded and jump directly to the relevant day or note.
3. As a teacher, I want to mark an individual In-App Notification as read or mark all notifications as read at once, so that I can keep my notification list clean.
4. As a teacher who has the app open in a browser tab where Web Push is blocked or unsupported, I want an in-app toast banner to pop up at the exact reminder time via a local ticker, so that my base notification experience always works reliably.
5. As a teacher using an Android phone, I want a clear prompt and one-tap button to grant notification permission on my device without waiting for hidden triggers, so that I can enable push notifications immediately after onboarding.
6. As a teacher using an iPhone or iPad on any browser (Safari, Chrome, Edge, Firefox on iOS), I want clear step-by-step instructions to add the app to my Home Screen when not in standalone mode, so that I understand how iOS Web Push works.
7. As a teacher opening the installed Home Screen PWA on iOS, I want a dedicated one-tap button to request iOS notification permission, so that Apple's user-gesture requirement is satisfied smoothly.
8. As a teacher, I want a "Send Test Notification" button in my Profile/Notification settings, so that I can verify both Web Push and In-App Notification delivery on my phone or laptop right away.
9. As a teacher creating or editing a Note with a `dueDate`, I want to optionally pick a `remindTime` (`HH:mm`), so that I receive a Reminder before that specific time just like a timed Task.
10. As a teacher creating a Note with only a `dueDate` and no `remindTime`, I want to receive a Reminder at `07:00` morning local time on that `dueDate`, so that I remember my due notes for the day.
11. As a teacher who completes or deletes a Note, I want the system to skip sending any Reminder for that Note, so that I am not bothered by finished items.
12. As a teacher who changes a Note's `dueDate` or `remindTime`, I want the Reminder to reschedule to the new time automatically, so that my updated note deadline is respected.
13. As a teacher with an early class session or task right after midnight (e.g. `00:10` with a 15-minute lead time), I want the reminder to fire accurately at `23:55` the night before, so that midnight boundaries never drop my reminders.
14. As a teacher with `pushEnabled = false` in Settings, I want Web Push to be paused across my devices while still being able to re-enable it anytime, so that I control when my phone buzzes.

## Implementation Decisions

### Mở rộng Note cho Reminder
- Bổ sung trường tùy chọn `remindTime?: string | null` (định dạng `HH:mm`, `00:00`–`23:59`) vào entity `Note`, bảng `notes` trong Prisma, các DTO/mapper tạo/sửa/đồng bộ Note ở cả BE và FE.
- Quy tắc tính thời điểm nhắc (`remindAt`) cho `Note` chưa hoàn thành (`completed = false`) và chưa xóa (`deletedAt = null`) có `dueDate`:
  - Nếu có `remindTime`: `remindAt = (dueDate + remindTime theo timeZone của giáo viên) - reminderLeadMinutes`.
  - Nếu `remindTime` là `null`/trống: `remindAt = (dueDate + "07:00" theo timeZone của giáo viên)` (nhắc cố định đầu ngày lúc 07:00 sáng, không trừ `reminderLeadMinutes`).
- Mở rộng `ReminderType` thành `'task' | 'class_session' | 'note'`.
- URL điều hướng khi bấm vào thông báo của Note: `/notes?noteId=<id>`.

### Kiến trúc Thông báo 2 tầng & Sửa lỗi biên nửa đêm
- **Bảng `in_app_notifications` (`InAppNotification`):**
  - Trường: `id` (UUID), `accountId`, `type` (`'task' | 'class_session' | 'note' | 'system'`), `targetId` (nullable), `title`, `body`, `url`, `data` (JSON), `readAt` (`DateTime?`), `createdAt` (`DateTime`).
  - Mỗi khi `DispatchRemindersUseCase` xác định một mục đến hạn trong cửa sổ `(now - 10 phút, now]` và chưa có trong `sent_reminders` theo khoá `(type, targetId, remindAt)`:
    1. Tạo bản ghi `InAppNotification` lưu vào DB cho `accountId` (luôn tạo kể cả khi giáo viên chưa có `PushSubscription` trên trình duyệt, miễn là mục đó đến hạn nhắc).
    2. Nếu `settings.pushEnabled === true`, gửi Web Push tới tất cả thiết bị đăng ký của giáo viên qua `SendPushToTeacherUseCase`.
    3. Ghi nhận bản ghi `SentReminder` theo khoá idempotent `(type, targetId, remindAt)` ngay khi đã lưu `InAppNotification` (hoặc gửi push) để đảm bảo mỗi mốc nhắc chỉ phát sinh đúng 1 lần.
  - Dọn dẹp định kỳ: xóa các `InAppNotification` cũ quá 30 ngày trong bước housekeeping của `DispatchRemindersUseCase`.
- **Quét bù biên nửa đêm:**
  - Khi tính `ClassSession` và kiểm tra ứng viên nhắc việc trong `DispatchRemindersUseCase`, tính 3 mốc ngày theo `timeZone` của giáo viên: `yesterday`, `today`, `tomorrow`.
  - Sinh `ClassSession` trên khoảng `[yesterday, tomorrow]` và lấy các `Note` / `Task` có ngày thuộc `[yesterday, tomorrow]` để mọi thời điểm `remindAt` lùi qua ranh giới `00:00` đều nằm trong tập ứng viên.
- **Bộ đếm thời gian thực tại FE (`LocalReminderTicker`):**
  - Chạy ngầm trong `AppShell` khi giáo viên đã đăng nhập (chu kỳ kiểm tra mỗi 15 giây + khi tab được focus lại).
  - Dựa trên danh sách `Task`, `ClassSession`, `Note` đang có trên client và `settings.reminderLeadMinutes`, phát hiện mục vừa chạm mốc `remindAt` trong vòng 2 phút gần nhất, đối chiếu khóa idempotent trong `localStorage` để không báo trùng:
    - Hiển thị Toast/Banner thông báo nổi ngay lập tức trong giao diện kèm nút bấm chuyển tới mục đó.
    - Đồng thời làm mới (`invalidateQueries`) danh sách `InAppNotification` trên biểu tượng Chuông.
    - Nếu trình duyệt đã cấp quyền `Notification.permission === 'granted'` và tab đang ẩn, có thể gọi `registration.showNotification` cục bộ nếu server push chưa tới kịp (dùng chung `tag: "${type}-${targetId}-${remindAt.getTime()}"` với Service Worker để hệ điều hành tự động gộp, không bao giờ hiện 2 thông báo trùng nhau).

### Luồng xin quyền iOS & Android + Nút Gửi thông báo thử
- **Nhận diện iOS chuẩn xác:** Sửa hàm nhận diện thiết bị iOS trên FE để nhận biết mọi trình duyệt chạy trên iPhone/iPad/iPod (`/iphone|ipad|ipod/i` hoặc iPadOS `MacIntel` với `maxTouchPoints > 1`), vì toàn bộ trình duyệt trên iOS đều dùng WebKit và đều bắt buộc phải thêm PWA vào Màn hình chính (`isStandaloneMode`) mới dùng được `PushManager`.
- **Giao diện xin quyền chủ động:**
  - Hiển thị thẻ/nút bật thông báo trực quan tại trang Tổng quan (Dashboard), trong menu Chuông thông báo (nếu thiết bị hiện tại chưa bật push), và trong trang Hồ sơ (`ProfileView`).
  - Trên **Android / Desktop**: Bấm nút kích hoạt trực tiếp `Notification.requestPermission()` $\rightarrow$ đăng ký `pushManager.subscribe` $\rightarrow$ `POST /push/subscriptions`.
  - Trên **iOS chưa cài PWA (`ios_needs_pwa`)**: Hiển thị hộp thoại hướng dẫn trực quan 3 bước (Bấm biểu tượng Chia sẻ $\rightarrow$ Chọn "Thêm vào Màn hình chính" $\rightarrow$ Mở ứng dụng từ Màn hình chính).
  - Trên **iOS đã mở từ Màn hình chính (`isStandalone === true`)**: Hiển thị nút 1 chạm "Bật thông báo trên iPhone/iPad" gắn trực tiếp vào sự kiện `onClick` để thỏa mãn yêu cầu user gesture của iOS.
- **Endpoint Gửi thông báo thử (`POST /push/subscriptions/test`):**
  - Xác thực qua JWT của giáo viên hiện tại.
  - Tạo ngay 1 `InAppNotification` kiểm tra và gửi 1 gói tin Web Push thử nghiệm tới toàn bộ `PushSubscription` hiện có của giáo viên đó, trả về `{ sent, failed, inAppCreated: true }`.

### API Contracts

| Method & path | Ghi chú |
| --- | --- |
| `GET /notifications[?unreadOnly=true&limit=30]` | Trả `{ items: InAppNotificationDto[], unreadCount: number }` |
| `PATCH /notifications/:id/read` | Đánh dấu 1 thông báo đã đọc → trả `InAppNotificationDto` |
| `POST /notifications/read-all` | Đánh dấu toàn bộ thông báo của giáo viên là đã đọc → trả `{ updatedCount: number }` |
| `POST /push/subscriptions/test` | Gửi thông báo thử (In-App + Web Push) cho tài khoản hiện tại → `{ sent, failed, inAppCreated }` |
| `POST /notes` / `PATCH /notes/:id` / `GET /notes` | Bổ sung trường tùy chọn `remindTime?: string \| null` (`HH:mm`) |

## Testing Decisions

- Chỉ kiểm thử hành vi quan sát được từ bên ngoài qua các seam đã chốt, không kiểm thử chi tiết cài đặt nội bộ.
- **Seam 2 — Application Use Cases BE (`DispatchRemindersUseCase`, `SendTestNotificationUseCase`, `Note` use cases) với `Clock` giả và `PushSender` giả:**
  - Note có `dueDate` + `remindTime` được nhắc đúng tại `dueDate + remindTime - reminderLeadMinutes`.
  - Note chỉ có `dueDate` (không có `remindTime`) được nhắc đúng lúc `07:00` sáng theo `timeZone` của giáo viên.
  - Note đã `completed = true` hoặc đã xóa mềm không phát sinh thông báo.
  - Đổi `dueDate` hoặc `remindTime` của Note tạo khóa `remindAt` mới và nhắc lại đúng giờ mới.
  - Class Session hoặc Task lúc `00:05` ngày hôm sau với `reminderLeadMinutes = 15` được phát hiện và gửi nhắc lúc `23:50` ngày hôm trước (kiểm chứng sửa lỗi biên nửa đêm).
  - Khi đến hạn nhắc, `InAppNotification` luôn được tạo kèm `SentReminder` idempotent ngay cả khi giáo viên chưa có `PushSubscription`.
  - Gọi `dispatch` nhiều lần trong cùng cửa sổ 10 phút chỉ tạo đúng 1 `InAppNotification` và gửi đúng 1 lần Web Push.
- **Seam 1 — HTTP API BE (E2E tests):**
  - CRUD Note có `remindTime` hợp lệ và báo lỗi `400` khi `remindTime` sai định dạng `HH:mm`.
  - `GET /notifications` trả đúng danh sách và `unreadCount`; `PATCH /notifications/:id/read` và `POST /notifications/read-all` cập nhật `readAt` chính xác, đảm bảo cô lập dữ liệu giữa các tài khoản (`404` nếu đọc thông báo của người khác).
  - `POST /push/subscriptions/test` tạo thông báo thử và gọi `PushSender`.
- **Seam 4 — FE Hooks, Components & Mock Handlers:**
  - Kiểm thử `isIosDevice` nhận diện đúng cả Safari và Chrome (`CriOS`)/Firefox (`FxiOS`) trên iOS.
  - Kiểm thử `NotificationBell` hiển thị badge chưa đọc, mở danh sách và đánh dấu đã đọc.
  - Kiểm thử `LocalReminderTicker` kích hoạt banner thông báo cho Task, Class Session và Note đến hạn mà không lặp lại thông báo đã hiển thị.
  - Prior art: `test/unit/application/reminder/dispatch-reminders.use-case.spec.ts`, `test/e2e/reminder.e2e-spec.ts` ở BE; `src/features/push/hooks/use-push-notification.test.ts` ở FE.

## Out of Scope

- Gửi thông báo qua kênh trả phí bên thứ ba như SMS, Zalo ZNS hoặc Email nhắc việc từng phút.
- Cài đặt nhiều mốc nhắc khác nhau cho cùng một mục (ví dụ vừa nhắc trước 1 ngày vừa nhắc trước 15 phút).
- Tuỳ chỉnh nhạc chuông tải lên từ máy người dùng.

## Further Notes

- Service Worker và `LocalReminderTicker` sử dụng cùng định dạng `Notification.tag` (`${type}-${targetId}-${remindAtMs}`) để trình duyệt tự động chống trùng lặp hiển thị ở tầng OS.
