# Chương 6: Thiết kế Giao diện và Trải nghiệm Người dùng (UI/UX Design)

## 6.2. Thiết kế Luồng người dùng (User Flows)

Luồng người dùng (User Flow) mô tả các bước cụ thể mà từng đối tượng người dùng thực hiện để hoàn thành các tác vụ trên hệ thống. Việc thiết kế luồng người dùng tối ưu giúp giảm thiểu thời gian thao tác tại trạm Kiosk, ngăn chặn sai sót trong khâu đăng ký và đảm bảo an ninh tuyệt đối cho khu vực R&D. Hệ thống được chia làm 3 luồng chính tương ứng với 3 vai trò: Kỹ sư R&D, Nhân viên Bảo vệ và Quản trị viên (Admin/Manager).

### 6.2.1. Luồng của Kỹ sư R&D (R&D Engineer Flow)
Kỹ sư R&D là người tương tác trực tiếp với cả Web Portal và màn hình Kiosk. Mục tiêu của luồng này là sự nhanh chóng và tiện lợi.

**Luồng 1: Khai báo thiết bị cá nhân/công ty mang vào phòng R&D**
1. **Đăng nhập:** Kỹ sư đăng nhập vào hệ thống Web Portal thông qua tài khoản cá nhân.
2. **Khai báo thông tin:** Truy cập trang "Đăng ký thiết bị" (`DeviceRegistrationPage`). Điền biểu mẫu với các thông tin bắt buộc: Loại thiết bị (Laptop, Điện thoại, Ổ cứng,...), Thương hiệu, Model và Số Serial (SN).
3. **Chờ phê duyệt:** Sau khi gửi (Submit), thiết bị được lưu vào cơ sở dữ liệu với trạng thái **"PENDING"** (Chờ duyệt). Kỹ sư có thể theo dõi trạng thái này trên trang cá nhân.
4. **Cấp phát định danh:** Sau khi được Quản lý duyệt (chuyển sang **"APPROVED"**), kỹ sư có thể truy cập trang Quản lý mã QR (`DeviceQRTagsPage`) để in mã QR dán lên thiết bị của mình.

**Luồng 2: Check-in (Vào phòng) tại trạm Kiosk**
1. **Xác thực:** Kỹ sư tiếp cận Kiosk đặt ngoài cửa phòng R&D, quét mã QR cá nhân hoặc thẻ từ RFID vào đầu đọc.
2. **Chọn thiết bị:** Màn hình Kiosk (`CheckInPage`) ngay lập tức hiển thị thông tin kỹ sư và danh sách các thiết bị đã được "APPROVED". Kỹ sư tick chọn các thiết bị dự định mang vào, hoặc sử dụng camera Kiosk để quét mã QR gắn trên thiết bị.
3. **Xác minh hình ảnh:** Camera trên Kiosk (`CameraCapture`) tự động chụp ảnh khuôn mặt hiện tại của kỹ sư để lưu log đối chiếu an ninh.
4. **Hoàn tất:** Kỹ sư bấm nút "Check In". Trạng thái của kỹ sư và thiết bị chuyển thành **"CHECKED IN"**, hệ thống gửi tín hiệu mở cửa tự động.

**Luồng 3: Check-out (Ra khỏi phòng) tại trạm Kiosk**
1. **Xác thực:** Kỹ sư thao tác trên Kiosk đặt ở mặt trong phòng R&D, quét thẻ/mã QR.
2. **Xác nhận mang ra:** Hệ thống hiển thị danh sách thiết bị đang ở trạng thái **"CHECKED IN"**. Kỹ sư xác nhận mang toàn bộ thiết bị ra ngoài (nếu để lại thiết bị trong phòng, phải tick bỏ chọn thiết bị đó).
3. **Hoàn tất:** Bấm nút "Check Out". Trạng thái chuyển thành **"CHECKED OUT"** và cửa mở.

---

### 6.2.2. Luồng của Bảo vệ (Security Guard Flow)
Nhân viên bảo vệ/an ninh sử dụng hệ thống để giám sát toàn cảnh và xử lý các sự cố ngoại lệ. Giao diện của bảo vệ tập trung vào tính trực quan và cập nhật dữ liệu thời gian thực (real-time).

**Luồng 1: Giám sát an ninh theo thời gian thực**
1. **Truy cập Dashboard:** Bảo vệ đăng nhập vào Web Portal và để mở trang `DashboardPage` toàn thời gian trên màn hình trạm trực.
2. **Theo dõi Real-time:** Bảng điều khiển liên tục tự động cập nhật (qua kết nối WebSocket) các thông số:
   * Tổng số người hiện đang ở trong phòng R&D ("Currently in room").
   * Danh sách chi tiết tên kỹ sư và thiết bị họ đang mang bên trong.
3. **Giám sát Camera & Nhật ký:** Màn hình hiển thị song song luồng nhật ký hoạt động (Activity Logs) mới nhất, kèm theo hình ảnh khuôn mặt được Kiosk chụp lại tại thời điểm Check-in để bảo vệ đối chiếu ngoại quan.

**Luồng 2: Xác minh an ninh thủ công và Xử lý ngoại lệ**
1. **Phát hiện lỗi:** Khi Kiosk cảnh báo lỗi (VD: Kỹ sư làm mất thẻ, khuôn mặt bị che khuất không nhận diện được, mã QR thiết bị bị mờ).
2. **Kiểm tra vật lý:** Bảo vệ kiểm tra giấy tờ tùy thân hoặc ngoại quan thiết bị trực tiếp của kỹ sư.
3. **Xử lý Override:** Truy cập tính năng Xác minh an ninh (`SecurityVerifyPage`). Tại đây, bảo vệ tra cứu thông tin kỹ sư/thiết bị trong CSDL.
4. **Ghi đè hệ thống:** Bảo vệ thực hiện lệnh xác nhận thủ công (Ghi đè/Override) để cho phép hoặc từ chối mở cửa. Hệ thống tự động ghi lại log thao tác này dưới tên tài khoản bảo vệ để thực hiện hậu kiểm (Audit) sau này.

---

### 6.2.3. Luồng của Admin (Manager / Admin Flow)
Tài khoản Admin (thường là Project Manager hoặc Trưởng phòng IT) có quyền lực cao nhất, chịu trách nhiệm cấp phép, quản trị hệ thống và trích xuất báo cáo.

**Luồng 1: Phê duyệt thiết bị (Approval Workflow)**
1. **Nhận thông báo:** Quản lý nhận được thông báo (thông qua `NotificationDropdown`) ngay khi có một kỹ sư gửi yêu cầu khai báo thiết bị mới.
2. **Đánh giá yêu cầu:** Truy cập trang Phê duyệt (`ApprovalPage`). Hệ thống liệt kê tất cả các thiết bị đang **"PENDING"**.
3. **Ra quyết định:** Quản lý xem xét chi tiết (loại thiết bị, lý do mang vào, dự án tham gia). Sau đó, thực hiện thao tác **Approve** (Đồng ý) hoặc **Reject** (Từ chối). Quản lý có thể nhập thêm lý do từ chối để kỹ sư nắm bắt.

**Luồng 2: Quản trị Hệ thống và Báo cáo (System Administration & Auditing)**
1. **Quản lý Nhân sự:** Truy cập trang `UserManagementPage` để thêm mới tài khoản kỹ sư/bảo vệ, vô hiệu hóa tài khoản của nhân viên đã nghỉ việc, hoặc reset mật khẩu. Thay đổi phân quyền (Role) cho người dùng.
2. **Truy vết An ninh (Audit Trails):** Truy cập trang `ActivityLogsPage` để xem toàn bộ lịch sử ra vào. Admin có thể lọc dữ liệu theo ngày, theo tên kỹ sư hoặc theo trạng thái thiết bị (ví dụ: Tìm xem thiết bị SN12345 đã được mang ra khỏi phòng lúc nào).
3. **Xuất báo cáo:** Chức năng kết xuất toàn bộ dữ liệu Logs ra file Excel/PDF phục vụ cho các buổi họp giao ban hoặc phục vụ công tác điều tra nếu có sự cố mất mát tài sản xảy ra trong phòng R&D.
