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

# Build ứng dụng sản phẩm (Next.js + Serwist Service Worker)
pnpm build
```

---

## Quy ước code (Architecture Rules)

1. **Feature Encapsulation:** Mỗi feature trong `src/features/<tên>/` chứa đầy đủ `api/`, `components/`, `hooks/` và một public barrel `index.ts`. Các component ngoài feature chỉ được import thông qua public barrel `index.ts`.
2. **Không hard-code text hiển thị:** Toàn bộ văn bản giao diện đi qua hook `useTranslation()` (`t('namespace.key')`). Bản dịch lưu trữ tại `src/lib/i18n/locales/vi` (gốc) và `src/lib/i18n/locales/en`.
3. **Accessibility (WCAG 2.1 AA):** Vùng chạm tối thiểu ≥ 44px, độ tương phản màu chuẩn Material Design 3, focus ring rõ nét, aria-label đầy đủ.
4. **Theme Thích Ứng Giới Tính (Adaptive Theme):** Tự động đổi màu sắc ứng dụng theo giới tính giáo viên (`male` -> `blue`, `female`/`other` -> `pink`), có inline script chống chớp màu (Anti-Flash).
5. **Offline-First & PWA:** Service Worker lưu cache App Shell (`APP_SHELL_ROUTES`), TanStack Query duy trì cache 7 ngày trong IndexedDB (`idb-keyval`).
