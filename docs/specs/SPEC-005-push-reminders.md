# Spec 005: Push & Reminder

- **Trạng thái:** ready-for-agent
- **Phạm vi:** `CuteTeachy-BE` + `CuteTeachy-FE`
- **Nguồn:** [`CuteTeachy-BE/docs/ba/ba-backend.md`](../../../CuteTeachy-BE/docs/ba/ba-backend.md) §9, §11 · [ADR BE 0002 — Reminder qua cron ngoài](../../../CuteTeachy-BE/docs/adr/0002-external-cron-reminders.md) · [ADR BE 0005 — Serverless trên Vercel](../../../CuteTeachy-BE/docs/adr/0005-serverless-on-vercel.md) · cấu hình VAPID/cron: `CuteTeachy-BE/docs/setup/external-services.md` §4–§5
- **Phụ thuộc:** SPEC-003 (Task, Settings), SPEC-004 (Class Session, logic sinh buổi).
- **Thuật ngữ:** Reminder — [`GLOSSARY.md`](../../GLOSSARY.md)

## Problem Statement

Theo người dùng, nhắc việc trên điện thoại là tính năng quan trọng nhất: giáo viên bận đứng lớp, dễ quên việc có giờ và giờ vào tiết. Hiện app không gửi được thông báo nào — service worker chưa xử lý push, bật/tắt thông báo chỉ là công tắc trên thiết bị, và BE chạy serverless miễn phí nên không có tiến trình nào thức để gửi đúng giờ.

## Solution

Giáo viên cho phép thông báo trên từng thiết bị (iOS cần thêm PWA vào màn hình chính). BE gửi Reminder qua Web Push trước giờ bắt đầu của mỗi Task có giờ và mỗi Class Session, theo số phút nhắc trước đã chọn, bằng ngôn ngữ của giáo viên. Một dịch vụ cron ngoài gọi BE mỗi phút; BE gửi mỗi Reminder đúng một lần, bỏ qua nếu đã trễ quá 10 phút. Bấm thông báo mở app đúng ngày.

## User Stories

1. Là giáo viên, tôi muốn app hỏi quyền thông báo vào thời điểm hợp lý (không ngay khi mở lần đầu), để hiểu vì sao cần cho phép.
2. Là giáo viên dùng iPhone, tôi muốn được hướng dẫn thêm app vào màn hình chính trước khi bật thông báo, vì iOS chỉ gửi push cho PWA đã cài.
3. Là giáo viên, tôi muốn được nhắc trước giờ một Task có giờ, để không quên.
4. Là giáo viên, tôi muốn được nhắc trước giờ vào mỗi tiết dạy, kể cả buổi lẻ.
5. Là giáo viên, tôi muốn chọn nhắc trước 5/10/15/30/60 phút (mặc định 15).
6. Là giáo viên, tôi muốn tắt toàn bộ thông báo bằng một công tắc, áp dụng cho mọi thiết bị.
7. Là giáo viên, tôi muốn không bị nhắc Task đã hoàn thành, Task đã xoá hay tiết đã huỷ.
8. Là giáo viên, tôi muốn khi đổi giờ Task/tiết hoặc đổi số phút nhắc, Reminder theo giờ mới.
9. Là giáo viên, tôi muốn mỗi việc chỉ được nhắc một lần, không bị spam.
10. Là giáo viên, tôi muốn không nhận thông báo đã quá muộn (trễ hơn 10 phút), vì lúc đó không còn tác dụng.
11. Là giáo viên, tôi muốn nội dung thông báo theo ngôn ngữ đã chọn và cho biết tên việc/tiết và giờ.
12. Là giáo viên, tôi muốn bấm thông báo thì mở app đúng ngày của việc/tiết đó.
13. Là giáo viên dùng điện thoại và laptop, tôi muốn nhận thông báo trên mọi thiết bị đã cho phép.
14. Là giáo viên, tôi muốn đăng xuất trên một thiết bị thì thiết bị đó không nhận thông báo của tôi nữa.
15. Là giáo viên, tôi muốn thiết bị cũ không còn dùng tự bị loại khỏi danh sách nhận thông báo.
16. Là giáo viên đổi múi giờ, tôi muốn giờ nhắc tính theo múi giờ mới.
17. Là người vận hành, tôi muốn endpoint gửi Reminder chỉ gọi được bằng secret, để người ngoài không kích hoạt được.

## Implementation Decisions

### Thiết bị nhận push
- Web Push chuẩn VAPID. BE giữ cặp khoá VAPID theo môi trường; public key cung cấp cho FE.
- Subscription upsert theo `endpoint`; endpoint đang gắn Account khác → chuyển sang Account hiện tại. Một giáo viên nhiều subscription.
- Push service trả `404`/`410` khi gửi → xoá subscription đó.

### Reminder
- **Nguồn:** Task có `time`, `completed = false`, chưa xoá; Class Session (từ slot hoặc buổi lẻ) chưa `cancelled`.
- **Thời điểm nhắc** = (`date` + `time`/`startTime` hiểu theo `timeZone` của giáo viên) − `reminderLeadMinutes`.
- **Điều kiện gửi:** `pushEnabled = true`; thời điểm nhắc ∈ (bây giờ − 10 phút, bây giờ].
- **Đúng một lần:** khoá idempotent gồm loại (`task`/`class_session`), id mục, thời điểm nhắc — lưu bản ghi đã gửi; gọi trùng không gửi lại. Đổi giờ/số phút/múi giờ → thời điểm nhắc mới → khoá mới.
- **Class Session sắp tới** tính bằng logic sinh buổi của SPEC-004 (domain thuần), không có bảng buổi sẵn.
- **Nội dung** theo `locale` (vi/en): tiêu đề nêu loại + tên (Task `title` hoặc tiết `subject` kèm `grade` nếu có), thân nêu giờ bắt đầu (và `room` với tiết). Payload kèm URL mở app tại ngày của mục.
- Gửi push phải hoàn tất (`await`) trước khi trả response (ADR 0005).
- Dọn dấu xoá mềm quá 30 ngày (SPEC-003) và bản ghi Reminder đã gửi cũ chạy kèm trong lần dispatch, giới hạn khối lượng mỗi lần để trả lời trong ngưỡng của cron.

### Kích hoạt gửi
- `POST /internal/reminders/dispatch`: xác thực bằng secret trong header, không qua JWT/Onboarding guard; sai secret → `401`. Trả `{ sent, skipped }`.
- Production: cron-job.org gọi mỗi phút (ngưỡng chờ 30 giây — dispatch phải trả lời nhanh). Dev: lịch chạy trong BE gọi cùng use case.

### API

| Method & path | Ghi chú |
| --- | --- |
| `GET /push/vapid-public-key` | public, trả `{ publicKey }` |
| `POST /push/subscriptions` | `{ endpoint, keys: { p256dh, auth } }` → `201`/`200` (upsert) |
| `DELETE /push/subscriptions` | `{ endpoint }` → `204` |
| `POST /internal/reminders/dispatch` | header secret → `{ sent, skipped }` |

Settings (`pushEnabled`, `reminderLeadMinutes`, `timeZone`, `locale`) đọc từ SPEC-003.

### Module BE
- Feature `push-subscription` và `reminder` ở đủ 4 layer.
- Port mới **`PushSender`** (adapter Web Push); dùng lại `Clock`.
- Tính "Reminder đến hạn" là use case thuần trên dữ liệu đọc qua port + `Clock`; gửi qua `PushSender`.

### Thay đổi FE
- Luồng xin quyền: giải thích → `Notification.requestPermission` → đăng ký push với VAPID public key → `POST /push/subscriptions`. Trên iOS chưa cài PWA → hướng dẫn cài (dùng banner cài PWA đã có).
- Công tắc thông báo và số phút nhắc trong Profile đọc/ghi Settings; tắt công tắc không huỷ subscription.
- Đăng xuất → `DELETE /push/subscriptions` cho thiết bị hiện tại trước khi xoá phiên.
- Service worker: xử lý `push` (hiển thị thông báo bằng hàm thuần dựng nội dung từ payload) và `notificationclick` (mở/focus app tại URL trong payload).
- Mock backend: các endpoint push trả đúng contract (không gửi push thật).

## Testing Decisions

- Test hành vi qua seam đã chốt.
- **Seam 2 + 3 — use case dispatch với `Clock` giả và `PushSender` giả** (trọng tâm): đến hạn đúng phút; trễ ≤ 10 phút vẫn gửi, > 10 phút bỏ; gọi hai lần chỉ gửi một lần; Task hoàn thành/xoá, tiết huỷ, `pushEnabled = false` không gửi; đổi giờ/số phút/múi giờ gửi theo giờ mới; buổi lẻ được nhắc; nhiều subscription đều nhận; `PushSender` báo hết hạn → subscription bị xoá; nội dung đúng `locale`.
- **Seam 1 — HTTP API BE:** subscription upsert/huỷ, chuyển endpoint sang Account khác, dispatch sai secret → `401`, dispatch đúng secret trả `{ sent, skipped }`.
- **Seam 5 — hàm thuần dựng thông báo (FE):** tiêu đề/thân/URL theo payload và `locale`.
- **Seam 4 — mock backend FE:** endpoint push.
- Không test thật việc trình duyệt hiển thị thông báo; kiểm thủ công trên thiết bị ở bước tích hợp (Android Chrome, iOS PWA đã cài).

## Out of Scope

Nhắc Task không có giờ · nhắc nhiều mốc cho một mục · nhắc qua email/SMS · Reminder cho Note `dueDate` · tóm tắt buổi sáng · FCM/APNs native · âm thanh/rung tùy chỉnh.

## Further Notes

- Khoá VAPID production, `CRON_SECRET` và job cron-job.org do người dùng tạo theo `external-services.md`; thiếu thì vẫn code/test được bằng khoá dev và `PushSender` giả.
- Reminder có thể trễ vài giây đến khoảng một phút (cold start); cron-job.org tự tắt job sau 15 lần lỗi liên tiếp — cần theo dõi.
- Ticket và điều phối theo mẫu `CuteTeachy-FE/.scratch/auth-profile/ORCHESTRATION.md`.
