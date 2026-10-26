# S3-FE-02: Tags — sửa tên/màu, xoá, chống trùng tên

**What to build:** Giáo viên đổi tên và màu Tag, xoá Tag (biến mất khỏi Task/Note), được báo khi trùng tên; danh sách Tag đồng bộ theo contract SPEC-003.

**Blocked by:** S3-FE-01

**Status:** ready-for-agent

**Đọc:** SPEC-003 mục *API* (tags), *Thay đổi FE*; User Stories 11–14.

**Vùng sở hữu:** feature `tags` (service, hook, màn sửa/xoá Tag), mock handler Tag.

- [x] Service Tag: `list` (envelope + `updatedSince`), `create` (UUID), `update`, `remove`.
- [x] Màn/hộp thoại sửa Tag (tên + màu, dùng `TonePicker` hiện có); xoá có xác nhận.
- [x] `409 tag_name_taken` hiển thị lỗi tại ô tên.
- [x] Xoá Tag → Task/Note đang hiển thị không còn chip Tag đó sau lần đồng bộ kế tiếp; mock backend gỡ liên kết và cập nhật `updatedAt` như BE.
- [x] Unit test hook/handler; `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
