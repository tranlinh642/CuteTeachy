# CuteTeachy – Frontend monorepo

Planner cho giáo viên (lịch dạy theo tuần/tháng, ghi chú, to-do, tag). Monorepo **Turborepo + pnpm** gồm bản web và bản app.

| Thư mục | Package | Vai trò |
|---|---|---|
| `apps/web` | `web` | Next.js 16 (App Router) + Tailwind v4 – cổng `3000` |
| `apps/mobile` | `mobile` | Expo 57 + expo-router, `StyleSheet` + tokens |
| `packages/tokens` | `@cute-teachy/tokens` | Design tokens (màu, tone, typography, spacing, radius, shadow, icon) + `css/theme.css` cho Tailwind |
| `packages/types` | `@cute-teachy/types` | Kiểu dữ liệu domain – **mỗi domain 1 file** trong `src/interfaces/` |
| `packages/i18n` | `@cute-teachy/i18n` | Bản dịch `vi` (gốc) + `en`, `I18nProvider`, `useTranslation` |
| `packages/core` | `@cute-teachy/core` | Logic thuần: date utils, validation (zod), selectors, zustand stores (session, preferences) |
| `packages/api` | `@cute-teachy/api` | Axios + interceptors, services, mock backend, hooks TanStack Query |
| `packages/eslint-config`, `packages/typescript-config` | `@repo/*` | Cấu hình dùng chung |

Tài liệu nguồn: `docs/ba/` (BA – NotebookLM), `docs/design/stitch/` (thiết kế Google Stitch).

## Chạy dự án

Yêu cầu: **Node ≥ 22.13** (khuyên dùng Node 24 LTS) và **pnpm 11.28.2** (`npm i -g pnpm@11` – pnpm tự chuyển đúng phiên bản theo `devEngines`).

```sh
pnpm install
pnpm web          # http://localhost:3000
pnpm mobile       # Expo (quét QR bằng Expo Go)
pnpm check-types  # kiểm tra kiểu toàn repo
pnpm test         # vitest cho các package
pnpm lint
```

Biến môi trường (BE NestJS chạy cổng `4000`):

| App | Biến | Mặc định |
|---|---|---|
| web | `NEXT_PUBLIC_API_URL` | `http://localhost:4000` |
| mobile | `EXPO_PUBLIC_API_URL` | `http://localhost:4000` |

Hiện tại `@cute-teachy/api` chạy **mode `mock`** (dữ liệu seed, tài khoản demo `linh@cuteteachy.vn` / `123456`). Khi có BE, đổi `mode: 'http'` trong providers của từng app – UI không cần sửa.

## Kiến trúc

```
routes (app/)  →  features/*  →  components/ui, components/layout  →  @cute-teachy/tokens
                      │
                      └─ hooks  →  @cute-teachy/api (server data)  +  @cute-teachy/core (logic, client state)
```

- **Dùng chung 100%:** tokens, types, i18n, core, api. **UI riêng từng nền tảng** nhưng tên component và props giống nhau (`Button`, `IconButton`, `Chip`, `Card`, …).
- **Server data** → hook TanStack Query trong `@cute-teachy/api`. **Client state** (phiên đăng nhập, ngôn ngữ, cài đặt) → zustand trong `@cute-teachy/core`.
- **Route mỏng:** file trong `app/` chỉ ghép feature, không chứa logic.
- **Feature độc lập:** `features/<tên>/{components,hooks,index.ts}`; feature khác chỉ import qua `index.ts`.

## Quy ước code

1. **Không hard-code chữ hiển thị.** Mọi text dùng `t('namespace.key')`. Thêm key vào **cả** `packages/i18n/src/locales/vi/<ns>.ts` và `en/<ns>.ts` (bản `en` được type theo `vi`, thiếu key sẽ báo lỗi). Tên thứ/tháng lấy qua formatter `Intl` trong `core`.
2. **Mỗi interface/domain một file**, barrel `index.ts` chỉ re-export. Props interface đặt cạnh component, dùng `readonly`.
3. **Không dùng giá trị thiết kế rời rạc** – lấy từ tokens (web: class Tailwind sinh từ `theme.css`; mobile: `src/theme`). Sửa token trong `packages/tokens/src/tokens.ts` rồi chạy `pnpm --filter @cute-teachy/tokens generate`.
4. **Validation** dùng schema zod trong `core`; message là i18n key.
5. **Accessibility (WCAG AA):** vùng chạm ≥ 44px, icon button bắt buộc có label, focus ring rõ ràng.
6. Logic mới trong `packages/*` cần kèm unit test (vitest).

## Thêm một tính năng mới (ví dụ)

1. Kiểu dữ liệu → `packages/types/src/interfaces/<domain>.interface.ts`.
2. Endpoint + service + mock handler + hook → `packages/api`.
3. Logic thuần / schema → `packages/core` (+ test).
4. Chuỗi hiển thị → `packages/i18n` (vi + en).
5. UI → `apps/web/src/features/<domain>` và `apps/mobile/src/features/<domain>`, rồi gắn vào route.

## Quản lý Skills (Tối ưu Token Context)

Dự án đã tối ưu giảm 90% dung lượng skill prompt (giữ lại các skill chính: thiết kế giao diện, Office, NotebookLM). Khi cần làm việc với GCP/BigQuery:
- Bật lại: `powershell -ExecutionPolicy Bypass -File scripts/toggle-datacloud-skills.ps1 -Action enable`
- Tắt lại: `powershell -ExecutionPolicy Bypass -File scripts/toggle-datacloud-skills.ps1 -Action disable`

