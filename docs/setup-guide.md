# 🚀 Hướng dẫn Cài đặt Chi Tiết

## Bước 1: Chuẩn bị Hệ thống

### Cài đặt PostgreSQL

**Windows:**
1. Download từ https://www.postgresql.org/download/windows/
2. Chạy installer
3. Set password cho user `postgres` (nhớ lại password này!) #quynh1412
4. Accept default port 5432

**Mac:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Xác minh PostgreSQL
```bash
psql --version
psql -U postgres -c "SELECT VERSION();"
```

### Cài đặt Node.js
- Download từ https://nodejs.org (LTS version 18+)
- Verify installation:
```bash
node --version
npm --version
```

## Bước 2: Cài đặt Backend

```bash
# Navigate to backend directory
cd backend

# Copy environment file
cp .env.example .env

# Edit .env file with your database credentials
# Windows: notepad .env
# Mac/Linux: nano .env

# Install dependencies
npm install

# Create database and tables
npm run migrate

# Insert sample data
npm run seed

# Start development server
npm run dev
```

**Output mong đợi:**
```
✓ Database tables created successfully
✓ Server running on http://localhost:5000
```

### Troubleshooting Backend

**Error: "can't connect to PostgreSQL"**
- Kiểm tra PostgreSQL service running: `pg_isrunning` hoặc `sudo systemctl status postgresql`
- Kiểm tra credentials trong .env file
- Default port là 5432, nếu khác hãy update

**Error: "port 5000 already in use"**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

## Bước 3: Cài đặt Frontend

**Terminal mới - KHÔNG tắt terminal backend**

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

**Output mong đợi:**
```
Compiled successfully!

You can now view rnd-room-access-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

### Troubleshooting Frontend

**Error: "Cannot find module"**
```bash
npm install
```

**Error: "port 3000 already in use"**
```bash
# Mac/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Bước 4: Xác minh Hệ thống

### Backend Health Check
```bash
curl http://localhost:5000/health
# Response: {"status":"OK","timestamp":"..."}
```

### Login Test
1. Mở browser: http://localhost:3000
2. Login với: `project_manager` / `manager123`
3. Phải redirect đến dashboard

## 📋 Demo Accounts

| Role | Username | Password | Tên đầy đủ | Mô tả |
|------|----------|----------|-----------|-------|
| Security Staff | admin | admin123 | Admin User | Xem dashboard giám sát |
| Manager | project_manager | manager123 | Project Manager | Phê duyệt thiết bị |
| Engineer | engineer1 | engineer123 | Engineer One | Khai báo thiết bị |
| Engineer | engineer2 | engineer123 | Engineer Two | Khai báo thiết bị |

## 🔄 Quy trình Workflow Demo

### 1. Engineer: Khai báo Thiết bị
1. Login as `engineer1`
2. Click "Device Registration" (hoặc navigate `/devices`)
3. Click "+ Add New Device"
4. Điền form:
   - Device Type: Laptop
   - Brand: Apple
   - Model: MacBook Pro 14
   - Serial Number: SN12345DEMO
5. Click "Register Device"
6. Device sẽ ở trạng thái "PENDING"

### 2. Manager: Phê duyệt Thiết bị
1. Logout engineer1
2. Login as `project_manager`
3. Click "Approvals" (hoặc navigate `/approvals`)
4. Xem pending request của engineer1
5. Click "Approve"
6. (Optional) Add comments
7. Click "Confirm Approve"
8. Device status thay đổi thành "APPROVED"

### 3. Engineer: Check-in
1. Logout manager
2. Login as `engineer1`
3. Click "Check-in" (hoặc navigate `/check-in`)
4. Select approved device (MacBook Pro)
5. Click "Check In"
6. Status changes to "CHECKED IN"

### 4. Security: Xem Dashboard
1. Logout engineer1
2. Login as `admin`
3. Dashboard sẽ show:
   - Currently in room: 1
   - Recent activity
   - Live updates

### 5. Engineer: Check-out
1. Logout admin
2. Login as `engineer1`
3. Click "Check-in"
4. Button sẽ show "Check Out"
5. Click "Check Out"
6. Status changes to "CHECKED OUT"

## 🔍 Database Verification

```bash
# Connect to database
psql -U postgres -d rnd_access_db

# View users
SELECT id, username, role, status FROM users;

# View devices
SELECT id, owner_id, device_type, brand, status FROM devices;

# View access logs
SELECT id, user_id, status, check_in_time FROM access_logs;

# Exit
\q
```

## 📊 Database Reset

Nếu cần reset tất cả dữ liệu:

```bash
# Stop both servers (Ctrl+C)

# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS rnd_access_db;"
psql -U postgres -c "CREATE DATABASE rnd_access_db;"

# Re-run migration and seed
cd backend
npm run migrate
npm run seed

# Restart server
npm run dev
```

## 🛠️ Development Tools

### Recommended VSCode Extensions
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- Thunder Client / REST Client
- PostgreSQL
- Tailwind CSS IntelliSense

### API Testing
- Thunder Client (VSCode)
- Postman (Desktop)
- Insomnia
- curl (command line)

### Database GUI
- pgAdmin (Web)
- DBeaver Community Edition
- DataGrip (JetBrains)

## 📚 Learning Resources

### Backend
- Express.js: https://expressjs.com
- PostgreSQL: https://www.postgresql.org/docs
- JWT: https://jwt.io
- RESTful API Design: https://restfulapi.net

### Frontend
- React: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- Zustand: https://github.com/pmndrs/zustand
- React Router: https://reactrouter.com

## 🚀 Next Steps

1. **Customize UI**: Modify colors, fonts trong [tailwind.config.js](./frontend/tailwind.config.js)
2. **Add Features**: QR code scanning, email notifications
3. **Deploy**: Heroku, Vercel, AWS, Docker
4. **Integrate**: LDAP/AD authentication, existing databases

## 📞 Troubleshooting Checklist

- [ ] PostgreSQL service running?
- [ ] Node.js installed correctly?
- [ ] Environment variables set?
- [ ] Ports 5000 & 3000 available?
- [ ] Backend running on localhost:5000?
- [ ] Frontend running on localhost:3000?
- [ ] Can login with demo accounts?
- [ ] Database tables created?

## 🎯 Project Timeline

- **Week 1-2**: Setup, Database Design
- **Week 2-3**: Backend API Development
- **Week 3-4**: Frontend Implementation
- **Week 4-5**: Integration & Testing
- **Week 5-6**: Polish & Deployment

---

**Cần hỗ trợ?** Liên hệ development team hoặc check project README.md
