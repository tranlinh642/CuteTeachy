# Glossary

### Account (Tài khoản)
Danh tính đăng nhập của một giáo viên: email và các Login Provider đã liên kết. Mỗi giáo viên có đúng một Account.
_Avoid_: User (khi nói về đăng nhập), login

### Profile (Hồ sơ)
Thông tin cá nhân hiển thị của giáo viên: họ tên, tên hiển thị, chức danh, `gender`, ảnh đại diện. Mỗi Account có đúng một Profile.
_Avoid_: thông tin tài khoản, user info

### Login Provider (Phương thức đăng nhập)
Cách giáo viên chứng minh mình sở hữu Account: `password` (email + mật khẩu) hoặc `google`. Một Account có thể có nhiều Login Provider.
_Avoid_: social login, OAuth account

### Account Linking (Liên kết tài khoản)
Việc gắn thêm một Login Provider vào Account đã tồn tại có cùng email, thay vì tạo Account mới — ví dụ đăng nhập Google bằng email đã đăng ký bằng mật khẩu.

### Gender (Giới tính)
Thuộc tính nhận diện của người dùng (`female` - Nữ, `male` - Nam, `other` - Khác/Trung tính). Được dùng để xác định danh xưng mặc định trong giao diện và kích hoạt bảng màu giao diện thông minh tương ứng.

### Honorific (Danh xưng)
Tiền tố hoặc chức danh xưng hô hiển thị trên các thẻ chào mừng, hồ sơ và thông báo. Tự động suy biến từ `gender`:
- `female`: "Cô giáo" / "Cô [displayName]"
- `male`: "Thầy giáo" / "Thầy [displayName]"
- `other`: "Giáo viên" / "[displayName]"

### Onboarding (Hoàn thiện hồ sơ lần đầu)
Bước bắt buộc ngay sau khi giáo viên đăng ký tài khoản hoặc đăng nhập lần đầu (kể cả qua Google), để khai báo thông tin cá nhân còn thiếu — tối thiểu là `gender` — trước khi vào ứng dụng. Giáo viên chưa qua Onboarding chưa được coi là có hồ sơ hoàn chỉnh.

### Masculine Palette (Bảng màu Nam tính)
Bộ mã màu thiết kế pastel dành cho giáo viên nam, sử dụng tông **Slate Blue / Deep Ocean** (`#2b5b75` / `#cce6f9` / `#f4f8fb`), thay thế cho tông hồng mận (`#795465` / `#f8c8dc` / `#fff8f7`) nhưng vẫn giữ nguyên tinh thần pastel thanh nhã, dịu mắt của CuteTeachy.

### Smart Default Theme (Theme mặc định thông minh)
Cơ chế tự động chuyển đổi bảng màu giao diện chủ đạo theo `gender` của người dùng khi cập nhật hồ sơ (chỉ tự động reset về `'auto'` khi giới tính thay đổi sang giá trị khác `newGender !== prevGender`), đồng thời bảo toàn lựa chọn tùy chỉnh thủ công nếu chỉ thay đổi thông tin cá nhân khác.

### Timetable Slot (Tiết trong thời khoá biểu)
Một tiết dạy lặp lại hằng tuần của giáo viên: thứ trong tuần, giờ bắt đầu–kết thúc, môn, lớp, phòng, màu, và khoảng thời gian hiệu lực.
_Avoid_: class, lịch cố định

### Class Session (Tiết dạy)
Một lần dạy cụ thể vào một ngày, sinh ra từ một Timetable Slot hoặc được thêm riêng (dạy bù). Có thể mang nội dung riêng của buổi đó (chủ đề, việc cần chuẩn bị) hoặc bị huỷ mà không ảnh hưởng các buổi khác.
_Avoid_: class (khi nói về một buổi), lớp

### Reminder (Lời nhắc)
Thông báo push gửi tới thiết bị của giáo viên trước giờ bắt đầu của một Task có giờ hoặc một Class Session, theo số phút nhắc trước mà giáo viên đã chọn.
_Avoid_: notification (khi nói về nghiệp vụ nhắc việc), alarm
