# Điều phối: timetable (SPEC-004)

Vai trò, mô hình git, vòng lặp Coordinator, gate, mẫu prompt và điều kiện BLOCKED: **dùng nguyên** [`../auth-profile/ORCHESTRATION.md`](../auth-profile/ORCHESTRATION.md) §2–§5, §7–§8.

- **Spec:** [`docs/specs/SPEC-004-timetable-class-sessions.md`](../../docs/specs/SPEC-004-timetable-class-sessions.md)
- **Ticket FE:** [`./issues/`](./issues/) · **Ticket BE:** `../CuteTeachy-BE/.scratch/timetable/issues/`
- **Integration branch:** `feat/timetable` ở cả hai repo, tách sau khi phần SPEC-003 mà nó phụ thuộc đã merge.

## Task graph

```mermaid
flowchart LR
  S3B1["S3-BE-01"] --> S4B1["S4-BE-01 Slot + buổi sinh"]
  S3B2["S3-BE-02"] --> S4B1
  S4B1 --> S4B2["S4-BE-02 Ghi đè + buổi lẻ"]
  S4B2 --> S4B3["S4-BE-03 Sửa/xoá slot (tách)"]
  S4B3 --> S4B4["S4-BE-04 Đồng bộ chênh lệch buổi"]
  S3F1["S3-FE-01"] --> S4F1["S4-FE-01 Kiểu + mock + lịch"]
  S4F1 --> S4F2["S4-FE-02 Quản lý thời khoá biểu"]
  S4F1 --> S4F3["S4-FE-03 Chi tiết buổi + buổi lẻ"]
  S4B4 --> INT["S4-INT"]
  S4F2 --> INT
  S4F3 --> INT
```

Chuỗi BE tuần tự vì cùng chạm logic sinh buổi; FE chạy song song với BE trên mock, `S4-FE-02` và `S4-FE-03` song song với nhau.

## Vùng dễ xung đột

- Domain sinh buổi/kiểm trùng (tạo ở `S4-BE-01`) được `S4-BE-02..04` và `S5-BE-03` mở rộng — luôn chạy tuần tự, không song song.
- `S4-FE-02` và `S4-FE-03` cùng thêm handler mock vào feature timetable: mỗi ticket một nhóm handler riêng; xung đột chỉ ở chỗ đăng ký route mock (cơ học).

## Bảng trạng thái

| Ticket | Status | Branch | Ghi chú |
| --- | --- | --- | --- |
| S4-BE-01 | done | ticket/s4-be-01-slots-generated-sessions | Đã merge baab158 |
| S4-BE-02 | done | ticket/s4-be-02-session-overrides-adhoc | Đã merge 684e90d |
| S4-BE-03 | done | ticket/s4-be-03-edit-delete-slot-split | Đã merge 54bba37 |
| S4-BE-04 | done | ticket/s4-be-04-class-session-delta-sync | Đã merge fb4edbd |
| S4-FE-01 | done | ticket/s4-fe-01-types-mock-calendar | Đã merge 28c1810 |
| S4-FE-02 | done | ticket/s4-fe-02-timetable-management | Đã merge f0cc492 |
| S4-FE-03 | done | ticket/s4-fe-03-session-detail-adhoc | Đã merge cf25993 |
| S4-INT | done | ticket/s4-int-e2e-integration | Đã merge def8783 |
