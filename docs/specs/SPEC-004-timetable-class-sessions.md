# Spec 004: Timetable Slot & Class Session

- **Trạng thái:** ready-for-agent
- **Phạm vi:** `CuteTeachy-BE` + `CuteTeachy-FE`
- **Nguồn:** [`CuteTeachy-BE/docs/ba/ba-backend.md`](../../../CuteTeachy-BE/docs/ba/ba-backend.md) §8, §11 · [ADR BE 0004 — Class Session sinh từ Timetable Slot](../../../CuteTeachy-BE/docs/adr/0004-class-sessions-from-timetable.md) · [ADR BE 0003 — Đồng bộ mobile-first](../../../CuteTeachy-BE/docs/adr/0003-mobile-first-sync.md)
- **Phụ thuộc:** SPEC-002 (Account, Onboarding guard), SPEC-003 (quy tắc đồng bộ chung, Settings `timeZone`).
- **Thuật ngữ:** Timetable Slot, Class Session — [`GLOSSARY.md`](../../GLOSSARY.md)

## Problem Statement

Lịch dạy là phần cốt lõi của giáo viên nhưng FE hiện chỉ hiển thị tiết dạy giả lập, không có cách nào nhập thời khoá biểu. Tiết dạy lặp lại hằng tuần, nhưng từng buổi lại có chủ đề, việc cần chuẩn bị riêng, có buổi bị huỷ hoặc dạy bù — nhập tay từng buổi là không khả thi, còn sửa thời khoá biểu giữa kỳ không được làm sai lịch sử các tuần đã qua.

## Solution

Giáo viên khai báo thời khoá biểu bằng Timetable Slot (thứ, giờ, môn, lớp, phòng, màu, hiệu lực từ–đến). BE sinh Class Session cho mọi ngày trong khoảng được hỏi. Từng buổi có thể thêm chủ đề, danh sách việc cần chuẩn bị, hoặc bị huỷ mà không ảnh hưởng buổi khác. Giáo viên thêm được buổi lẻ (dạy bù, dạy thay). Sửa hoặc xoá slot giữa chừng chỉ có hiệu lực từ hôm nay, các buổi đã qua giữ nguyên.

## User Stories

### Thời khoá biểu
1. Là giáo viên, tôi muốn thêm một tiết lặp lại hằng tuần (ví dụ Thứ Hai 07:30–08:15, Sinh học, Lớp 10A, Phòng 302), để không phải nhập từng buổi.
2. Là giáo viên, tôi muốn chọn màu pastel cho tiết, để phân biệt môn/lớp trên lịch.
3. Là giáo viên, tôi muốn đặt ngày bắt đầu và (tùy chọn) ngày kết thúc hiệu lực, để thời khoá biểu khớp học kỳ.
4. Là giáo viên, tôi muốn để trống lớp hoặc phòng khi không cần, để nhập nhanh.
5. Là giáo viên, tôi muốn được báo khi tiết mới trùng giờ với tiết khác cùng thứ trong cùng thời gian hiệu lực, để không lập lịch chồng chéo.
6. Là giáo viên, tôi muốn sửa giờ/phòng/môn của một tiết giữa học kỳ mà các tuần đã qua vẫn hiện như cũ.
7. Là giáo viên, tôi muốn ngừng một tiết từ hôm nay mà lịch sử vẫn còn.
8. Là giáo viên, tôi muốn xoá hẳn một tiết vừa tạo nhầm (chưa có buổi nào trong quá khứ).
9. Là giáo viên, tôi muốn xem toàn bộ thời khoá biểu hiện hành của mình.

### Tiết dạy từng buổi
10. Là giáo viên, tôi muốn xem các tiết dạy của tuần này và lưới tháng, sinh tự động từ thời khoá biểu.
11. Là giáo viên, tôi muốn ghi chủ đề bài dạy cho một buổi cụ thể.
12. Là giáo viên, tôi muốn thêm danh sách việc cần chuẩn bị (in phiếu, chuẩn bị dụng cụ) cho một buổi và tick khi xong.
13. Là giáo viên, tôi muốn huỷ một buổi (nghỉ lễ, họp) mà các tuần khác không đổi, và vẫn thấy buổi đó được đánh dấu đã huỷ.
14. Là giáo viên, tôi muốn khôi phục buổi đã huỷ.
15. Là giáo viên, tôi muốn thêm buổi lẻ (dạy bù, dạy thay) vào một ngày bất kỳ.
16. Là giáo viên, tôi muốn sửa hoặc xoá buổi lẻ.
17. Là giáo viên, tôi muốn chủ đề và việc chuẩn bị của một buổi vẫn còn khi tôi sửa thời khoá biểu từ hôm nay trở đi (với buổi đã qua).

### Mobile & đồng bộ
18. Là giáo viên mở app trên điện thoại, tôi muốn lịch dạy chỉ tải phần thay đổi khi có thể, để mở nhanh.
19. Là giáo viên dùng hai thiết bị, tôi muốn thời khoá biểu và ghi chú từng buổi đồng bộ giữa chúng.
20. Là giáo viên mất mạng, tôi muốn thêm/sửa tiết và buổi lẻ, gửi lại khi có mạng mà không trùng.

### Liên kết với Reminder
21. Là giáo viên, tôi muốn buổi đã huỷ không bị nhắc, và buổi lẻ cũng được nhắc như buổi thường (thực hiện ở SPEC-005).

## Implementation Decisions

### Timetable Slot
- **Trường:** `id` (client sinh), `weekday` (1 = Thứ Hai … 7 = Chủ nhật), `startTime`, `endTime` (cùng ngày, `start < end`), `subject` (1–120), `grade?`, `room?`, `tone`, `effectiveFrom`, `effectiveTo?` (≥ `effectiveFrom`), `updatedAt`.
- **Trùng lịch:** cùng `weekday`, khoảng giờ giao nhau, khoảng hiệu lực giao nhau → `409 timetable_conflict` (kiểm cả khi tạo, sửa, tách). Buổi lẻ không tham gia kiểm tra.
- **"Hôm nay"** tính theo `timeZone` của giáo viên (Settings, SPEC-003).
- **Sửa slot** có `effectiveFrom` < hôm nay → **tách**: slot cũ `effectiveTo = hôm qua`; slot mới (id do BE sinh) mang giá trị mới, `effectiveFrom = hôm nay`, `effectiveTo` giữ như cũ trừ khi được sửa. Slot có `effectiveFrom` ≥ hôm nay → sửa tại chỗ. Bản ghi đè của các buổi từ hôm nay trở đi thuộc slot cũ được chuyển sang slot mới nếu giờ và thứ không đổi; nếu giờ hoặc thứ đổi thì bản ghi đè đó bị bỏ (buổi không còn tồn tại).
- **Xoá slot** có `effectiveFrom` < hôm nay → đặt `effectiveTo = hôm qua`; ngược lại → xoá mềm.

### Class Session
- **Trường response:** `id`, `timetableSlotId | null`, `date`, `startTime`, `endTime`, `subject`, `grade?`, `room?`, `tone`, `topic?`, `prepItems` (≤ 100 mục `{id, label, done}`, id client sinh), `cancelled`, `updatedAt`.
- **Sinh khi đọc** (ADR 0004): với mỗi slot hiệu lực trong khoảng `from`–`to`, mỗi ngày trùng `weekday` sinh một buổi; áp bản ghi đè nếu có. Buổi không bị ghi đè không lưu vào DB.
- **Id buổi sinh từ slot** xác định từ (`timetableSlotId`, `date`), ổn định giữa các lần đọc, dùng được ở mọi endpoint theo `:id`.
- **Bản ghi đè** chỉ chứa `topic`, `prepItems`, `cancelled`.
- **Buổi lẻ**: `timetableSlotId = null`, client sinh `id`, sửa được mọi trường, xoá được (xoá mềm).
- Buổi sinh từ slot không xoá được → `400 cannot_delete_generated_session` (dùng `cancelled`).

### API

| Method & path | Ghi chú |
| --- | --- |
| `GET /timetable-slots[?updatedSince]` | envelope SPEC-003 |
| `POST /timetable-slots` | tạo idempotent theo quy tắc chung |
| `PATCH /timetable-slots/:id` | trả `{ previous?, current }`; `previous` có khi tách |
| `DELETE /timetable-slots/:id` | kết thúc hiệu lực hoặc xoá mềm như trên |
| `GET /class-sessions?from&to[&updatedSince]` | khoảng ≤ 42 ngày; có `updatedSince`: nếu có slot đổi sau mốc → trả toàn bộ khoảng, ngược lại chỉ buổi có bản ghi đè/buổi lẻ đổi; `deletedIds` gồm buổi lẻ đã xoá và buổi không còn tồn tại do slot đổi |
| `POST /class-sessions` | tạo buổi lẻ |
| `PATCH /class-sessions/:id` | buổi sinh từ slot: `topic`, `prepItems`, `cancelled`; buổi lẻ: mọi trường |
| `DELETE /class-sessions/:id` | chỉ buổi lẻ |

Lỗi mới: `timetable_conflict` (409), `cannot_delete_generated_session` (400). Mọi quy tắc chung (quyền sở hữu, idempotent, `410 gone`, xoá mềm, giới hạn khoảng ngày) theo SPEC-003.

### Module BE
- Feature `timetable` (Timetable Slot) và `class-session` ở đủ 4 layer.
- Logic sinh buổi, tách slot, kiểm trùng lịch là **domain thuần** (không IO), nhận `Clock`/"hôm nay" làm input — để SPEC-005 tái dùng khi tính Reminder cho Class Session.
- Tách slot ghi nhiều bản ghi → Unit of Work.
- Tái dùng thành phần đồng bộ chung của SPEC-003.

### Thay đổi FE
- Màn quản lý thời khoá biểu: danh sách slot theo thứ, thêm/sửa/ngừng/xoá, báo `409 timetable_conflict`, giải thích "thay đổi áp dụng từ hôm nay".
- Lịch tuần/tháng đọc `/class-sessions`; buổi `cancelled` hiển thị mờ/gạch; buổi lẻ có dấu riêng.
- Chi tiết buổi: chủ đề, việc cần chuẩn bị (tick), huỷ/khôi phục; buổi lẻ sửa/xoá được.
- Kiểu `ClassSession` thêm `timetableSlotId`, `cancelled`, `updatedAt`; `room` thành tùy chọn.
- Mock backend thay dữ liệu tiết dạy giả bằng logic slot + bản ghi đè theo contract này.

## Testing Decisions

- Test hành vi qua seam đã chốt.
- **Seam 2 — domain/use case với `Clock` giả** (trọng tâm): sinh buổi qua ranh giới tuần/tháng, `effectiveFrom`/`effectiveTo` ở hai đầu khoảng, kiểm trùng lịch (giao giờ, giao hiệu lực, chạm mép không tính là trùng), tách slot khi có/không có buổi quá khứ, chuyển/bỏ bản ghi đè khi tách, "hôm nay" ở múi giờ khác UTC quanh nửa đêm, id buổi ổn định.
- **Seam 1 — HTTP API BE:** mọi endpoint; `PATCH` trả `previous` khi tách; `DELETE` buổi sinh từ slot → `400`; `updatedSince` sau khi sửa slot trả toàn bộ khoảng; quyền sở hữu `404`.
- **Seam 4 — mock backend FE:** cùng quy tắc sinh buổi, tách slot, huỷ buổi.
- Prior art: test mock backend và test tiện ích ngày tháng hiện có trong FE.

## Out of Scope

Danh mục Lớp/Môn quản lý riêng (v1 là chữ tự do) · lịch nghỉ lễ toàn trường tự huỷ buổi · tuần chẵn/lẻ hoặc chu kỳ khác 1 tuần · tiết qua nửa đêm · nhập thời khoá biểu từ file hoặc Google Calendar · Reminder (SPEC-005).

## Further Notes

- Đổi contract phải sửa spec này trước; FE và BE cùng bám theo.
- Ticket và điều phối theo mẫu `CuteTeachy-FE/.scratch/auth-profile/ORCHESTRATION.md`.
