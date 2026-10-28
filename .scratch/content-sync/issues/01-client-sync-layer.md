# S3-FE-01: Lớp đồng bộ phía client + mock backend đồng bộ

**What to build:** FE có một cơ chế đồng bộ dùng chung cho mọi danh sách: tạo bản ghi bằng UUID của client, áp envelope `{ items, deletedIds, serverTime }` vào cache, nhớ `serverTime` theo từng danh sách để lần sau chỉ hỏi phần chênh lệch, xử lý êm `410 gone`/`409 id_conflict`. Mock backend có cùng các quy tắc. Đây là ticket nền để S3-FE-02..05 và S4-FE chạy song song.

**Blocked by:** auth-profile FE-01

**Status:** done

**Đọc:** SPEC-003 mục *Quy tắc đồng bộ chung*, *Thay đổi FE*; ADR BE 0003.

**Vùng sở hữu:** lớp API dùng chung (kiểu envelope, xử lý lỗi `gone`/`id_conflict`), tiện ích áp envelope vào cache TanStack Query, lưu `serverTime` theo danh sách (bền qua reload, cùng cơ chế persist hiện có), hạ tầng mock backend cho đồng bộ (xoá mềm, `updatedSince`, tạo idempotent). Không đổi màn hình.

- [x] Kiểu envelope dùng chung; `ApiErrorCode` + i18n vi/en thêm `gone`, `id_conflict`.
- [x] Tiện ích áp envelope: thêm/cập nhật theo `items`, gỡ theo `deletedIds`, cập nhật mốc `serverTime`; unit test đủ ba trường hợp và trường hợp `updatedSince` bị từ chối (`400`) → tải lại toàn bộ.
- [x] Tạo mới luôn kèm `id` UUID của client; mutation gửi lại (offline) dùng đúng `id` cũ.
- [x] `410 gone` khi tạo/sửa → bỏ bản ghi khỏi cache, không báo lỗi gây hoảng cho người dùng.
- [x] Mock backend: hạ tầng chung cho tạo idempotent, xoá mềm 30 ngày, `updatedSince`, envelope — sẵn cho handler từng tài nguyên dùng.
- [x] `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
