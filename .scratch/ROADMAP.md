# Lộ trình feature

Thứ tự feature và nơi điều phối. Coordinator đọc file này để biết feature nào đang mở và phụ thuộc chéo giữa chúng.

| Thứ tự | Feature | Spec | Điều phối | Phụ thuộc chéo |
| --- | --- | --- | --- | --- |
| 1 | auth-profile | SPEC-002 | [`auth-profile/ORCHESTRATION.md`](auth-profile/ORCHESTRATION.md) | — |
| 2 | content-sync | SPEC-003 | [`content-sync/ORCHESTRATION.md`](content-sync/ORCHESTRATION.md) | auth BE-03, BE-04, FE-01, FE-03 |
| 3 | timetable | SPEC-004 | [`timetable/ORCHESTRATION.md`](timetable/ORCHESTRATION.md) | S3-BE-01, S3-BE-02, S3-FE-01 |
| 4 | push-reminders | SPEC-005 | [`push-reminders/ORCHESTRATION.md`](push-reminders/ORCHESTRATION.md) | auth BE-04, S3-BE-02, S3-BE-03, S3-FE-05, S4-BE-02 |

Ticket có blocker ở feature khác chỉ được giao khi blocker đó đã `done` **và** đã merge về branch mà integration branch của feature mới tách ra.

Ticket không bị chặn ở feature sau (ví dụ `S5-FE-02`) có thể giao sớm để lấp chỗ trống, miễn không trùng Vùng sở hữu với ticket đang chạy.
