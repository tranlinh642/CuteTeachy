export const push = {
  dialog: {
    explanationTitle: 'Bật thông báo nhắc việc',
    explanationDescription:
      'CuteTeachy sẽ gửi thông báo nhắc bạn trước khi đến giờ tiết dạy hoặc việc cần làm, giúp bạn luôn chủ động trên lớp và không quên công việc.',
    benefitTimetable: 'Nhắc trước giờ tiết dạy theo thời khoá biểu',
    benefitTask: 'Nhắc công việc có giờ hẹn (Task) đúng lúc',
    iosGuideTitle: 'Thêm vào Màn hình chính trước',
    iosGuideDescription:
      'Trên thiết bị iOS (iPhone/iPad), Apple chỉ cho phép gửi thông báo đẩy khi ứng dụng đã được thêm vào Màn hình chính ở chế độ PWA.',
    iosGuideInstruction:
      'Nhấn nút Chia sẻ (biểu tượng mũi tên hướng lên) trên trình duyệt Safari, sau đó chọn "Thêm vào MH chính" (Add to Home Screen). Mở app từ màn hình chính để bật thông báo.',
    iosStep1: 'Bước 1: Nhấn nút Chia sẻ (biểu tượng mũi tên hướng lên) trên thanh công cụ trình duyệt.',
    iosStep2: 'Bước 2: Cuộn xuống và chọn "Thêm vào Màn hình chính" (Add to Home Screen).',
    iosStep3: 'Bước 3: Mở CuteTeachy từ biểu tượng trên Màn hình chính và bấm bật thông báo.',
    deniedTitle: 'Thông báo đang bị chặn',
    deniedDescription:
      'Trình duyệt đang chặn quyền thông báo của CuteTeachy. Bạn cần cấp quyền lại trong phần cài đặt của trình duyệt để nhận lời nhắc.',
    deniedInstruction:
      'Bấm vào biểu tượng ổ khoá hoặc cài đặt trang web trên thanh địa chỉ, tìm mục "Thông báo" và chuyển thành "Cho phép".',
    allowButton: 'Bật thông báo ngay',
    dismissButton: 'Để sau',
    closeButton: 'Đóng',
    understoodButton: 'Đã hiểu',
    subscribing: 'Đang đăng ký...',
    successMessage: 'Đã bật thông báo thành công!',
    errorMessage: 'Không thể đăng ký nhận thông báo. Vui lòng thử lại sau.',
  },
  banner: {
    title: 'Đừng bỏ lỡ tiết dạy & công việc',
    description: 'Bật thông báo nhắc trước để CuteTeachy nhắc bạn trước giờ vào lớp!',
    enableButton: 'Bật thông báo',
    dismissButton: 'Để sau',
  },
  settings: {
    pushEnabledLabel: 'Thông báo đẩy',
    statusConnected: 'Thiết bị này đã sẵn sàng nhận thông báo',
    statusNotEnabledOnDevice: 'Thiết bị này chưa bật thông báo đẩy (hiện chỉ báo trong ứng dụng)',
    statusDenied: 'Đã bị chặn trong trình duyệt',
    statusNotSupported: 'Trình duyệt không hỗ trợ',
    statusIosNeedsPwa: 'Cần thêm vào màn hình chính',
    enableIosButton: 'Bật thông báo trên iPhone/iPad',
    enableDeviceButton: 'Bật thông báo trên thiết bị này',
    reconnectDeviceHint: 'Trình duyệt đã cấp quyền nhưng thiết bị này chưa đồng bộ đăng ký nhận thông báo đẩy.',
    reconnectDeviceButton: 'Kết nối lại thiết bị này',
    openIosGuideButton: 'Xem hướng dẫn cài PWA',
    testButton: 'Gửi thông báo thử',
    testSending: 'Đang gửi thử...',
    testSuccessSent: 'Đã gửi thông báo thử thành công ({{sent}} thiết bị)!',
    testSuccessInAppOnly: 'Đã tạo thông báo thử trong ứng dụng (chưa có thiết bị nhận đẩy).',
    testError: 'Không thể gửi thông báo thử. Vui lòng thử lại.',
  },
};
