# BRD: CuteTeachy — Business & Product Requirements Document

**Tên sản phẩm:** CuteTeachy (Serene Educator)  
**Phiên bản tài liệu:** v2.0  
**Ngày cập nhật:** 12/10/2026  
**Chiến lược kỹ thuật:** PWA-First Unified Web Application (Bulletproof React Architecture)  
**Tác giả:** Đội ngũ Kỹ thuật & Sản phẩm CuteTeachy  

---

## 1. Tầm nhìn Sản phẩm (Product Vision) & Bối cảnh Kinh doanh

### 1.1 Vấn đề của Người dùng (Problem Statement)
Giáo viên (đặc biệt là giáo viên tiểu học, mầm non và THCS) phải đối mặt với áp lực công việc hàng ngày rất lớn: lịch dạy dày đặc, quản lý lớp học, theo dõi học sinh, soạn giáo án và vô số đầu việc phát sinh. Hầu hết các ứng dụng quản lý công việc hiện tại quá khô cứng, phức tạp hoặc mang phong cách văn phòng doanh nghiệp, làm tăng thêm căng thẳng nhận thức (cognitive load).

### 1.2 Giải pháp & Định vị (Value Proposition)
CuteTeachy ("Serene Educator") là một không gian số làm việc êm dịu, ngăn nắp và ấm áp được thiết kế riêng cho giáo viên. Ứng dụng cân bằng giữa:
- **Tiện ích chuyên môn cao**: Quản lý lịch dạy theo tuần/tháng, quản lý việc cần làm, ghi chú sư phạm nhanh.
- **Thẩm mỹ thư giãn (Serene & Pastel Aesthetic)**: Bảng màu phấn dịu mắt, góc bo tròn mềm mại, hình minh họa gần gũi, giúp giáo viên cảm thấy nhẹ nhõm mỗi khi mở ứng dụng.

### 1.3 Quyết định Chiến lược Kỹ thuật: PWA-First (Progressive Web App)
Thay vì duy trì 2 dự án riêng biệt (1 Web Next.js + 1 Mobile Expo React Native) gây phân tán nguồn lực và nhân đôi chi phí bảo trì:
- **Hợp nhất thành một ứng dụng duy nhất (Single Unified Codebase)** chạy trên **Next.js 16** với kiến trúc **Bulletproof React** ([alan2207/bulletproof-react](https://github.com/alan2207/bulletproof-react)).
- **Trải nghiệm Đa thiết bị liền mạch**:
  - **Trên Laptop / PC / Tablet**: Giao diện Dashboard 16:9 rộng rãi, thanh điều hướng Sidebar bên trái, xem song song Lịch và Ghi chú.
  - **Trên Điện thoại (Mobile)**: Tự động chuyển đổi thành giao diện Mobile-first với Bottom Navigation Bar, thao tác vuốt Drawer chuẩn iOS/Android, hỗ trợ cài đặt trực tiếp thành **PWA** ("Thêm vào Màn hình chính" / Add to Home Screen) chạy toàn màn hình, mượt mà không thua kém ứng dụng native.
- **Lợi ích kinh doanh**:
  - Giảm **50% thời gian phát triển** cho mỗi tính năng mới.
  - Cập nhật tức thời (Instant OTA updates), người dùng không cần chờ Apple App Store hay Google Play duyệt ứng dụng.
  - Tiết kiệm chi phí tài khoản lập trình viên và hạ tầng build phức tạp.

---

## 2. Đối tượng Người dùng & Nhân khẩu học

1. **Giáo viên Nữ (Nhóm người dùng chính - ~80%)**:
   - Thích tông màu pastel ấm áp (hồng phấn Serene Pink, be ấm, tím oải hương).
   - Danh xưng ưa thích: "Cô [Tên]".
2. **Giáo viên Nam (~15 - 20%)**:
   - Thích tông màu thanh lịch, nhã nhặn (xanh biển pastel Masculine Ocean Blue, bạc hà Mint, xám ấm).
   - Danh xưng ưa thích: "Thầy [Tên]".
3. **Giáo viên có tùy chọn giới tính khác (Other)**:
   - Danh xưng trung tính: "Giáo viên [Tên]".
   - Tự do tùy biến tông màu yêu thích qua bộ chuyển theme.

---

## 3. Các Yêu cầu Chức năng Chính (Functional Requirements)

### 3.1 Quản lý Hồ sơ & Theme thích ứng theo Giới tính (Gender-Adaptive Theme)
- **Thuộc tính người dùng bắt buộc**: Mọi tài khoản khi khởi tạo hoặc cập nhật đều có trường `gender` (`female` | `male` | `other`).
- **Cơ chế Smart Default Theme**:
  - Mặc định khi chọn `female` hoặc `other`: Kích hoạt bảng màu **Feminine Palette** (chủ đạo Hồng phấn `#795465` / `#f8c8dc`).
  - Mặc định khi chọn `male`: Tự động chuyển đổi toàn bộ ứng dụng sang **Masculine Palette** (chủ đạo Xanh biển Pastel `#00658b` / `#c4e7ff`).
  - Khi người dùng chủ động đổi giới tính sang giá trị khác (`newGender !== prevGender`), `themePreference` sẽ tự động reset về `'auto'` để áp dụng bảng màu tối ưu cho giới tính mới.
  - Cho phép người dùng ghi đè thủ công bảng màu theo sở thích cá nhân bất cứ lúc nào.
- **Hiển thị Danh xưng Sư phạm (Honorifics)**:
  - Tự động ghép danh xưng chuẩn văn hóa Việt Nam ("Cô Linh", "Thầy Nam") và Quốc tế ("Ms. Linh", "Mr. Nam").
  - Thẻ người dùng hiển thị danh xưng nổi bật, kèm họ và tên đầy đủ ở dòng phụ bên dưới.

### 3.2 Bảng điều khiển Tuần (Weekly Dashboard & Focus)
- Xem tổng quan lịch giảng dạy trong tuần (Weekly Teaching Load).
- Thẻ tiêu điểm hôm nay (Today's Focus) và Việc cần làm ưu tiên.
- Tránh trùng lặp màu sắc giữa thẻ Lịch và thẻ Nhiệm vụ trên cả 2 bảng màu (dùng màu Mint thay thế trên giao diện nam).

### 3.3 Lịch giảng dạy (Interactive Calendar)
- Lưới lịch tháng (Monthly Grid) trực quan với các chấm sự kiện theo màu sắc phân loại.
- Chế độ xem chi tiết ngày và thêm tiết dạy nhanh.

### 3.4 Sổ tay Sư phạm & Việc cần làm (Notes & Tasks)
- Tạo ghi chú nhanh với nhãn màu (Tags/Categories).
- Đánh dấu hoàn thành việc cần làm với hiệu ứng mượt mà.

### 3.5 Khả năng Cài đặt PWA (Installable Experience)
- **Web App Manifest chuẩn W3C**: Khai báo đầy đủ tên ứng dụng, tên ngắn, icons sắc nét (192px, 512px, maskable icon), màu nền, màu thanh trạng thái và chế độ `display: standalone`.
- **Lời nhắc Cài đặt (Smart Install Prompt)**: Tự động hiển thị banner/hướng dẫn tinh tế mời giáo viên cài đặt ứng dụng lên màn hình chính sau khi đăng nhập.
- **Icon trên màn hình chính**: Biểu tượng chú mèo giáo viên đáng yêu, khởi động nhanh như ứng dụng native.

---

## 4. Các Yêu cầu Phi Chức năng (Non-Functional Requirements)

### 4.1 Khả năng Ngoại tuyến (Offline-First Capability)
- **Service Worker Caching**: Lưu trữ bộ khung ứng dụng (App Shell: HTML, CSS, JS, Fonts, Icons) cho phép mở ứng dụng tức thì kể cả khi mất kết nối mạng.
- **Dữ liệu Cục bộ (Local Persistence)**: Lưu trữ lịch dạy và ghi chú bằng IndexedDB / LocalStorage, cho phép giáo viên tra cứu thông tin trong lớp học không có wifi.
- **Đồng bộ Tự động (Background Sync)**: Tự động gửi các tác vụ đã tạo ngoại tuyến lên máy chủ ngay khi có kết nối trở lại.

### 4.2 Hiệu năng & Chỉ số Web Vitals
- **Lighthouse PWA Score**: Đạt 100/100 điểm tiêu chuẩn PWA.
- **Lighthouse Performance**: ≥ 90 điểm.
- **Largest Contentful Paint (LCP)**: < 2.0s trên mạng 4G thông thường.
- **Cumulative Layout Shift (CLS)**: < 0.05 (không giật layout).
- **First Input Delay (FID) / INP**: < 100ms (phản hồi chạm tức thì).

### 4.3 Khả năng Tiếp cận & Trải nghiệm (Accessibility - WCAG 2.1 AA)
- Độ tương phản chữ/nền: Tối thiểu 4.5:1 đối với văn bản thông thường và 3:1 đối với văn bản lớn.
- Kích thước vùng chạm (Touch Targets): Tối thiểu 44x44px (khuyến nghị 48x48px trên mobile) cho tất cả các nút bấm, icon và ô chọn.
- Hỗ trợ đầy đủ Screen Reader với thuộc tính `aria-label` và danh xưng sư phạm được bản địa hóa.

---

## 5. Kiến trúc Hệ thống: Bulletproof React

Ứng dụng được tổ chức theo chuẩn kiến trúc mô-đun hóa **Bulletproof React**:
```
apps/web/src/
├── app/                  # Next.js App Router (Layouts, Pages, Metadata)
├── components/           # UI Primitives dùng chung (Button, Card, Avatar, Drawer)
├── features/             # Cốt lõi kiến trúc: Phân tách theo miền tính năng
│   ├── auth/             # Xác thực, đăng nhập, bảo mật
│   ├── profile/          # Quản lý hồ sơ cá nhân, đổi giới tính, đổi theme
│   ├── weekly/           # Lịch dạy tuần, thẻ trọng tâm, danh sách lớp
│   ├── calendar/         # Lưới lịch biểu, sự kiện theo ngày
│   └── notes/            # Ghi chú giáo án, danh sách việc cần làm
├── hooks/                # Custom React Hooks dùng chung toàn ứng dụng
├── lib/                  # Wrapper thư viện thứ ba (React Query, Axios, Date utils)
├── stores/               # Quản lý trạng thái toàn cục Zustand
└── utils/                # Hàm tiện ích dùng chung
```

---

## 6. Lộ trình Triển khai & Đánh giá (Roadmap)

1. **Sprint 1: Nền tảng PWA & Chuẩn hóa Bulletproof React (3 - 4 ngày)**
   - Cấu hình `@serwist/next`, Web App Manifest, PWA icons, Service Worker.
   - Cơ cấu lại thư mục `apps/web` theo `src/features/*`.
2. **Sprint 2: Trải nghiệm Mobile-First Native-like (3 - 4 ngày)**
   - Xây dựng thanh Bottom Navigation, Mobile Drawer (Vaul) cho các modal.
   - Xử lý Safe Area và các cử chỉ cảm ứng mượt mà.
3. **Sprint 3: Offline-First & Hoàn thiện Hệ thống (2 - 3 ngày)**
   - Cache dữ liệu offline qua IndexedDB và TanStack Query persist.
   - Audit điểm số Lighthouse PWA và đóng gói bàn giao.
