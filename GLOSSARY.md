# Glossary

### Gender (Giới tính)
Thuộc tính nhận diện của người dùng (`female` - Nữ, `male` - Nam, `other` - Khác/Trung tính). Được dùng để xác định danh xưng mặc định trong giao diện và kích hoạt bảng màu giao diện thông minh tương ứng.

### Honorific (Danh xưng)
Tiền tố hoặc chức danh xưng hô hiển thị trên các thẻ chào mừng, hồ sơ và thông báo. Tự động suy biến từ `gender`:
- `female`: "Cô giáo" / "Cô [displayName]"
- `male`: "Thầy giáo" / "Thầy [displayName]"
- `other`: "Giáo viên" / "[displayName]"

### Masculine Palette (Bảng màu Nam tính)
Bộ mã màu thiết kế pastel dành cho giáo viên nam, sử dụng tông **Slate Blue / Deep Ocean** (`#2b5b75` / `#cce6f9` / `#f4f8fb`), thay thế cho tông hồng mận (`#795465` / `#f8c8dc` / `#fff8f7`) nhưng vẫn giữ nguyên tinh thần pastel thanh nhã, dịu mắt của CuteTeachy.

### Smart Default Theme (Theme mặc định thông minh)
Cơ chế tự động chuyển đổi bảng màu giao diện chủ đạo theo `gender` của người dùng khi cập nhật hồ sơ (chỉ tự động reset về `'auto'` khi giới tính thay đổi sang giá trị khác `newGender !== prevGender`), đồng thời bảo toàn lựa chọn tùy chỉnh thủ công nếu chỉ thay đổi thông tin cá nhân khác.
