# S4-INT: Tích hợp FE ↔ BE cho SPEC-004

**What to build:** FE chế độ `http` với BE thật: mọi User Story 1–21 của SPEC-004 chạy đầu–cuối.

**Blocked by:** S4-BE-01..04, S4-FE-01..03

**Status:** ready-for-agent

**Đọc:** SPEC-004 toàn bộ; ORCHESTRATION §8.

**Vùng sở hữu:** sửa nhỏ cho lệch contract; lệch lớn → BLOCKED.

- [ ] Đi hết User Story 1–21 (trừ 21 — kiểm ở S5-INT), ghi kết quả.
- [ ] Kịch bản sửa slot giữa kỳ: tuần trước giữ nguyên, tuần này theo giờ mới, ghi chú buổi được chuyển/bỏ đúng quy tắc.
- [ ] Kịch bản hai thiết bị + offline như S3-INT cho slot và buổi lẻ.
- [ ] Đối chiếu shape response thật với kiểu FE; ghi lệch và cách xử lý.
- [ ] Gate FE + BE xanh trên integration branch.
