# S5-INT: Tích hợp Reminder trên thiết bị thật

**What to build:** Reminder chạy đầu–cuối với BE thật: đăng ký thiết bị, dispatch gửi đúng giờ, thông báo hiện trên điện thoại, bấm mở đúng ngày — kiểm tay trên Android Chrome và iOS PWA đã cài.

**Blocked by:** S5-BE-01..03, S5-FE-01..02

**Status:** in-progress

**Đọc:** SPEC-005 toàn bộ; `docs/setup/external-services.md` §4–§5 (BE repo).

**Vùng sở hữu:** sửa nhỏ cho lệch contract; hướng dẫn kiểm tay trong README FE.

- [ ] Đi hết User Story 1–17, ghi kết quả từng story và thiết bị đã thử.
- [ ] Dev: lịch chạy nội bộ gửi Reminder cho Task có giờ và tiết dạy; đổi số phút nhắc → giờ nhắc đổi theo.
- [ ] Gọi dispatch thủ công hai lần liên tiếp → chỉ một thông báo.
- [ ] Thiết bị đăng xuất không còn nhận; subscription hết hạn bị xoá.
- [ ] Production (nếu người dùng đã có khoá VAPID + cron-job.org): xác nhận job cron chạy và trả `{ sent, skipped }`; nếu chưa có → ghi rõ "chưa kiểm production".
- [ ] Gate FE + BE xanh trên integration branch.
