# S3-INT: Tích hợp FE ↔ BE cho SPEC-003

**What to build:** FE chạy chế độ `http` với BE thật và mọi User Story 1–31 của SPEC-003 chạy đầu–cuối; mọi lệch giữa mock FE và BE được phát hiện và xử lý.

**Blocked by:** S3-BE-01..06, S3-FE-01..05

**Status:** ready-for-agent

**Đọc:** SPEC-003 toàn bộ; hướng dẫn chạy tích hợp đã có từ auth-profile FE-07; ORCHESTRATION §8 (lệch contract).

**Vùng sở hữu:** sửa nhỏ cho lệch contract; lệch lớn → BLOCKED để Coordinator tạo ticket.

- [ ] Đi hết User Story 1–31, ghi kết quả từng story.
- [ ] Kịch bản hai thiết bị (hai trình duyệt): tạo/sửa/xoá ở một bên → bên kia thấy sau đồng bộ, kể cả xoá Tag.
- [ ] Kịch bản offline: tạo Task/Note khi mất mạng → có mạng → không trùng; sửa bản ghi đã bị xoá ở thiết bị khác → không lỗi.
- [ ] Đối chiếu shape response thật với kiểu FE cho mọi endpoint SPEC-003; ghi lệch và cách xử lý.
- [ ] Gate FE + BE xanh trên integration branch.
