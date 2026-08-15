# Kế hoạch chuyển đổi sang Supabase & Hướng dẫn sử dụng

Tài liệu này hướng dẫn bạn cách đăng ký Supabase, tạo project và cấu hình hệ thống sử dụng Database mới.

## 📌 Hướng dẫn Đăng ký & Tạo Project Supabase

Bạn thực hiện theo các bước sau để khởi tạo môi trường:

### Bước 1: Đăng ký tài khoản
1. Truy cập vào trang chủ [supabase.com](https://supabase.com).
2. Nhấn nút **Start your project** hoặc **Sign Up**.
3. Bạn nên chọn **Continue with GitHub** để đăng nhập nhanh nhất (hoặc dùng Email).

### Bước 2: Tạo Project mới
1. Tại màn hình Dashboard, nhấn nút **New Project**.
2. Điền các thông tin sau:
   - **Organization:** Chọn mặc định (tên của bạn).
   - **Name:** Đặt tên dự án (ví dụ: `RD-Access-Control`).
   - **Database Password:** Nhập mật khẩu cho Database (👉 *Hãy lưu lại mật khẩu này cẩn thận*).
   - **Region:** Chọn **Southeast Asia (Singapore)** để có tốc độ truy cập nhanh nhất về Việt Nam.
   - **Pricing Plan:** Chọn gói **Free** (Miễn phí).
3. Nhấn **Create new project** và đợi khoảng 2-3 phút để hệ thống khởi tạo.

### Bước 3: Lấy thông tin cấu hình
Sau khi project tạo xong, bạn vào mục **Project Settings** (biểu tượng bánh răng ở góc dưới bên trái) để lấy thông tin:

1. **Tại mục API:**
   - Copy **Project URL**
   - Copy **anon / public key**
2. **Tại mục Database:**
   - Cuộn xuống phần **Connection string**, chọn tab **URI** và copy chuỗi kết nối.
   - Thay thế `[YOUR-PASSWORD]` bằng mật khẩu bạn đã tạo ở Bước 2.

---

## 🛠️ Các giai đoạn triển khai code

### Giai đoạn 1: Chuyển đổi Database (Giữ nguyên API & Socket.io)

1. **Khởi tạo bảng:** Copy đoạn code SQL ở cuối tài liệu, dán vào mục **SQL Editor** trên Supabase và nhấn **Run**.
2. **Cấu hình Backend:** Cập nhật file [backend/.env](file:///d:/Documents/Năm3/Kì 3/R&D_Access/backend/.env) với thông tin Database mới.

### Giai đoạn 2: Tích hợp Supabase Realtime (Thay thế Socket.io)
1. Bật Realtime trong **Database -> Replication** trên Supabase.
2. Cập nhật code lắng nghe dữ liệu ở Frontend.

---

## 📄 SQL Schema (Dành cho Giai đoạn 1)

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'engineer',
  department VARCHAR(100),
  employee_id VARCHAR(50) UNIQUE,
  qr_code_id VARCHAR(100) UNIQUE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  device_type VARCHAR(100),
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100) UNIQUE NOT NULL,
  mac_address VARCHAR(50),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  approval_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS access_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  device_ids INTEGER[],
  check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  check_out_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'checked_in',
  entry_photo TEXT,
  location VARCHAR(100) DEFAULT 'RND Room',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
