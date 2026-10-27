# S4-FE-03: Chi tiết buổi — chủ đề, việc chuẩn bị, huỷ, buổi lẻ

**What to build:** Từ lịch, giáo viên mở một buổi để ghi chủ đề, tick việc cần chuẩn bị, huỷ/khôi phục buổi; thêm buổi lẻ vào ngày bất kỳ, sửa/xoá buổi lẻ.

**Blocked by:** S4-FE-01

**Status:** in-review

**Đọc:** SPEC-004 mục *Class Session*, *API*, *Thay đổi FE*; User Stories 10–17.

**Vùng sở hữu:** màn/drawer chi tiết buổi, form buổi lẻ, nút "Thêm buổi lẻ" trong lịch, i18n `classSession`, mock handler ghi đè/buổi lẻ.

- [ ] Chi tiết buổi sinh từ slot: sửa `topic`, thêm/xoá/tick `prepItems` (UUID client), huỷ/khôi phục; không có nút xoá.
- [ ] Buổi lẻ: sửa mọi trường, xoá có xác nhận.
- [ ] Thêm buổi lẻ: ngày, giờ, môn, lớp, phòng, màu, chủ đề.
- [ ] Optimistic update + hoàn tác khi lỗi; `400 cannot_delete_generated_session` không bao giờ hiện với người dùng (UI không cho phép).
- [ ] Mock handler đúng quy tắc SPEC-004.
- [ ] `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
