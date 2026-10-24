# S4-FE-02: Màn quản lý thời khoá biểu

**What to build:** Giáo viên xem thời khoá biểu theo thứ, thêm/sửa/ngừng/xoá tiết, được báo khi trùng lịch và hiểu rằng thay đổi chỉ áp dụng từ hôm nay.

**Blocked by:** S4-FE-01

**Status:** ready-for-agent

**Đọc:** SPEC-004 mục *Timetable Slot*, *API*, *Thay đổi FE*; User Stories 1–9.

**Vùng sở hữu:** route + màn thời khoá biểu, form slot (dùng picker giờ/ngày hiện có), điểm vào từ điều hướng/lịch, i18n `timetable`, mock handler sửa/xoá/tách slot.

- [ ] Danh sách slot nhóm theo thứ, sắp theo giờ; hiển thị khoảng hiệu lực.
- [ ] Form: thứ, giờ bắt đầu–kết thúc, môn, lớp (tùy chọn), phòng (tùy chọn), màu, hiệu lực từ–đến; validation client khớp SPEC-004.
- [ ] `409 timetable_conflict` hiển thị lỗi dễ hiểu.
- [ ] Sửa slot đã bắt đầu: thông báo trước "áp dụng từ hôm nay, các tuần đã qua giữ nguyên"; sau lưu cập nhật danh sách theo `{ previous, current }`.
- [ ] Xoá: slot đã bắt đầu → "ngừng từ hôm nay"; chưa bắt đầu → xoá hẳn; có xác nhận.
- [ ] Mock handler sửa/xoá/tách đúng quy tắc SPEC-004.
- [ ] Mobile-first, vùng chạm ≥ 44px; `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
