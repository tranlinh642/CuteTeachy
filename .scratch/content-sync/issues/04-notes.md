# S3-FE-04: Notes — cuộn tải thêm, tìm và lọc qua BE

**What to build:** Danh sách Note tải dần khi cuộn; tìm kiếm không dấu và lọc theo Tag gọi BE; trạng thái hoàn thành của Note lấy từ server; Note đồng bộ chênh lệch.

**Blocked by:** S3-FE-01

**Status:** ready-for-agent

**Đọc:** SPEC-003 mục *Kiểu dữ liệu* (Note), *API* (notes), *Quy tắc domain*, *Thay đổi FE*; User Stories 15–23.

**Vùng sở hữu:** service + hook Note, màn Notes (danh sách, tìm kiếm, lọc), hộp thoại Note, mock handler Note. Bỏ lọc/tìm phía client hiện có.

- [ ] Danh sách dùng infinite query theo `nextCursor` (20/trang); hết trang thì dừng.
- [ ] Ô tìm kiếm gửi `q` (debounce), chip Tag gửi `tagId`; đổi điều kiện → tải lại từ trang đầu.
- [ ] Tick checklist chỉ gửi `checklist`; `completed` hiển thị theo response (bỏ tự tính ở client).
- [ ] Đồng bộ chênh lệch qua `updatedSince` áp vào các trang đã tải.
- [ ] Mock handler: cursor, tìm không dấu, lọc Tag, quy tắc `completed` giống BE.
- [ ] Unit test mock handler cho tìm không dấu và quy tắc `completed`; `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
