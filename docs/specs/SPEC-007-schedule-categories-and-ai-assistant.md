# Spec 007: Schedule Categories & Multimodal AI Assistant

- **Trạng thái:** ready-for-agent
- **Phạm vi:** `CuteTeachy-BE` + `CuteTeachy-FE`
- **Nguồn:** [ADR BE 0007 — Trợ lý AI với cơ chế Bản nháp xác nhận & tự xóa ảnh sau 45 ngày](../../../CuteTeachy-BE/docs/adr/0007-ai-assistant-draft-confirmation.md) · [ADR BE 0004 — Class Session sinh từ Timetable Slot](../../../CuteTeachy-BE/docs/adr/0004-class-sessions-from-timetable.md)
- **Phụ thuộc:** SPEC-003 (Task, Note, Settings), SPEC-004 (Timetable Slot, Class Session), SPEC-006 (Dual-Layer Notifications & Note Reminders).
- **Thuật ngữ:** Timetable Slot, Class Session, Schedule Category, AI Schedule Draft, Task, Note — [`GLOSSARY.md`](../../GLOSSARY.md)

## Problem Statement

1. Giáo viên trong thực tế không chỉ có các tiết đứng lớp chính khóa ở trường mà còn có **lịch dạy thêm bên ngoài** và **lịch đi học thêm / bồi dưỡng chuyên môn của chính giáo viên**. Hiện tại `Timetable Slot` và `Class Session` chưa phân biệt được 3 loại lịch này, khiến giáo viên khó nhìn tổng quan và lọc theo mục đích trên lịch tuần/tháng.
2. Việc nhập tay từng tiết thời khóa biểu (có thể lên tới 15–30 tiết/tuần) hoặc nhập danh sách lịch dạy thêm qua biểu mẫu thủ công tốn rất nhiều thời gian, nhất là mỗi đầu học kỳ hoặc khi trường đổi thời khóa biểu và gửi qua ảnh chụp/tin nhắn văn bản.
3. Giáo viên cần một Trợ lý AI thông minh có thể nhận trực tiếp ảnh chụp Thời khóa biểu hoặc tin nhắn liệt kê lịch để bóc tách và thêm lịch chính xác vào tài khoản, đồng thời có thể hỏi nhanh bằng ngôn ngữ tự nhiên xem trong một ngày hoặc tuần bất kỳ mình có những lịch dạy, lịch học, công việc hay ghi chú nào.

## Solution

1. **Phân loại 3 Loại lịch (`Schedule Category`):** Mở rộng `Timetable Slot` và `Class Session` với trường `category` gồm 3 giá trị:
   - `school_teaching` (mặc định): Lịch dạy trên lớp tại trường.
   - `extra_teaching`: Lịch dạy thêm bên ngoài / phụ đạo.
   - `self_study`: Lịch học thêm / bồi dưỡng của chính giáo viên.
   Cả 3 loại đều chia sẻ chung trục thời gian, kiểm tra trùng lịch và hệ thống nhắc việc (`Reminder`), đồng thời hiển thị nhãn/biểu tượng phân biệt rõ ràng trên giao diện Thời khóa biểu và Lịch.
2. **Trợ lý AI Đa phương thức (Google Gemini Multimodal):**
   - Cung cấp trang chuyên biệt `/assistant` trên thanh điều hướng và nút mở nhanh (Floating AI Drawer) tại màn hình Lịch/Thời khóa biểu.
   - Khi giáo viên gửi **ảnh chụp Thời khóa biểu** hoặc **tin nhắn văn bản liệt kê lịch**, BE gửi ngữ cảnh (múi giờ, ngày hôm nay, bảng quy đổi khung giờ tiết học 1–10, lịch hiện có) tới Google Gemini API qua `AiAssistantPort`.
   - AI trả lời kèm thẻ **Bản nháp lịch (`AI Schedule Draft`)** hiển thị danh sách các mục đề xuất (`Timetable Slot`, `Class Session` buổi lẻ, hoặc `Task`), tự động quy đổi "Tiết 1, Tiết 2..." sang giờ `HH:mm` và đánh dấu rõ những mục nào bị trùng giờ với lịch hiện có.
   - Giáo viên có thể chỉnh sửa nhanh trên thẻ Bản nháp, chọn chế độ xử lý trùng lịch (**"Thay thế lịch trùng"** hoặc **"Bỏ qua mục trùng"**) và bấm **"Xác nhận thêm lịch"** để lưu hàng loạt vào tài khoản một cách an toàn.
   - Khi giáo viên hỏi lịch/việc của một ngày hoặc khoảng ngày (ví dụ: *"Thứ 5 tuần này tôi có những việc gì và dạy lớp nào?"*), AI truy vấn cả 4 miền (`Timetable Slot`, `Class Session`, `Task`, `Note`) và trả lời chi tiết, rõ ràng.
   - Ảnh thời khóa biểu đính kèm trong cuộc trò chuyện được lưu qua `ObjectStorage` kèm hạn tự xóa sau **45 ngày (1,5 tháng)** để giải phóng dung lượng lưu trữ tự động.

## User Stories

### Phân loại 3 Loại lịch (`Schedule Category`)
1. As a teacher creating or editing a Timetable Slot, I want to classify it as `school_teaching` (Lịch trên lớp), `extra_teaching` (Lịch dạy thêm), or `self_study` (Lịch học thêm của tôi), so that all three types of recurring schedules live in one unified timetable.
2. As a teacher creating or editing an ad-hoc Class Session, I want to select its `Schedule Category` (`school_teaching`, `extra_teaching`, or `self_study`), so that one-off extra classes or personal study sessions are properly categorized.
3. As a teacher viewing my Weekly Dashboard, Calendar, or Timetable screen, I want each schedule card to display a distinct badge/icon for its `Schedule Category` and allow filtering by category, so that I can distinguish school classes from private tutoring and my own study sessions at a glance.
4. As a teacher receiving a Reminder notification for a `Class Session`, I want the notification title to reflect the appropriate category (e.g., "Tiết dạy", "Ca dạy thêm", "Lịch học"), so that I immediately know the nature of the upcoming session.

### Trợ lý AI — Thêm lịch từ Ảnh & Tin nhắn văn bản
5. As a teacher, I want to upload or snap a photo of my timetable (JPEG, PNG, WebP up to 5MB) in the AI Assistant chat, so that I do not have to type 20+ weekly slots by hand.
6. As a teacher, I want to send a text message listing my schedules (e.g., *"Thêm lịch dạy thêm Toán 9A tối Thứ 3, Thứ 5 từ 18:00 đến 19:30 và lịch học IELTS tối Thứ 7 từ 19:00 đến 21:00"*), so that the AI parses them into structured schedule items with the right `Schedule Category`.
7. As a teacher whose school timetable photo only lists period numbers ("Tiết 1", "Tiết 2"...) without clock times, I want the AI to automatically map period numbers to `startTime`–`endTime` using a standard school period mapping (or time instructions in my message), so that the draft slots already have valid clock times.
8. As a teacher, I want the AI to present parsed schedules as an interactive `AI Schedule Draft` card before saving anything to my account, so that I can verify and edit subject, class/grade, room, category, weekday/date, and time.
9. As a teacher reviewing an `AI Schedule Draft` card, I want any draft item that overlaps with my existing timetable slots to be clearly highlighted with the conflicting slot's details, so that I am never surprised by schedule collisions.
10. As a teacher confirming an `AI Schedule Draft` that has conflicts, I want to choose between **"Replace conflicting schedules"** (`replace_conflicts`) or **"Skip conflicting items"** (`skip_conflicts`), so that I can either update my timetable in one click or only add non-conflicting slots.
11. As a teacher, I want to uncheck or remove individual items inside an `AI Schedule Draft` card before clicking Confirm, so that I only import the items I want.
12. As a teacher who clicks Confirm on an `AI Schedule Draft`, I want the card status to update to `applied` with a summary of created/replaced/skipped items and my Timetable/Calendar cache to refresh immediately, so that I cannot accidentally apply the same draft twice.

### Trợ lý AI — Hỏi đáp Lịch & Công việc trong ngày
13. As a teacher, I want to ask the AI Assistant what classes, study sessions, tasks, or due notes I have on any specific date or date range (e.g., *"Hôm nay tôi có lịch gì?"*, *"Liệt kê các việc và tiết dạy ngày mai"*, *"Tuần này tôi có ca dạy thêm nào?"*), so that I get an accurate, consolidated summary from my real account data.
14. As a teacher viewing my conversation with the AI Assistant across devices, I want my chat messages and draft cards to be saved in my account history and my uploaded chat images to be automatically purged after 45 days, so that my chat stays synced without bloating storage.
15. As a teacher browsing my Calendar or Timetable page, I want a quick Floating AI Assistant button (as well as a dedicated `/assistant` navigation tab), so that I can invoke the AI from anywhere in the app.

## Implementation Decisions

### Mở rộng `ScheduleCategory` trên `TimetableSlot` và `ClassSession`
- Định nghĩa kiểu `ScheduleCategory = 'school_teaching' | 'extra_teaching' | 'self_study'` (enum Prisma `ScheduleCategory`, mặc định `'school_teaching'`).
- Bổ sung cột `category ScheduleCategory @default(school_teaching)` vào bảng `timetable_slots` và cột `category ScheduleCategory?` vào bảng `class_sessions`:
  - Với `ClassSession` sinh từ `TimetableSlot`: kế thừa `category` của slot (hoặc lấy từ bản ghi đè nếu có).
  - Với `ClassSession` buổi lẻ (`timetableSlotId = null`): lưu `category` trực tiếp (mặc định `'school_teaching'` nếu client không truyền).
- Cập nhật `formatClassSessionReminderNotification` để hiển thị tiền tố phù hợp theo `category` và `locale`:
  - `school_teaching`: `"Tiết dạy"` / `"Class session"`
  - `extra_teaching`: `"Ca dạy thêm"` / `"Extra tutoring"`
  - `self_study`: `"Lịch học"` / `"Study session"`
- Toàn bộ logic kiểm tra trùng lịch (`hasTimetableConflict`) áp dụng chung cho mọi `TimetableSlot` bất kể `category`, vì giáo viên không thể vừa đứng lớp ở trường vừa dạy thêm hoặc đi học thêm tại cùng một thời điểm.

### Mô hình Dữ liệu Trợ lý AI & Tự động xóa ảnh sau 45 ngày
- **Bảng `ai_chat_messages` (`AiChatMessage`):**
  - `id`: UUID
  - `accountId`: String (cascade khi xóa Account)
  - `role`: `'user' | 'assistant'`
  - `content`: String (văn bản tin nhắn hoặc câu trả lời của AI)
  - `imageUrl`: `String?` (URL hiển thị ảnh nếu tin nhắn có đính kèm ảnh)
  - `imageKey`: `String?` (key trên `ObjectStorage` để xóa file vật lý)
  - `imageExpiresAt`: `DateTime?` (`now + 45 ngày` tính từ lúc upload ảnh)
  - `draft`: `Json?` (lưu cấu trúc `AiScheduleDraft` nếu tin nhắn của assistant chứa bản nháp thêm lịch)
  - `createdAt`: `DateTime`
- **Cấu trúc `AiScheduleDraft`:**
  ```ts
  export type AiDraftItemKind = 'timetable_slot' | 'class_session' | 'task';

  export interface AiScheduleDraftItem {
    id: string;
    kind: AiDraftItemKind;
    category: 'school_teaching' | 'extra_teaching' | 'self_study';
    titleOrSubject: string;
    grade?: string | null;
    room?: string | null;
    weekday?: number | null;       // 1..7 cho timetable_slot
    date?: string | null;          // YYYY-MM-DD cho class_session hoặc task
    startTime?: string | null;     // HH:mm
    endTime?: string | null;       // HH:mm (cho timetable_slot / class_session)
    effectiveFrom?: string | null; // YYYY-MM-DD cho timetable_slot
    effectiveTo?: string | null;
    tone?: 'pink' | 'blue' | 'beige' | 'lavender' | 'rose' | 'mint';
    notes?: string | null;
    conflict?: {
      slotId: string;
      subject: string;
      startTime: string;
      endTime: string;
    } | null;
  }

  export interface AiScheduleDraft {
    status: 'pending' | 'applied';
    appliedAt?: string | null;
    conflictStrategy?: 'replace_conflicts' | 'skip_conflicts' | null;
    summary?: {
      createdCount: number;
      replacedCount: number;
      skippedCount: number;
    } | null;
    items: AiScheduleDraftItem[];
  }
  ```
- **Quy đổi khung giờ tiết học mặc định (Standard Period Time Table):**
  - Trong prompt hệ thống của `AiAssistantPort`, cung cấp bảng khung giờ tiết học tiêu chuẩn tại Việt Nam để khi ảnh TKB chỉ ghi "Tiết 1..5 (Sáng)" hoặc "Tiết 1..5 (Chiều)" mà người dùng không nêu giờ riêng, Gemini tự động quy đổi chuẩn xác sang `startTime`–`endTime`:
    - Sáng: Tiết 1 (`07:00–07:45`), Tiết 2 (`07:50–08:35`), Tiết 3 (`08:50–09:35`), Tiết 4 (`09:40–10:25`), Tiết 5 (`10:30–11:15`).
    - Chiều: Tiết 1 / Tiết 6 (`13:30–14:15`), Tiết 2 / Tiết 7 (`14:20–15:05`), Tiết 3 / Tiết 8 (`15:20–16:05`), Tiết 4 / Tiết 9 (`16:10–16:55`), Tiết 5 / Tiết 10 (`17:00–17:45`).
  - Nếu giáo viên ghi chú giờ riêng trong tin nhắn (ví dụ *"Trường tôi tiết 1 từ 7h15"*), AI ưu tiên giờ do giáo viên cung cấp.
- **Tích hợp Google Gemini API (`GeminiAiAssistantAdapter`):**
  - Triển khai qua port `AiAssistantPort` trong tầng `application/ai-assistant/ports/`.
  - Adapter ở `infrastructure/ai/` gọi trực tiếp REST endpoint `generativelanguage.googleapis.com` (dùng native `fetch` của Node 20+, không làm phình `node_modules`) với cấu hình `GEMINI_API_KEY` và `GEMINI_MODEL` (mặc định `gemini-2.5-flash`) cùng `responseSchema` (Structured JSON Output) để luôn trả về `{ reply: string, draftItems?: AiScheduleDraftItem[] }` chuẩn xác 100%.
  - Khi gửi câu hỏi về lịch trong ngày/khoảng ngày, Use Case đọc dữ liệu `TimetableSlot`, `ClassSession`, `Task`, `Note` của tài khoản trong khoảng ngày liên quan (mặc định từ đầu tuần hiện tại đến 14 ngày tới, hoặc khoảng ngày được nhắc tới trong câu hỏi) và đính kèm vào ngữ cảnh để AI tổng hợp câu trả lời chính xác tuyệt đối theo dữ liệu thật trong DB.
  - Nếu chưa cấu hình `GEMINI_API_KEY` trên môi trường server, trả mã lỗi domain rõ ràng `ai_provider_not_configured` (`503 Service Unavailable`) hướng dẫn cấu hình `GEMINI_API_KEY`.
- **Cơ chế tự động xóa ảnh sau 45 ngày (`PurgeExpiredAiImagesUseCase`):**
  - Được gọi tự động trong bước housekeeping của `DispatchRemindersUseCase` (chạy mỗi phút).
  - Tìm các bản ghi `AiChatMessage` có `imageKey != null` và `imageExpiresAt <= now`: gọi `objectStorage.deleteObject` để xóa file ảnh trên S3/MinIO, sau đó cập nhật `imageUrl = null, imageKey = null, imageExpiresAt = null` trên bản ghi tin nhắn (vẫn giữ nguyên nội dung chữ và thẻ `draft` của cuộc trò chuyện).

### Áp dụng Bản nháp (`ApplyAiScheduleDraftUseCase`)
- Nhận `accountId`, `messageId`, danh sách `items` (cho phép giáo viên đã chỉnh sửa giờ/môn/loại lịch hoặc bỏ bớt mục trên UI trước khi bấm xác nhận), và `conflictStrategy: 'replace_conflicts' | 'skip_conflicts'`.
- Nếu `draft.status === 'applied'`, trả lỗi `409 ai_draft_already_applied`.
- Thực thi trong `UnitOfWork`:
  - Với mỗi mục `timetable_slot`: kiểm tra xung đột với các `TimetableSlot` đang hoạt động của giáo viên.
    - Nếu có xung đột và `conflictStrategy === 'skip_conflicts'`: tăng `skippedCount`, bỏ qua mục này.
    - Nếu có xung đột và `conflictStrategy === 'replace_conflicts'`: sử dụng logic kết thúc hiệu lực/xóa mềm của `TimetableSlot` (nếu slot cũ có `effectiveFrom < today` thì đặt `effectiveTo = yesterday`, nếu `effectiveFrom >= today` thì xóa mềm `markDeleted`), tăng `replacedCount`, sau đó tạo `TimetableSlot` mới.
    - Nếu không xung đột: tạo `TimetableSlot` mới, tăng `createdCount`.
  - Với mỗi mục `class_session` (buổi lẻ) và `task`: tạo mới tương ứng vào DB, tăng `createdCount`.
- Cập nhật `draft.status = 'applied'`, `draft.appliedAt = now`, `draft.summary = { createdCount, replacedCount, skippedCount }` và trả về kết quả.

### API Contracts

| Method & path | Ghi chú |
| --- | --- |
| `GET /ai-assistant/messages[?limit=50]` | Lấy lịch sử hội thoại AI của giáo viên hiện tại |
| `POST /ai-assistant/messages` | `multipart/form-data` hoặc `application/json`: `{ message?: string, image?: File }` → trả `{ userMessage, assistantMessage }` |
| `POST /ai-assistant/drafts/:messageId/apply` | `{ conflictStrategy: 'replace_conflicts' \| 'skip_conflicts', items?: AiScheduleDraftItem[] }` → trả `{ message, summary }` |
| `DELETE /ai-assistant/messages` | Xóa lịch sử hội thoại AI của tài khoản hiện tại (đồng thời dọn ảnh S3 liên quan) → `204` |
| `POST /timetable-slots` / `PATCH /timetable-slots/:id` / `GET /timetable-slots` | Bổ sung trường `category?: 'school_teaching' \| 'extra_teaching' \| 'self_study'` |
| `POST /class-sessions` / `PATCH /class-sessions/:id` / `GET /class-sessions` | Bổ sung trường `category?: 'school_teaching' \| 'extra_teaching' \| 'self_study'` |

## Testing Decisions

- Chỉ kiểm thử hành vi qua các seam đã thống nhất:
- **Seam 3 — Use Cases Trợ lý AI (`SendAiMessageUseCase`, `ApplyAiScheduleDraftUseCase`, `PurgeExpiredAiImagesUseCase`) với `AiAssistantPort` giả, `Clock` giả và `ObjectStorage` giả:**
  - Gửi tin nhắn văn bản hoặc ảnh chụp TKB: lưu ảnh qua `ObjectStorage` với `imageExpiresAt = now + 45 ngày`, gọi `AiAssistantPort`, tự động gắn thông tin `conflict` vào từng mục trong `draft.items` khi giao giờ với `TimetableSlot` hiện có.
  - Gửi câu hỏi về công việc/lịch dạy trong ngày: truyền đúng danh sách `ClassSession` (sinh từ slot + buổi lẻ), `Task`, và `Note` của ngày đó vào context của `AiAssistantPort`.
  - Áp dụng bản nháp (`ApplyAiScheduleDraftUseCase`) với `skip_conflicts`: giữ nguyên slot cũ bị trùng, chỉ tạo các mục không trùng.
  - Áp dụng bản nháp với `replace_conflicts`: tự động kết thúc hiệu lực (`effectiveTo = yesterday`) hoặc xóa mềm slot cũ bị trùng rồi tạo slot mới mà không văng lỗi conflict; đánh dấu `draft.status = 'applied'`.
  - Bấm áp dụng lại một bản nháp đã `applied` → trả lỗi `ai_draft_already_applied` (`409`).
  - `PurgeExpiredAiImagesUseCase`: chỉ xóa các ảnh có `imageExpiresAt <= now` trên `ObjectStorage` và xóa trường `imageUrl`/`imageKey` trong DB, giữ nguyên ảnh chưa hết hạn 45 ngày và giữ nguyên nội dung tin nhắn.
- **Seam 1 — HTTP API BE (E2E tests):**
  - Tạo và đọc `TimetableSlot` / `ClassSession` với đủ 3 loại `category` (`school_teaching`, `extra_teaching`, `self_study`).
  - Gửi tin nhắn + upload ảnh qua `POST /ai-assistant/messages` (vượt quá 5MB hoặc sai định dạng ảnh → `400`).
  - Áp dụng bản nháp qua `POST /ai-assistant/drafts/:messageId/apply` và kiểm tra `GET /timetable-slots` / `GET /class-sessions` / `GET /tasks` thực sự có dữ liệu mới.
- **Seam 4 — FE Components, Hooks & Mock Handlers:**
  - Hiển thị và lọc theo `ScheduleCategory` trên trang Thời khóa biểu và Lịch.
  - Giao diện chat Trợ lý AI (`/assistant` và Floating Drawer): gửi tin nhắn/ảnh, hiển thị thẻ `AI Schedule Draft`, chỉnh sửa mục nháp, chọn chế độ xử lý trùng lịch và bấm Xác nhận.

## Out of Scope

- Nhận diện giọng nói (Voice-to-Text trực tiếp từ micro) hoặc tệp PDF/Excel nhiều trang.
- Tự động đồng bộ hai chiều với Google Calendar hoặc Apple Calendar.

## Further Notes

- Biến môi trường mới trong `CuteTeachy-BE/.env.example`: `GEMINI_API_KEY` (tùy chọn khi khởi động app để không chặn các module khác, bắt buộc khi gọi AI thật) và `GEMINI_MODEL` (mặc định `gemini-2.5-flash`).
