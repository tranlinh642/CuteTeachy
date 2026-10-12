# Spec 001: Quản lý Hồ sơ Cá nhân & Theme Thích ứng theo Giới tính

## Problem Statement

Hiện tại, người dùng ứng dụng CuteTeachy (đặc biệt là trên ứng dụng Mobile) chỉ có thể xem thông tin cá nhân dưới dạng tĩnh (read-only) mà không thể sửa đổi tên hiển thị, chức danh, hay cập nhật lại thông tin cá nhân của mình khi có thay đổi.

Ngoài ra, ứng dụng đang hoàn toàn thiếu trường Giới tính (Gender). Giao diện ứng dụng đang sử dụng một bảng màu cố định tông hồng mận/phấn (Feminine Palette) và danh xưng mặc định là "Cô giáo". Khi giáo viên nam (thầy giáo) sử dụng CuteTeachy, họ không có tùy chọn để hệ thống nhận diện mình là Thầy giáo, và giao diện thiếu bảng màu nam tính phù hợp với thị hiếu và phong cách điềm tĩnh, lịch lãm của thầy giáo, làm giảm trải nghiệm cá nhân hóa của người dùng.

## Solution

Cung cấp tính năng quản lý và chỉnh sửa hồ sơ cá nhân hoàn chỉnh trực tiếp trên giao diện:
1. Thêm trường Giới tính (`Gender`: Nữ, Nam, Khác) vào thông tin người dùng.
2. Bổ sung modal chỉnh sửa hồ sơ cá nhân ngay tại màn hình Cá nhân, cho phép cập nhật Họ và tên, Tên hiển thị, Chức danh/Môn dạy và Giới tính với xác thực dữ liệu tức thì (Client-side validation).
3. Triển khai cơ chế **Smart Default Theme**: Tự động chuyển đổi toàn bộ màu sắc chủ đạo của ứng dụng sang Bảng màu Nam tính (Masculine Palette: Slate Blue / Deep Ocean pastel) khi người dùng là Nam, đồng thời tự động cập nhật danh xưng thành "Thầy giáo" và đổi màu nền avatar tương ứng, trong khi vẫn cho phép người dùng tùy chọn ghi đè theme theo sở thích cá nhân.

## User Stories

1. As an educator, I want to edit my full name, so that my account reflects my real legal name accurately.
2. As an educator, I want to edit my display name, so that the app greets me with my preferred short name or nickname on the home dashboard.
3. As an educator, I want to update my professional title or teaching subject (e.g., "Thầy giáo Hóa học", "Giáo viên Toán 12"), so that my role badge clearly describes what I teach.
4. As a male educator, I want to set my gender to Male, so that the application addresses me as "Thầy giáo" or "Thầy" instead of the default female honorific.
5. As a male educator, I want the app to automatically adapt its theme colors to an elegant, masculine pastel palette (Slate Blue / Deep Ocean), so that the interface feels natural, aesthetic, and tailor-made for me.
6. As a female educator, I want my theme and honorifics to remain the warm, gentle pink and plum pastel tone with the title "Cô giáo", so that my current familiar visual experience is preserved.
7. As an educator of other gender identities, I want to select "Other" as my gender, so that the application addresses me neutrally as "Giáo viên" with the default pink palette, while allowing me to easily switch to the blue palette in theme preferences.
8. As an educator, I want to see immediate validation errors when submitting invalid profile details (e.g. empty name), so that I can correct mistakes before saving.
9. As an educator, I want my email address to remain visible but protected from accidental editing in the profile form, so that my login credentials remain secure.
10. As an educator, I want my updated profile and theme to persist locally and across sessions, so that I do not have to reconfigure them every time I open the app.
11. As an educator who prefers a specific color regardless of my gender, I want to retain the ability to manually override my theme preference in Settings, so that I have full autonomy over my app's aesthetics.
12. As a mobile educator, I want to open the edit form in a smooth modal overlay directly from the profile screen, so that I can quickly update my information without leaving my context.
13. As an educator, I want my avatar background color to match my active theme tone, so that the visual hierarchy throughout the app remains cohesive.

## Implementation Decisions

- **Domain Model Changes**:
  - Bổ sung kiểu dữ liệu `type Gender = 'female' | 'male' | 'other'`.
  - Cập nhật kiểu `User` bổ sung thuộc tính bắt buộc `gender: Gender`.
  - Bổ sung interface `UpdateProfileInput` định nghĩa dữ liệu gửi lên khi cập nhật hồ sơ (`fullName`, `displayName`, `title`, `gender`).

- **Design Tokens & Theme Architecture**:
  - Giữ nguyên triết lý thiết kế Serene Educator (pastel, dịu mắt, tương phản chuẩn WCAG 2.1 AA).
  - Bổ sung bộ màu `Masculine Palette` (Slate Blue / Deep Ocean pastel: `primary: #2b5b75`, `primaryContainer: #cce6f9`, `onPrimaryContainer: #163b4f`, `surface: #f4f8fb`) song song với bộ màu `Feminine Palette` (Rose Pink: `primary: #795465`, `primaryContainer: #f8c8dc`).
  - Thiết kế hook tính toán màu động giải quyết màu dựa trên `themePreference` và `user.gender`.

- **State Management & Persistence**:
  - Mở rộng `PreferencesStore` lưu trữ cấu hình `themePreference: 'auto' | 'pink' | 'blue'`.
  - Giá trị mặc định là `'auto'`. Khi ở chế độ `'auto'`, màu sắc chủ đạo được xác định dựa trên trường `gender` của người dùng hiện tại trong `SessionStore` (Nam -> Blue, Nữ/Khác -> Pink).
  - Khi người dùng chọn màu cụ thể trong Cài đặt, giá trị đó sẽ ghi đè chế độ tự động.
  - **Quy tắc Smart Default Transition**: Mọi tài khoản đều có thuộc tính `gender` khi tạo. Khi cập nhật hồ sơ, hệ thống chỉ tự động chuyển `themePreference` về `'auto'` nếu người dùng thực sự thay đổi giá trị `gender` khác với giới tính trước đó (`newGender !== prevGender`). Nếu giữ nguyên giới tính và chỉ sửa họ tên hoặc danh xưng, tùy chọn theme thủ công được bảo toàn nguyên vẹn.

- **Validation Rules (Client-side Zod Schema)**:
  - `profileSchema` kiểm tra:
    - `fullName`: chuỗi không rỗng, tối thiểu 2 ký tự, tối đa 50 ký tự.
    - `displayName`: chuỗi không rỗng, tối thiểu 1 ký tự, tối đa 20 ký tự.
    - `title`: chuỗi tùy chọn, tối đa 50 ký tự.
    - `gender`: một trong 3 giá trị `female`, `male`, `other`.

- **API & Mock Backend**:
  - Mở rộng `AuthService` với phương thức `updateProfile(input: UpdateProfileInput): Promise<User>`.
  - Cập nhật mock backend handler để cập nhật dữ liệu người dùng trong bộ nhớ và trả về user mới.
  - Cung cấp hook `useUpdateProfile` (TanStack Query mutation) tự động cập nhật session store và làm mới cache.

- **UI & Interaction Flow**:
  - Trên màn hình Profile của Mobile: Thêm nút chỉnh sửa (icon edit) trên thẻ thông tin cá nhân.
  - Xây dựng component `EditProfileModal`: Gồm các trường Họ tên, Tên hiển thị, Môn dạy/Chức danh, và bộ chọn Giới tính dạng `SegmentedControl`.
  - Khi lưu thành công, modal đóng lại, thông tin mới hiển thị ngay lập tức và toàn bộ app tự động chuyển theme tương ứng nếu giới tính thay đổi.

## Testing Decisions

- **Good Test Criteria**: Kiểm thử tập trung vào hành vi từ góc nhìn người dùng (black-box behavior) thay vì chi tiết triển khai bên trong.
- **Modules to Test**:
  1. *Core Validation*: Unit test cho `profileSchema` kiểm tra các trường hợp biên (tên rỗng, tên quá dài, giới tính không hợp lệ).
  2. *Theme Resolution*: Unit test kiểm tra logic phân giải theme từ `gender` và `themePreference` (nam -> blue, nữ -> pink, override -> màu đã chọn).
  3. *API & Store Mutation*: Unit test cho mutation `updateProfile` đảm bảo session store và mock database được cập nhật đồng bộ.
  4. *Mobile Component Integration*: Kiểm tra typecheck và render của `ProfileScreen`, `EditProfileModal` và chuyển đổi theme.
- **Prior Art**: Dựa trên các unit test hiện có trong `packages/core/src/validation/` và `packages/api/src/mock/mock-backend.test.ts`.

## Out of Scope

- Thay đổi mật khẩu hoặc xác thực 2 yếu tố (2FA).
- Chỉnh sửa địa chỉ email hoặc quy trình xác thực lại email.
- Tải lên ảnh đại diện tùy chỉnh (Upload custom avatar file) lên cloud storage (hiện tại tiếp tục sử dụng avatar sinh chữ cái đầu trên nền pastel).
- Chế độ Dark Mode hoàn chỉnh (hiện tại tập trung vào Light Pastel Theme thích ứng theo Nữ / Nam).

## Further Notes

- Kế hoạch triển khai ưu tiên: Hoàn thiện và nghiệm thu toàn diện trên nền tảng **Mobile** trước, sau đó áp dụng đồng bộ cho **Web**.
