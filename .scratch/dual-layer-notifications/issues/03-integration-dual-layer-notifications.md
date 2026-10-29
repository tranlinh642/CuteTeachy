# 03: S6-INT — Tích hợp End-to-End Hệ thống Thông báo 2 tầng (FE ↔ BE)

**What to build:** Toàn bộ luồng thông báo 2 tầng (In-App Notification Center + Local Ticker + Web Push + Note Reminder + Test Push) hoạt động đồng bộ giữa FE và BE.

**Blocked by:** S6-BE-02, S6-FE-02

**Status:** ready-for-agent

- [ ] Khớp hoàn toàn contract HTTP giữa `CuteTeachy-FE` và `CuteTeachy-BE` cho Note `remindTime`, `/notifications` và `/push/subscriptions/test`.
- [ ] Toàn bộ unit test và e2e test ở cả 2 repo đều xanh (`pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm test:e2e`).
