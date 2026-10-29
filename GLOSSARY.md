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

### Timetable Slot (Khung thời khoá biểu)
Một mục lịch lặp lại hằng tuần của giáo viên: loại lịch (`Schedule Category`), thứ trong tuần, giờ bắt đầu–kết thúc, môn/nội dung, lớp, phòng/địa điểm, màu, và khoảng thời gian hiệu lực.
_Avoid_: class, lịch cố định

### Class Session (Buổi lịch / Tiết lịch)
Một buổi diễn ra cụ thể vào một ngày, sinh ra từ một Timetable Slot hoặc được thêm riêng (lịch lẻ / dạy bù). Có thể thuộc một trong các `Schedule Category`, mang nội dung riêng của buổi đó (chủ đề, việc cần chuẩn bị) hoặc bị huỷ mà không ảnh hưởng các buổi khác.
_Avoid_: class (khi nói về một buổi), lớp

### Schedule Category (Phân loại lịch)
Mục đích nghiệp vụ của một Timetable Slot hoặc Class Session trên trục thời gian của giáo viên:
- `school_teaching` (Lịch trên lớp): Tiết dạy chính khoá tại trường.
- `extra_teaching` (Lịch dạy thêm): Ca dạy thêm bên ngoài hoặc phụ đạo riêng.
- `self_study` (Lịch học thêm của giáo viên): Buổi học nâng cao, bồi dưỡng chuyên môn hoặc lớp học cá nhân của chính giáo viên.
_Avoid_: loại tiết, category (khi không nói rõ là của Task hay Schedule)

### Reminder (Lời nhắc)
Thông báo gửi tới giáo viên trước giờ diễn ra của một Task có giờ, một Class Session, hoặc một Note có hạn (`dueDate` kèm giờ nhắc hoặc đầu ngày), thông qua hai kênh bổ trợ nhau: In-App Notification (ngay trong ứng dụng) và Web Push (tới thiết bị nền).
_Avoid_: alarm

### In-App Notification (Thông báo trong ứng dụng)
Bản ghi thông báo hiển thị tại Trung tâm Thông báo (biểu tượng Chuông) và qua banner/toast trực tiếp khi giáo viên đang mở ứng dụng, lưu trạng thái đã đọc/chưa đọc (`readAt`) để đảm bảo giáo viên không bỏ lỡ lời nhắc ngay cả khi thiết bị chặn Web Push.

### AI Schedule Draft (Bản nháp lịch từ Trợ lý AI)
Danh sách các mục lịch (`Timetable Slot`, `Class Session`, hoặc `Task`) do Trợ lý AI bóc tách từ ảnh chụp thời khoá biểu hoặc tin nhắn văn bản của giáo viên, hiển thị dưới dạng thẻ xem trước để giáo viên kiểm tra, chỉnh sửa và xác nhận trước khi lưu chính thức vào Account.
_Avoid_: auto-import, lịch tự động
