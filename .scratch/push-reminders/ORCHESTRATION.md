# Điều phối: push-reminders (SPEC-005)

Vai trò, mô hình git, vòng lặp Coordinator, gate, mẫu prompt và điều kiện BLOCKED: **dùng nguyên** [`../auth-profile/ORCHESTRATION.md`](../auth-profile/ORCHESTRATION.md) §2–§5, §7–§8.

- **Spec:** [`docs/specs/SPEC-005-push-reminders.md`](../../docs/specs/SPEC-005-push-reminders.md)
- **Ticket FE:** [`./issues/`](./issues/) · **Ticket BE:** `../CuteTeachy-BE/.scratch/push-reminders/issues/`
- **Integration branch:** `feat/push-reminders` ở cả hai repo.
- **Cần từ người dùng cho S5-INT production:** khoá VAPID production, `CRON_SECRET`, job cron-job.org (xem `CuteTeachy-BE/docs/setup/external-services.md` §4–§5). Thiếu thì các ticket khác vẫn làm được bằng khoá dev + `PushSender` giả.

## Task graph

```mermaid
flowchart LR
  AB4["auth BE-04"] --> S5B1["S5-BE-01 Thiết bị nhận push"]
  S5B1 --> S5B2["S5-BE-02 Reminder Task + dispatch"]
  S3B2["S3-BE-02"] --> S5B2
  S3B3["S3-BE-03"] --> S5B2
  S5B2 --> S5B3["S5-BE-03 Reminder Class Session"]
  S4B2["S4-BE-02"] --> S5B3
  S3F5["S3-FE-05"] --> S5F1["S5-FE-01 Xin quyền + đăng ký"]
  S5F2["S5-FE-02 Service worker"]
  S5B3 --> INT["S5-INT thiết bị thật"]
  S5F1 --> INT
  S5F2 --> INT
```

`S5-FE-02` không bị chặn — có thể giao ngay từ wave đầu của bất kỳ đợt nào khi còn chỗ trống.

## Vùng dễ xung đột

- Service worker (`S5-FE-02`) dùng chung file với cache/Background Sync hiện có — chỉ thêm listener, không đổi phần cũ.
- Use case dispatch (`S5-BE-02`) gọi dọn dấu xoá mềm của `S3-BE-01` — chỉ gọi, không sửa.

## Bảng trạng thái

| Ticket | Status | Branch | Ghi chú |
| --- | --- | --- | --- |
| S5-BE-01 | done | ticket/s5-be-01-push-subscriptions | Đã merge 3516d2d |
| S5-BE-02 | done | ticket/s5-be-02-task-reminders-dispatch | Đã merge 5494acf |
| S5-BE-03 | in-progress | ticket/s5-be-03-class-session-reminders | Wave 3 |
| S5-FE-01 | done | ticket/s5-fe-01-permission-subscription | Đã merge 44bc7f8 |
| S5-FE-02 | done | ticket/s5-fe-02-service-worker-push | Đã merge 5d69521 |
| S5-INT | ready-for-agent | | |
