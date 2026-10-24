# S3-FE-03: Tasks theo contract đồng bộ mới

**What to build:** Giáo viên thêm/sửa/tick/xoá Task như hiện nay nhưng dữ liệu đi theo contract SPEC-003: UUID của client, khoảng ngày bắt buộc, đồng bộ chênh lệch; offline gửi lại không tạo trùng.

**Blocked by:** S3-FE-01

**Status:** ready-for-agent

**Đọc:** SPEC-003 mục *Kiểu dữ liệu* (Task), *API* (tasks), *Thay đổi FE*; User Stories 1–10.

**Vùng sở hữu:** service + hook Task, mock handler Task, chỗ gọi danh sách Task ở dashboard tuần và lịch tháng.

- [ ] `list` luôn gửi `from`/`to` (tuần đang xem, hoặc lưới 6 tuần của tháng — ≤ 42 ngày) và `updatedSince` khi đã có mốc.
- [ ] Tạo Task bằng UUID; optimistic update giữ nguyên hành vi tick hiện tại.
- [ ] Mock handler: validation và mã lỗi đúng SPEC-003 (kể cả `tagIds` không thuộc giáo viên, khoảng > 42 ngày).
- [ ] Kiểm thủ công trên mock: tắt mạng (DevTools) → tạo Task → bật lại → chỉ một Task.
- [ ] Test hiện có vẫn xanh; `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
