# ADR 0001: Gender-Adaptive Theme with Smart Defaults

- **Trạng thái**: Accepted
- **Ngày**: 2026-10-10
- **Người quyết định**: Product Team & Engineering

## Bối cảnh (Context)
CuteTeachy được thiết kế với phong cách "Serene Educator" pastel nhẹ nhàng. Ban đầu hệ thống sử dụng bảng màu cố định tông hồng mận (`primary`: `#795465`, `primaryContainer`: `#f8c8dc`, `background`: `#fff8f7`) phù hợp cho các cô giáo. Khi ứng dụng mở rộng cho cả các thầy giáo (giáo viên nam), giao diện cần cung cấp một bảng màu phù hợp với thị hiếu nam giới mà không đánh mất phong cách dịu mắt, thân thiện của ứng dụng.

## Quyết định (Decision)
1. Thêm trường `gender: 'female' | 'male' | 'other'` (bắt buộc) vào mô hình miền `User`.
2. Bổ sung bộ mã màu Nam tính (`Masculine Palette`: Slate Blue / Deep Ocean pastel) vào `@cute-teachy/tokens` song song với bảng màu Nữ tính ban đầu (`Feminine Palette`).
3. Áp dụng cơ chế **Smart Default**:
   - Khi `gender` được thiết lập là `'male'`, hệ thống tự động đặt theme chủ đạo sang `blue` (Slate Blue / Deep Ocean pastel).
   - Khi `gender` được thiết lập là `'female'` hoặc `'other'`, hệ thống tự động đặt theme chủ đạo sang `pink` (Rose Pink pastel).
   - Người dùng vẫn có quyền tuỳ biến ghi đè theme (`themePreference: 'auto' | 'pink' | 'blue'`) trong Cài đặt nếu muốn dùng màu khác.
   - **Quy tắc chuyển đổi Smart Default**: Mọi tài khoản người dùng đều có thuộc tính `gender` khi khởi tạo (`'female'`, `'male'`, hoặc `'other'`). Khi cập nhật hồ sơ, hệ thống chỉ tự động đặt lại `themePreference` về `'auto'` nếu người dùng thực sự chuyển đổi giá trị `gender` khác với giới tính trước đó (`newGender !== prevGender`). Nếu giữ nguyên giới tính và chỉ cập nhật các thông tin khác (họ tên, danh xưng), lựa chọn ghi đè theme thủ công được bảo toàn nguyên vẹn.

## Hệ quả (Consequences)
- **Tích cực**:
  - Tự động hóa trải nghiệm: Giáo viên nam đăng nhập hoặc chọn giới tính là có ngay giao diện màu xanh lịch lãm mà không cần tự tìm nút đổi màu.
  - Tôn trọng quyền cá nhân: Không ép buộc cứng ngắc màu sắc theo giới tính.
  - Dùng chung kiến trúc đa nền tảng: Cả Mobile và Web đều dùng chung logic phân giải theme từ `@cute-teachy/tokens` và `@cute-teachy/core`.
- **Đánh đổi**:
  - Cần nâng cấp hệ thống style trong Mobile từ màu tĩnh (`colors.primary`) sang dynamic hook (`useThemeColors()`).
