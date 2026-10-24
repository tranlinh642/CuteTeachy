# FE-03: Màn Onboarding + guard chuyển hướng

**What to build:** Giáo viên đã đăng nhập nhưng chưa hoàn tất Onboarding luôn được đưa tới `/onboarding` để khai báo họ tên, tên hiển thị, giới tính (bắt buộc) và chức danh (tùy chọn), với dữ liệu Google điền sẵn nếu có. Lưu xong thì vào app, theme áp dụng theo Smart Default Theme.

**Blocked by:** FE-01

**Status:** ready-for-agent

**Đọc:** SPEC-002 mục *Onboarding*; `GLOSSARY.md` (Onboarding, Smart Default Theme); ADR 0001; SPEC-001 (validation Profile).

**Vùng sở hữu:** feature `onboarding` mới (route, form, hook), logic chuyển hướng trong auth guard, xử lý `403 onboarding_required` toàn cục. Dùng lại `profileSchema` và mutation cập nhật Profile, không đổi hành vi của chúng.

- [ ] Chưa hoàn tất Onboarding → mọi route trong app chuyển về `/onboarding`; đã hoàn tất mà vào `/onboarding` → về `/`; chưa đăng nhập → `/login` như hiện tại.
- [ ] API trả `403 onboarding_required` ở bất kỳ đâu → chuyển về `/onboarding`.
- [ ] Form điền sẵn `fullName`, `displayName` từ `User`; `gender` bắt buộc chọn (không mặc định sẵn).
- [ ] Lưu thành công → session cập nhật `User` từ response, theme đổi theo gender (ADR 0001), chuyển về `/`.
- [ ] Có nút đăng xuất trên màn Onboarding.
- [ ] Unit test cho quyết định chuyển hướng (3 trạng thái); chạy được toàn luồng trên mock backend với một user mới đăng ký.
- [ ] `pnpm check-types`, `pnpm lint`, `pnpm test` xanh.
