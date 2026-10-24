# Spec 003: Tasks, Tags, Notes, Inspiration, Settings + đồng bộ mobile-first

- **Trạng thái:** ready-for-agent
- **Phạm vi:** `CuteTeachy-BE` + `CuteTeachy-FE`
- **Nguồn:** [`CuteTeachy-BE/docs/ba/ba-backend.md`](../../../CuteTeachy-BE/docs/ba/ba-backend.md) §3–§7, §10, §11 · [ADR BE 0003 — Đồng bộ mobile-first](../../../CuteTeachy-BE/docs/adr/0003-mobile-first-sync.md) · [ADR BE 0005 — Serverless trên Vercel](../../../CuteTeachy-BE/docs/adr/0005-serverless-on-vercel.md)
- **Phụ thuộc:** SPEC-002 (Account, token, Onboarding guard, khung BE). SPEC-004 và SPEC-005 dùng lại cơ chế đồng bộ và Settings định nghĩa ở đây.
- **Thuật ngữ:** [`GLOSSARY.md`](../../GLOSSARY.md)
- **Điều chỉnh so với BA §2:** Settings chuyển từ SPEC-005 sang spec này vì `timeZone` cần cho "hôm nay" ở Inspiration (spec này) và tách Timetable Slot (SPEC-004), trước khi có Push.

## Problem Statement

Giáo viên dùng CuteTeachy chủ yếu trên điện thoại, nơi mạng chập chờn. Hiện mọi Task, Note, Tag chỉ nằm trong backend giả lập của FE: không lưu thật, không dùng chung giữa các thiết bị. Khi mất mạng, thao tác được gửi lại có thể sinh bản trùng. Note phải tải hết mới tìm được, Tag không đổi tên/màu được, xoá Tag để lại liên kết rác, cài đặt ngôn ngữ chỉ nằm trên một thiết bị.

## Solution

BE lưu Task, Tag, Note, Inspiration, Settings của từng giáo viên với một cơ chế đồng bộ chung cho mobile: client tự sinh id nên gửi lại không tạo trùng, mở app chỉ tải phần thay đổi, xoá được đồng bộ qua dấu xoá. Note phân trang và tìm kiếm không dấu ở BE. Tag sửa được, xoá Tag tự gỡ khỏi Task/Note. Settings (`locale`, `timeZone`, `pushEnabled`, `reminderLeadMinutes`) lưu trên server. FE chuyển từ backend giả lập sang contract này.

## User Stories

### Task
1. Là giáo viên, tôi muốn thêm Task cho một ngày, để ghi nhớ việc cần làm.
2. Là giáo viên, tôi muốn gắn giờ cho Task (tùy chọn), để biết làm lúc nào và được nhắc (SPEC-005).
3. Là giáo viên, tôi muốn phân loại Task là việc trường hay việc cá nhân, để tách bạch công việc.
4. Là giáo viên, tôi muốn đánh dấu Task ưu tiên cao, để nhìn thấy việc gấp trước.
5. Là giáo viên, tôi muốn thêm ghi chú ngắn cho Task, để nhớ chi tiết.
6. Là giáo viên, tôi muốn gắn tối đa 10 Tag cho Task, để lọc theo lớp/môn/mức độ.
7. Là giáo viên, tôi muốn tick hoàn thành Task và bỏ tick, để theo dõi tiến độ.
8. Là giáo viên, tôi muốn sửa và xoá Task, để cập nhật kế hoạch.
9. Là giáo viên, tôi muốn xem Task theo tuần hoặc theo lưới tháng, để lên kế hoạch.
10. Là giáo viên đang mất mạng, tôi muốn tạo Task và để app tự gửi khi có mạng mà không bị trùng, để không phải dọn bản thừa.

### Tag
11. Là giáo viên, tôi muốn tạo Tag với tên và một màu pastel, để phân loại Task và Note.
12. Là giáo viên, tôi muốn đổi tên hoặc màu Tag, để sửa nhãn đặt sai.
13. Là giáo viên, tôi muốn được báo khi tạo/đổi tên Tag trùng tên Tag sẵn có (không phân biệt hoa thường), để không có hai nhãn giống nhau.
14. Là giáo viên, tôi muốn xoá Tag và nó biến mất khỏi mọi Task/Note đang gắn, để không còn nhãn rác.

### Note
15. Là giáo viên, tôi muốn tạo Note có tiêu đề, nội dung và checklist, để ghi chép quan sát lớp học và việc cần làm.
16. Là giáo viên, tôi muốn tick từng mục checklist, để theo dõi tiến độ trong một Note.
17. Là giáo viên, tôi muốn Note tự hoàn thành khi mọi mục checklist đã tick, để không phải đánh dấu hai lần.
18. Là giáo viên, tôi muốn tự đánh dấu hoàn thành cho Note không có checklist.
19. Là giáo viên, tôi muốn đặt hạn cho Note, để nhớ thời điểm cần xong.
20. Là giáo viên, tôi muốn gắn Tag cho Note và lọc Note theo Tag.
21. Là giáo viên, tôi muốn tìm Note bằng tiếng Việt không dấu ("on tap" tìm thấy "Ôn tập"), để gõ nhanh trên điện thoại.
22. Là giáo viên có nhiều Note, tôi muốn danh sách tải dần khi cuộn, để app nhanh và tiết kiệm dữ liệu.
23. Là giáo viên, tôi muốn sửa và xoá Note.

### Đồng bộ
24. Là giáo viên mở lại app, tôi muốn chỉ tải phần đã thay đổi kể từ lần trước, để mở nhanh trên 4G.
25. Là giáo viên dùng hai thiết bị, tôi muốn thay đổi ở thiết bị này xuất hiện ở thiết bị kia, kể cả việc xoá.
26. Là giáo viên, tôi muốn thao tác offline với bản ghi đã bị xoá ở thiết bị khác được xử lý êm, không làm app lỗi.

### Inspiration
27. Là giáo viên, tôi muốn thấy một câu truyền cảm hứng mỗi ngày theo ngôn ngữ của mình, đổi theo ngày ở múi giờ của tôi.

### Settings
28. Là giáo viên, tôi muốn chọn ngôn ngữ vi/en và lựa chọn này theo tôi sang mọi thiết bị.
29. Là giáo viên, tôi muốn app biết múi giờ của tôi (tự lấy từ thiết bị khi Onboarding), để "hôm nay" và giờ nhắc đúng.
30. Là giáo viên, tôi muốn bật/tắt thông báo và chọn nhắc trước 5/10/15/30/60 phút, lưu trên server (dùng ở SPEC-005).

### Bảo mật
31. Là giáo viên, tôi muốn không ai xem hay sửa được dữ liệu của tôi, kể cả khi đoán được id.

## Implementation Decisions

### Quy tắc đồng bộ chung (áp dụng cho mọi tài nguyên của spec này và SPEC-004)
- **Client sinh UUID** cho Task, Tag, Note và mục checklist; gửi `id` trong body khi tạo.
- **Tạo idempotent**: cùng `id` + cùng chủ → `200` trả bản hiện có; `id` đã xoá mềm → `410 gone`; `id` của giáo viên khác → `409 id_conflict`; tạo mới → `201`.
- **Cập nhật** từng phần, last-write-wins theo thứ tự server nhận; bản ghi đã xoá → `404 not_found`.
- **Xoá mềm**, giữ dấu 30 ngày rồi dọn hẳn; `DELETE` lặp lại → `204`.
- **Envelope danh sách**: `items`, `deletedIds`, `nextCursor` (chỉ Notes), `serverTime`. Client lưu `serverTime` làm `updatedSince` lần sau.
- `updatedSince` cũ hơn 30 ngày → `400 validation` (client tải lại toàn bộ).
- Thay đổi gián tiếp (xoá Tag) cập nhật `updatedAt` của Task/Note bị ảnh hưởng.
- Bản ghi của giáo viên khác luôn trả `404 not_found`.
- Mọi route yêu cầu đăng nhập và Onboarding hoàn tất (SPEC-002).
- Việc dọn dấu xoá quá 30 ngày chạy trong cùng lần gọi dispatch của cron (SPEC-005) hoặc lịch dev; tới khi SPEC-005 xong, cho phép chạy thủ công.

### Kiểu dữ liệu

| Tài nguyên | Trường |
| --- | --- |
| Task | `id`, `title` (1–120), `notes?` (≤ 1000), `date` (YYYY-MM-DD), `time?` (HH:mm), `category` (`school`/`personal`), `priority` (`normal`/`high`, mặc định `normal`), `tagIds` (≤ 10), `completed` (mặc định `false`), `createdAt`, `updatedAt` |
| Tag | `id`, `name` (1–24, trim), `tone` (`pink`/`blue`/`beige`/`lavender`/`rose`/`mint`), `updatedAt` |
| Note | `id`, `title` (1–120), `content?` (≤ 5000), `checklist` (≤ 100 mục `{id, text, done}`), `imageUrl?` (giữ trường, chưa dùng), `tagIds` (≤ 10), `dueDate?`, `completed`, `createdAt`, `updatedAt` |
| Inspiration | `id`, `quote` (`vi`, `en`), `author?` |
| Settings | `locale` (`vi`/`en`), `timeZone` (IANA), `pushEnabled`, `reminderLeadMinutes` (5/10/15/30/60) |

Mọi `tagId` gửi lên phải thuộc chính giáo viên, nếu không → `400 validation`.

### API

| Method & path | Ghi chú |
| --- | --- |
| `GET /tasks?from&to[&updatedSince]` | `from`, `to` bắt buộc, khoảng ≤ 42 ngày |
| `POST /tasks` · `PATCH /tasks/:id` · `DELETE /tasks/:id` | theo quy tắc chung |
| `GET /tags[?updatedSince]` | không phân trang |
| `POST /tags` · `PATCH /tags/:id` · `DELETE /tags/:id` | trùng tên → `409 tag_name_taken`; xoá gỡ khỏi Task/Note trong cùng transaction |
| `GET /notes?limit&cursor&q&tagId` | sắp `updatedAt` giảm dần, `limit` mặc định 20, tối đa 50 |
| `GET /notes?updatedSince` | không đi cùng `cursor`/`q`/`tagId` |
| `POST /notes` · `PATCH /notes/:id` · `DELETE /notes/:id` | `checklist` trong PATCH thay toàn bộ danh sách |
| `GET /inspirations/today` | chọn theo ngày trong năm ở `timeZone` của giáo viên |
| `GET /me/settings` · `PATCH /me/settings` | PATCH từng phần; `timeZone` không hợp lệ → `400 validation` |

### Quy tắc domain
- **Note `completed`**: checklist không rỗng → `completed` = mọi mục `done`, bỏ qua giá trị client; checklist rỗng → do client đặt.
- **Tìm kiếm Note**: không dấu (bỏ dấu tiếng Việt, `đ` ≡ `d`), không phân biệt hoa thường, trên tiêu đề, nội dung, text checklist.
- **Settings mặc định** khi tạo Account: `locale` theo `Accept-Language` (không có → `vi`), `timeZone` = `Asia/Ho_Chi_Minh`, `pushEnabled = true`, `reminderLeadMinutes = 15`. Account đã tạo trước spec này nhận mặc định qua migration.
- **Inspiration**: nạp bằng seed từ danh sách câu trích hiện có trong mock FE.

### Module BE (theo `AGENTS.md`)
- Feature `task`, `tag`, `note`, `inspiration`, `settings` ở đủ 4 layer + composition.
- Thành phần dùng chung cho đồng bộ (envelope, quy tắc tạo idempotent/xoá mềm, cursor) nằm ở phần `shared` để SPEC-004 tái dùng — một chỗ duy nhất.
- Xoá Tag dùng Unit of Work (ghi nhiều aggregate).
- `timeZone` của giáo viên đọc qua port Settings; "hôm nay" tính bằng `Clock` + `timeZone`.

### Thay đổi FE
- Sinh UUID khi tạo; xử lý `410 gone` (bỏ bản ghi cục bộ) và `409 tag_name_taken`.
- Đọc envelope; lưu `serverTime` theo từng danh sách; áp `items` và `deletedIds` vào cache.
- Notes: infinite scroll theo cursor; tìm kiếm và lọc Tag gọi BE, bỏ lọc phía client.
- Note `completed` lấy từ response, bỏ tự tính khi tick checklist.
- Màn sửa Tag (tên, màu).
- Ngôn ngữ, bật/tắt thông báo, số phút nhắc đồng bộ qua Settings; gửi `timeZone` của thiết bị trong Onboarding. Theme vẫn chỉ lưu trên thiết bị.
- Mock backend phản ánh đúng mọi quy tắc trên.

## Testing Decisions

- Test chỉ qua hành vi quan sát được ở seam đã chốt, không kiểm chi tiết bên trong.
- **Seam 1 — HTTP API BE (e2e, Postgres từ docker-compose):** mọi endpoint ở bảng API; các nhánh `201/200` tạo lặp, `410`, `409 id_conflict`, `404` bản ghi người khác, `updatedSince` trả đúng `items` + `deletedIds`, `updatedSince` quá 30 ngày, khoảng ngày > 42, cursor phân trang không trùng/không sót, xoá Tag gỡ liên kết và đổi `updatedAt`.
- **Seam 2 — `execute` của use case với fake port:** quy tắc `completed` của Note, chuẩn hoá tìm kiếm không dấu, trùng tên Tag không phân biệt hoa thường, chọn Inspiration theo ngày ở các múi giờ khác nhau quanh nửa đêm (dùng `Clock` giả).
- **Seam 4 — mock backend FE:** cùng các quy tắc trên; prior art: test mock backend hiện có trong FE.
- FE: unit test cho việc áp envelope vào cache (thêm/sửa/xoá theo `deletedIds`) và xử lý `410`.

## Out of Scope

Task lặp lại · upload ảnh cho Note · endpoint tổng hợp dashboard · chia sẻ giữa giáo viên · trang quản trị Inspiration · phát hiện xung đột theo version · đồng bộ theme lên server.

## Further Notes

- Contract trong spec này là nguồn duy nhất cho cả BE và mock FE; đổi contract phải sửa file này trước.
- Ticket và điều phối: theo mẫu `CuteTeachy-FE/.scratch/auth-profile/ORCHESTRATION.md` (FE làm song song trên mock).
