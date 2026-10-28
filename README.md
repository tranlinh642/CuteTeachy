# CuteTeachy – Serene Educator (PWA)

Ứng dụng quản lý kế hoạch giảng dạy cho giáo viên (lịch dạy theo tuần/tháng, ghi chú, to-do, nhãn), xây dựng trên nền tảng **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4**, kiến trúc chuẩn **100% Bulletproof React** ([alan2207/bulletproof-react](https://github.com/alan2207/bulletproof-react)).

Ứng dụng là **PWA (Progressive Web App)** cài đặt trực tiếp trên Mobile (iOS/Android) và Desktop, hỗ trợ offline-first với Serwist service worker và IndexedDB cache persistence.

---

## Cấu trúc thư mục (Bulletproof React Layout)

```
cute-teachy/
├── public/                 # Tài nguyên tĩnh, icons PWA, manifest.json, sw.js
├── src/
│   ├── app/                # Next.js App Router (pages, layout, providers, sw.ts)
│   ├── assets/             # Assets, CSS theme (@theme), styles
│   ├── components/         # Shared components dùng chung
│   │   ├── ui/             # UI primitives (Button, Card, Dialog, Input, Avatar, ...)
│   │   ├── layout/         # Shell điều hướng (AppShell, Sidebar, Topbar, MobileBottomNav)
│   │   ├── pickers/        # Bộ chọn ngày/giờ (DateField, TimeField, DatePicker, ...)
│   │   ├── feedback/       # Chỉ báo phản hồi (OfflineIndicator)
│   │   └── pwa/            # Thành phần PWA (PwaInstallBanner)
│   ├── config/             # Cấu hình ứng dụng, constants, env
│   ├── features/           # Các module chức năng độc lập (Tracer-bullet)
│   │   ├── auth/           # Đăng nhập, xác thực, logout
│   │   ├── calendar/       # Lịch dạy, thời khóa biểu
│   │   ├── notes/          # Ghi chú, checklist
│   │   ├── profile/        # Quản lý hồ sơ, chuyển đổi giới tính & adaptive theme
│   │   ├── tags/           # Quản lý nhãn màu sắc (Tone)
│   │   ├── tasks/          # Nhiệm vụ, công việc
│   │   └── weekly/         # Dashboard tuần, lời chúc, thống kê
│   ├── hooks/              # Global custom hooks (usePwaInstall, useOnlineStatus, ...)
│   ├── lib/                # Cấu hình các thư viện bên ngoài
│   │   ├── api/            # Axios HTTP client, ApiError, endpoints, services
│   │   ├── query/          # TanStack QueryClient, IndexedDB persister, queryKeys
│   │   ├── i18n/           # Hệ thống đa ngôn ngữ (vi, en), translator
│   │   └── theme/          # Design tokens, theme resolver, anti-flash script
│   ├── stores/             # Global Zustand stores (session, preferences)
│   ├── testing/            # Mocks, seed data, mock router, test utils
│   ├── types/              # Domain interfaces & TypeScript types
│   └── utils/              # Tiện ích thuần: date, user selectors, validation schemas, cn
├── test/
│   └── integration/        # Test tích hợp E2E tự động Frontend ↔ Backend thật
├── next.config.js          # Cấu hình Next.js + Serwist PWA
├── postcss.config.mjs      # Cấu hình PostCSS + Tailwind CSS v4
├── eslint.config.js        # Cấu hình ESLint flat config
├── vitest.config.ts        # Cấu hình Vitest unit testing
├── tsconfig.json           # Cấu hình TypeScript với alias @/* trỏ vào ./src/*
└── package.json            # Scripts & dependencies độc lập
```

---

## Chạy dự án

Yêu cầu: **Node ≥ 22.13** và **pnpm ≥ 11**.

```sh
# Cài đặt thư viện
pnpm install

# Khởi chạy môi trường phát triển (http://localhost:3000)
pnpm dev

# Kiểm tra kiểu TypeScript (0 lỗi)
pnpm check-types

# Kiểm tra linter (0 cảnh báo)
pnpm lint

# Chạy toàn bộ test suites (Vitest)
pnpm test

# Chạy riêng test suite tích hợp E2E FE ↔ BE thật
pnpm test:integration

# Build ứng dụng sản phẩm (Next.js + Serwist Service Worker)
pnpm build
```

---

## Chế độ API & Tích hợp E2E Frontend ↔ Backend (SPEC-002)

Ứng dụng hỗ trợ 2 chế độ kết nối dữ liệu qua biến môi trường `NEXT_PUBLIC_API_MODE`:

1. **Chế độ Mock (`NEXT_PUBLIC_API_MODE=mock` — Mặc định khi dev FE độc lập):**
   - Sử dụng in-memory mock adapter (`src/testing/mocks/`), tự sinh dữ liệu và mô phỏng độ trễ mạng.
   - Không cần chạy Docker hay Backend, phù hợp xây dựng giao diện nhanh và kiểm thử offline.

2. **Chế độ HTTP (`NEXT_PUBLIC_API_MODE=http` — Kết nối Backend thật):**
   - Kết nối trực tiếp đến Backend NestJS (`CuteTeachy-BE`) tại `http://localhost:4000`.
   - Đáp ứng toàn diện các kịch bản của SPEC-002: Đăng ký, Đăng nhập, Onboarding, Tải lên/Xoá Avatar (MinIO S3), Tự động gia hạn phiên (Single-Flight Token Auto-Refresh), Xác minh email OTP và Đặt lại mật khẩu (Mailpit).

### Hướng dẫn chạy tích hợp E2E đầu–cuối

#### Bước 1: Khởi động hạ tầng Backend (`CuteTeachy-BE`)
```sh
# Di chuyển vào thư mục CuteTeachy-BE
cd ../CuteTeachy-BE

# Khởi động các container Docker (PostgreSQL, MinIO S3, Mailpit)
docker compose up -d

# Sinh Prisma client và áp dụng migrate database
pnpm prisma:generate
pnpm prisma:migrate

# Khởi động Backend API server (lắng nghe tại http://localhost:4000)
pnpm dev
```

#### Bước 2: Cấu hình Frontend kết nối Backend thật
Tạo hoặc cập nhật file `.env.local` tại thư mục `CuteTeachy-FE`:
```env
NEXT_PUBLIC_API_MODE=http
NEXT_PUBLIC_API_URL=http://localhost:4000
```

#### Bước 3: Khởi chạy Frontend
```sh
# Khởi động giao diện Next.js (http://localhost:3000)
pnpm dev
```

#### Bước 4: Chạy test tích hợp E2E tự động
Test suite tích hợp `test/integration/e2e-cross-repo.spec.ts` tự động kiểm thử toàn bộ 9 User Stories giữa HTTP client của Frontend và Backend API thật:
```sh
# Chạy toàn bộ test suites (bao gồm unit test và e2e integration)
pnpm test

# Hoặc chỉ chạy riêng test suite tích hợp E2E cross-repo
pnpm test:integration
```

### Các dịch vụ hỗ trợ trong quá trình tích hợp

- **Mailpit Web UI (Xem email OTP / Đặt lại mật khẩu):**
  - Truy cập: [http://localhost:8025](http://localhost:8025)
  - Toàn bộ email gửi mã xác minh 6 số khi đăng ký (User Story 8) và email quên mật khẩu (User Story 9) hiển thị tức thì tại đây.
- **MinIO S3 Console (Quản lý lưu trữ Avatar):**
  - Truy cập: [http://localhost:9001](http://localhost:9001) (Tài khoản: `minioadmin` / `minioadmin`)
  - Bucket `avatars` được mở đọc công khai tại `http://localhost:9000/avatars`.
- **Cơ chế Token Auto-Refresh (Single-Flight):**
  - Khi access token hết hạn, HTTP client của FE tự động giữ các request đồng thời, chỉ phát ra duy nhất một request `POST /auth/refresh` đến BE, cập nhật session và replay các request liền mạch mà không làm gián đoạn giáo viên.
- **Google OAuth:**
  - Khởi tạo qua `GET /auth/google?remember=true`.
  - Luồng Google login thật yêu cầu thông tin `[CẦN BỔ SUNG từ người dùng: GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET cấu hình tại CuteTeachy-BE/.env]`. Ở môi trường local dev/mock, hệ thống kiểm chứng contract exchange mã dùng một lần (`POST /auth/google/exchange`).
- **Cờ kiểm tra Xác minh Email bắt buộc:**
  - Mặc định `EMAIL_VERIFICATION_REQUIRED=false` (cho phép đăng nhập ngay sau đăng ký).
  - Khi cấu hình `EMAIL_VERIFICATION_REQUIRED=true` ở Backend, mọi tài khoản tạo bằng mật khẩu chưa xác minh sẽ bị chặn đăng nhập với mã lỗi `403 email_not_verified` cho tới khi hoàn tất bước nhập mã OTP 6 số từ Mailpit.

---

## Tích hợp Web Push & Nhắc việc (SPEC-005)

Hệ thống hỗ trợ thông báo đẩy Web Push chuẩn VAPID cho Task có giờ và tiết dạy (Timetable Slot / Class Session):

1. **Kiểm thử tự động tích hợp xuyên repo (Cross-Repo Integration):**
   ```sh
   # Chạy suite kiểm thử tích hợp Web Push kết nối trực tiếp live Backend
   npx vitest run test/integration/push-reminders-cross-repo.spec.ts
   ```
   Suite kiểm thử tự động xác thực toàn bộ 17 User Stories của SPEC-005: xác thực Cron Secret (`X-Cron-Secret`), cấp phát VAPID public key, upsert subscription thiết bị, chuyển giao endpoint giữa các tài khoản, nhắc việc đúng phút, chống lặp idempotent, đổi giờ / lead minutes / timezone tính lại mốc nhắc, bỏ qua việc hoàn thành/xoá/tiết huỷ/quá muộn, công tắc tổng tắt push, đăng xuất huỷ đăng ký và tự động dọn dẹp subscription hết hạn (410 Gone).

2. **Kiểm thử thủ công trên thiết bị thật (Android Chrome & iOS Safari PWA Standalone):**
   - Xem hướng dẫn chi tiết từng bước tại: [`docs/testing/push-reminders-manual-testing.md`](docs/testing/push-reminders-manual-testing.md).
   - **Android Chrome:** Hỗ trợ trực tiếp thông qua Chrome Remote Debugging USB port forwarding (`adb forward tcp:3000 tcp:3000`) hoặc HTTPS tunnel.
   - **iOS Safari:** Yêu cầu cài đặt ứng dụng vào màn hình chính dưới dạng **PWA Độc lập (Standalone PWA)** theo tiêu chuẩn của Apple iOS 16.4+ trước khi cấp quyền thông báo.

---

## Quy ước code (Architecture Rules)

1. **Feature Encapsulation:** Mỗi feature trong `src/features/<tên>/` chứa đầy đủ `api/`, `components/`, `hooks/` và một public barrel `index.ts`. Các component ngoài feature chỉ được import thông qua public barrel `index.ts`.
2. **Không hard-code text hiển thị:** Toàn bộ văn bản giao diện đi qua hook `useTranslation()` (`t('namespace.key')`). Bản dịch lưu trữ tại `src/lib/i18n/locales/vi` (gốc) và `src/lib/i18n/locales/en`.
3. **Accessibility (WCAG 2.1 AA):** Vùng chạm tối thiểu ≥ 44px, độ tương phản màu chuẩn Material Design 3, focus ring rõ nét, aria-label đầy đủ.
4. **Theme Thích Ứng Giới Tính (Adaptive Theme):** Tự động đổi màu sắc ứng dụng theo giới tính giáo viên (`male` -> `blue`, `female`/`other` -> `pink`), có inline script chống chớp màu (Anti-Flash).
5. **Offline-First & PWA:** Service Worker lưu cache App Shell (`APP_SHELL_ROUTES`), TanStack Query duy trì cache 7 ngày trong IndexedDB (`idb-keyval`).
