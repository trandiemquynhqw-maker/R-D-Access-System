# Hướng dẫn Kỹ thuật và Công nghệ Dự án R&D Room Access

Tài liệu này cung cấp cái nhìn tổng quan về các công nghệ, kiến trúc và cơ sở dữ liệu được sử dụng trong hệ thống Quản lý Truy cập Phòng R&D.

---

## 1. Tổng quan Công nghệ (Tech Stack)

Hệ thống được xây dựng theo mô hình **MERN-like** (nhưng sử dụng PostgreSQL thay vì MongoDB) để đảm bảo tính toàn vẹn dữ liệu và khả năng truy vấn quan hệ mạnh mẽ.

### **Frontend (Giao diện người dùng)**
- **Framework:** [React.js](https://reactjs.org/) (Khởi tạo bằng Vite/Create React App)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) - Giúp thiết kế giao diện hiện đại, responsive nhanh chóng.
- **Quản lý trạng thái (State Management):** [Zustand](https://github.com/pmndrs/zustand) - Một thư viện nhẹ, hiệu quả hơn Redux cho việc quản lý global state.
- **Routing:** [React Router DOM v6](https://reactrouter.com/) - Điều hướng giữa các trang Dashboard, Quản lý thiết bị, v.v.
- **Biểu đồ:** [Recharts](https://recharts.org/) - Hiển thị thống kê truy cập và thiết bị.
- **Xử lý QR Code:** `html5-qrcode` (Quét QR) và `qrcode.react` (Tạo QR).
- **Icons:** [Lucide React](https://lucide.dev/) và `react-icons`.
- **HTTP Client:** [Axios](https://axios-http.com/) - Gửi yêu cầu đến Backend API.
- **Real-time:** `socket.io-client` - Nhận thông báo tức thời từ server.

### **Backend (Máy chủ xử lý)**
- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/) - Xây dựng RESTful API.
- **Cơ sở dữ liệu:** [PostgreSQL](https://www.postgresql.org/) - Hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ.
- **Xác thực & Bảo mật:**
  - `jsonwebtoken` (JWT): Quản lý phiên đăng nhập qua Token.
  - `bcryptjs`: Mã hóa mật khẩu người dùng.
  - `helmet`: Tăng cường bảo mật HTTP headers.
  - `cors`: Cấu hình chia sẻ tài nguyên giữa các domain.
- **Real-time:** `socket.io` - Đẩy dữ liệu giám sát và thông báo đến Admin/Security ngay lập tức.
- **Tiện ích:** `express-validator` (Kiểm tra dữ liệu đầu vào), `dotenv` (Quản lý biến môi trường).

---

## 2. Kiến trúc Kết nối (System Architecture)

Hệ thống hoạt động dựa trên sự phối hợp giữa 3 thành phần chính:

1.  **Client (Frontend):** 
    - Gửi yêu cầu HTTP (GET, POST, PUT, DELETE) kèm theo **JWT Token** trong Header để xác thực.
    - Duy trì kết nối **WebSocket** để nhận cập nhật trạng thái thiết bị và log truy cập mà không cần tải lại trang.
2.  **Server (Backend):**
    - Tiếp nhận yêu cầu từ Client qua các Routes (`/api/users`, `/api/devices`, `/api/access`, ...).
    - Sử dụng **Middlewares** để kiểm tra quyền hạn (Role-based Access Control: Admin, Security, Engineer).
    - Xử lý logic nghiệp vụ và tương tác với Database thông qua thư viện `pg`.
3.  **Database (PostgreSQL):**
    - Lưu trữ dữ liệu có cấu trúc, đảm bảo các ràng buộc (Foreign Keys) giữa Người dùng, Thiết bị và Lịch sử ra vào.

---

## 3. Cấu trúc Cơ sở dữ liệu (Database Schema)

Cơ sở dữ liệu bao gồm các bảng chính sau:

| Bảng | Chức năng | Các trường quan trọng |
| :--- | :--- | :--- |
| `users` | Lưu thông tin người dùng | `id`, `username`, `email`, `role`, `employee_id`, `qr_code_id` |
| `devices` | Danh sách thiết bị của Engineer | `id`, `owner_id`, `serial_number`, `status` (pending/approved) |
| `access_logs` | Nhật ký ra vào phòng R&D | `id`, `user_id`, `check_in_time`, `check_out_time`, `status` |
| `notifications` | Thông báo hệ thống | `id`, `user_id`, `title`, `message`, `read` |
| `activity_logs` | Theo dõi hoạt động Admin | `id`, `user_id`, `activity_type`, `description` |

---

## 4. Các luồng xử lý chính

### **Xác thực người dùng (Authentication)**
- Người dùng đăng nhập -> Server kiểm tra mật khẩu (bcrypt) -> Trả về **JWT Token**.
- Client lưu Token vào `localStorage` và gửi kèm trong mỗi request sau đó.

### **Quản lý thiết bị (Device Management)**
- Engineer đăng ký thiết bị -> Trạng thái mặc định là `pending`.
- Admin/Manager nhận thông báo qua Socket.io -> Phê duyệt -> Trạng thái đổi thành `approved`.

### **Kiểm soát ra vào (Access Control via QR)**
- Mỗi Engineer có một mã QR duy nhất dựa trên `qr_code_id`.
- Security quét mã QR -> Client gửi yêu cầu Check-in/Check-out lên Server.
- Server ghi lại log và đẩy dữ liệu lên **Real-time Dashboard** của Security để giám sát.

### **Thông báo Real-time**
- Khi có một thiết bị mới cần duyệt hoặc một người vừa check-in, Server sẽ gửi sự kiện qua Socket.io đến đúng đối tượng (Admin hoặc Security).

---

## 5. Hướng dẫn mở rộng dự án

1.  **Thêm tính năng mới:**
    - Tạo bảng mới trong `backend/src/database/schema.js`.
    - Tạo Controller và Route tương ứng trong backend.
    - Cập nhật API service ở frontend (`frontend/src/services`).
2.  **Thay đổi giao diện:**
    - Sử dụng các Utility Classes của Tailwind CSS trực tiếp trong các component JSX.
3.  **Quản lý trạng thái:**
    - Nếu cần thêm dữ liệu global, hãy chỉnh sửa Store trong `frontend/src/store`.

---
*Tài liệu này được tạo tự động bởi Antigravity AI để hỗ trợ quá trình bàn giao dự án.*
