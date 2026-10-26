# S3-INT: Tích hợp FE ↔ BE cho SPEC-003

**What to build:** FE chạy chế độ `http` với BE thật và mọi User Story 1–31 của SPEC-003 chạy đầu–cuối; mọi lệch giữa mock FE và BE được phát hiện và xử lý.

**Blocked by:** S3-BE-01..06, S3-FE-01..05

**Status:** done

**Đọc:** SPEC-003 toàn bộ; hướng dẫn chạy tích hợp đã có từ auth-profile FE-07; ORCHESTRATION §8 (lệch contract).

**Vùng sở hữu:** sửa nhỏ cho lệch contract; lệch lớn → BLOCKED để Coordinator tạo ticket.

- [x] Đi hết User Story 1–31, ghi kết quả từng story.
- [x] Kịch bản hai thiết bị (hai trình duyệt): tạo/sửa/xoá ở một bên → bên kia thấy sau đồng bộ, kể cả xoá Tag.
- [x] Kịch bản offline: tạo Task/Note khi mất mạng → có mạng → không trùng; sửa bản ghi đã bị xoá ở thiết bị khác → không lỗi.
- [x] Đối chiếu shape response thật với kiểu FE cho mọi endpoint SPEC-003; ghi lệch và cách xử lý.
- [x] Gate FE + BE xanh trên integration branch.

## Kết quả kiểm thử tích hợp (SPEC-003 User Stories 1–31)

Toàn bộ 33 test case trong test suite `test/integration/content-sync-cross-repo.spec.ts` kết nối tới Backend NestJS thật (PostgreSQL) đều PASS:

| Nhóm | User Story | Nội dung kiểm thử | Trạng thái |
| --- | --- | --- | --- |
| **Tasks** | US 1 | Thêm Task cho một ngày (`POST /tasks`), kiểm tra hình dạng đầy đủ (`category`, `priority: normal`, `completed: false`) | PASSED |
| | US 2 | Gắn giờ cho Task (`time: 'HH:mm'`) | PASSED |
| | US 3 | Phân loại Task `school` vs `personal` | PASSED |
| | US 4 | Đánh dấu Task ưu tiên cao (`priority: high`) | PASSED |
| | US 5 | Thêm ghi chú ngắn cho Task (`notes`) | PASSED |
| | US 6 | Gắn tối đa 10 Tag cho Task, từ chối > 10 tag (`400 validation`) | PASSED |
| | US 7 | Tick hoàn thành Task và bỏ tick (`PATCH /tasks/:id`) | PASSED |
| | US 8 | Sửa Task (đổi date/notes/priority) và Xoá Task (`DELETE /tasks/:id`) | PASSED |
| | US 9 | Xem Task theo tuần/tháng (`GET /tasks?from&to` <= 42 ngày), từ chối > 42 ngày (`400 validation`) | PASSED |
| | US 10 | Tạo Task idempotent khi mất mạng gửi lại cùng id (`200 OK` bản hiện có, không tạo trùng) | PASSED |
| **Tags** | US 11 | Tạo Tag với tên và màu pastel (`POST /tags`), HTTP 201 | PASSED |
| | US 12 | Đổi tên hoặc màu pastel cho Tag (`PATCH /tags/:id`) | PASSED |
| | US 13 | Trùng tên Tag không phân biệt hoa thường trả về `409 tag_name_taken` (cả POST & PATCH) | PASSED |
| | US 14 | Xoá Tag tự động gỡ liên kết khỏi mọi Task và Note, cập nhật `updatedAt` | PASSED |
| **Notes** | US 15 | Tạo Note có tiêu đề, nội dung và checklist (`POST /notes`) | PASSED |
| | US 16 | Tick từng mục checklist trong Note (`PATCH /notes/:id`) | PASSED |
| | US 17 | Note tự `completed = true` khi mọi mục checklist đã tick, tự `false` nếu còn mục chưa done | PASSED |
| | US 18 | Tự đánh dấu hoàn thành cho Note không có checklist (`checklist: []`) | PASSED |
| | US 19 | Đặt hạn hoàn thành cho Note (`dueDate`) | PASSED |
| | US 20 | Gắn Tag cho Note và lọc Note theo Tag (`GET /notes?tagId=...`) | PASSED |
| | US 21 | Tìm Note bằng tiếng Việt không dấu (`q=on tap` tìm thấy "Ôn tập") | PASSED |
| | US 22 | Phân trang cursor (`GET /notes?limit&cursor` trả `nextCursor`, không trùng/sót) | PASSED |
| | US 23 | Sửa và xoá Note (`PATCH /notes/:id` và `DELETE /notes/:id`) | PASSED |
| **Đồng bộ** | US 24 | Delta sync: `GET ...?updatedSince` trả đúng `items` và `deletedIds`; từ chối > 30 ngày (`400 validation`) | PASSED |
| | US 25 | Kịch bản 2 thiết bị: Device 1 tạo/sửa/xoá → Device 2 sync nhận đủ thay đổi và `deletedIds` | PASSED |
| | US 26 | Thao tác offline: sửa bản ghi đã bị xoá ở server → `404 not_found`; gửi lại POST id đã xoá mềm → `410 gone` | PASSED |
| **Inspiration** | US 27 | `GET /inspirations/today` trả câu truyền cảm hứng `quote.vi` và `quote.en` | PASSED |
| **Settings** | US 28 | `GET /me/settings` và `PATCH /me/settings` lưu/đồng bộ ngôn ngữ `vi`/`en` | PASSED |
| | US 29 | Lưu múi giờ IANA, từ chối múi giờ không hợp lệ (`400 validation`) | PASSED |
| | US 30 | Cấu hình `pushEnabled` và `reminderLeadMinutes` (5/10/15/30/60), từ chối giá trị khác (`400 validation`) | PASSED |
| **Bảo mật** | US 31 | Cô lập dữ liệu: GV A không xem/sửa/xoá tài nguyên của GV B (404); không gắn trộm tag của B (400); không chiếm id của B (409 `id_conflict`) | PASSED |

## Đối chiếu Contract FE ↔ BE
- **Task**: `TaskDto` (BE) khớp hoàn toàn `Task` (FE) (`id`, `title`, `notes`, `date`, `time`, `category`, `priority`, `completed`, `tagIds`, `createdAt`, `updatedAt`).
- **Tag**: `TagDto` (BE) khớp hoàn toàn `Tag` (FE) (`id`, `name`, `tone`, `createdAt`, `updatedAt`).
- **Note**: `NoteDto` (BE) khớp hoàn toàn `Note` (FE) (`id`, `title`, `content`, `checklist`, `imageUrl`, `tagIds`, `dueDate`, `completed`, `createdAt`, `updatedAt`).
- **Envelope**: `SyncEnvelope<T>` khớp cấu trúc `{ items, deletedIds, serverTime, nextCursor }`.
- **Inspiration**: Khớp `{ id, quote: { vi, en }, author }`.
- **Settings**: Khớp `{ locale, timeZone, pushEnabled, reminderLeadMinutes }`.
- **Không có lệch contract phát sinh.**
