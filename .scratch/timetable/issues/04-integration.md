# S4-INT: Tích hợp FE ↔ BE cho SPEC-004

**What to build:** FE chế độ `http` với BE thật: mọi User Story 1–21 của SPEC-004 chạy đầu–cuối.

**Blocked by:** S4-BE-01..04, S4-FE-01..03

**Status:** done

**Đọc:** SPEC-004 toàn bộ; ORCHESTRATION §8.

**Vùng sở hữu:** sửa nhỏ cho lệch contract; lệch lớn → BLOCKED.

- [x] Đi hết User Story 1–21 (trừ 21 — kiểm ở S5-INT), ghi kết quả: 20/20 test cases E2E chạy thật với NestJS + PostgreSQL qua `test/integration/timetable-cross-repo.spec.ts`.
- [x] Kịch bản sửa slot giữa kỳ: tuần trước giữ nguyên, tuần này theo giờ mới, ghi chú buổi được chuyển/bỏ đúng quy tắc (US 6 và US 17).
- [x] Kịch bản hai thiết bị + offline như S3-INT cho slot và buổi lẻ (US 19 và US 20).
- [x] Đối chiếu shape response thật với kiểu FE; ghi lệch và cách xử lý:
  - Shape của TimetableSlot, ClassSession, PatchTimetableSlotResult, SyncEnvelope giữa FE và BE hoàn toàn đồng nhất.
  - Lệch contract nhỏ: `ApiErrorCode` trong FE thiếu `timetable_conflict`, `cannot_delete_generated_session`, `conflict`. Đã bổ sung vào `src/lib/api/api-error.ts` và map tới translation key tương ứng (`errors.timetableConflict`, `classSession.cannotDeleteGenerated`, `errors.generic`).
- [x] Gate FE + BE xanh trên integration branch.
