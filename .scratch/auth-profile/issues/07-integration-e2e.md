# FE-07: Tích hợp E2E FE ↔ BE thật

**What to build:** FE chạy chế độ `NEXT_PUBLIC_API_MODE=http` với BE thật (docker compose + service `api`), và mọi User Story 1–9 của SPEC-002 chạy được đầu–cuối. Mọi lệch contract giữa mock FE và BE được phát hiện và sửa.

**Blocked by:** FE-06, BE-07 (tức là toàn bộ ticket FE và BE)

**Status:** ready-for-agent

**Đọc:** SPEC-002 toàn bộ; `../CuteTeachy-BE/AGENTS.md` (lệnh chạy BE); ORCHESTRATION §8 (lệch contract → Coordinator quyết bên nào sửa).

**Vùng sở hữu:** cấu hình env FE cho chế độ http, tài liệu chạy tích hợp trong README FE, bản sửa nhỏ cho lệch contract (lệch lớn → BLOCKED, Coordinator tạo ticket sửa).

- [ ] Hướng dẫn chạy tích hợp (BE compose + FE http) trong README FE, đã chạy theo đúng hướng dẫn đó.
- [ ] Đi hết User Story 1–7 với `EMAIL_VERIFICATION_REQUIRED=false`, rồi 8–9 với `true` (đọc mã từ Mailpit). Ghi kết quả từng story.
- [ ] Phiên tự refresh: chỉnh TTL access token ngắn ở BE, thao tác qua mốc hết hạn không bị đá ra.
- [ ] Đối chiếu shape response thật với kiểu FE cho mọi endpoint trong contract; ghi lại mọi lệch và cách xử lý.
- [ ] Google login thật cần client ID/secret `[CẦN BỔ SUNG từ người dùng]`; nếu chưa có thì đánh dấu story 2–3, 5 là chưa kiểm và nêu rõ trong báo cáo.
- [ ] Gate FE + BE xanh trên cả hai integration branch.
