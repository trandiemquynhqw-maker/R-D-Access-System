# 📋 Quick Start Guide

## ⚡ 5-Minute Setup

### Prerequisites Check
```bash
node --version  # Should be v16+
npm --version   # Should be v8+
psql --version  # Should show PostgreSQL version
```

### Backend Setup (Terminal 1)
```bash
cd backend
cp .env.example .env
# Edit .env - update DB_PASSWORD to your postgres password
npm install
npm run migrate
npm run seed
npm run dev
# ✓ Server running on http://localhost:5000
```

### Frontend Setup (Terminal 2)
```bash
cd frontend
npm install
npm start
# ✓ App opens on http://localhost:3000
```

### Login & Test
```
URL: http://localhost:3000
Username: project_manager
Password: manager123
```

---

## 📂 Project Directory Structure

```
Web_Kientap/
├── README.md                    # Main documentation
├── SETUP_GUIDE.md              # Detailed setup instructions
├── ARCHITECTURE.md             # System architecture
├── QUICK_START.md              # This file
│
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── config/             # Database config
│   │   ├── controllers/        # Business logic
│   │   ├── middleware/         # Auth, validation
│   │   ├── models/             # Data models
│   │   ├── routes/             # API endpoints
│   │   └── index.js            # Server entry
│   ├── package.json
│   └── .env.example
│
└── frontend/                   # React app
    ├── src/
    │   ├── components/         # Reusable UI
    │   ├── pages/             # Page layouts
    │   ├── services/          # API calls
    │   ├── store/             # State (Zustand)
    │   └── App.jsx            # Root component
    ├── public/
    ├── package.json
    └── tailwind.config.js
```

---

## 🔐 Demo User Accounts

| Role | Username | Password | Access |
|------|----------|----------|--------|
| **Manager** | project_manager | manager123 | Device approvals |
| **Engineer** | engineer1 | engineer123 | Device registration |
| **Security** | admin | admin123 | Real-time dashboard |

---

## 🎯 Core Features

### Phase 1: Device Registration (Engineer Interface)
- Register personal devices with details
- Upload device information (type, brand, serial)
- Monitor approval status
- Edit/delete pending devices

### Phase 2: Access Control (Tablet at Entry)
- QR code scan for employee verification
- Select approved devices before entry
- Automatic check-in/check-out logging
- Timestamp recording

### Manager Approval
- View pending device requests
- Approve or reject with feedback
- Add comments for requesters
- Instant notifications

### Security Dashboard
- Real-time occupancy monitoring
- Recent activity log
- Personnel access history
- Auto-refresh every 10 seconds

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register      Register new user
POST   /api/auth/login         Login & get token
GET    /api/auth/profile       Get user profile
PUT    /api/auth/profile       Update profile
```

### Device Management
```
POST   /api/devices            Create device
GET    /api/devices/my-devices Get my devices
GET    /api/devices/approved   Get approved devices
```

### Manager Approval
```
GET    /api/devices/requests/pending         Pending approvals
POST   /api/devices/requests/:id/approve     Approve device
POST   /api/devices/requests/:id/reject      Reject device
```

### Access Control
```
POST   /api/access/check-in                  Entry logging
POST   /api/access/check-out                 Exit logging
GET    /api/access/status                    Current status
GET    /api/access/history                   Access history
```

### Dashboard
```
GET    /api/access/dashboard/activity        Recent activities
GET    /api/access/dashboard/occupancy       Current occupancy
```

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| **users** | User accounts & roles |
| **devices** | Device inventory |
| **device_requests** | Approval workflow |
| **access_logs** | Entry/exit records |
| **activity_logs** | System activity |

---

## 🛠️ Common Commands

### Backend
```bash
npm run dev        # Development mode
npm run migrate    # Create DB tables
npm run seed       # Add sample data
npm test           # Run tests
```

### Frontend
```bash
npm start          # Development server
npm run build      # Production build
npm test           # Run tests
```

### Database
```bash
psql -U postgres -d rnd_access_db    # Connect
\dt                                  # List tables
\q                                   # Quit
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Port 5000 (Backend)
lsof -i :5000
kill -9 <PID>

# Port 3000 (Frontend)
lsof -i :3000
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check PostgreSQL running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Verify credentials in .env
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### CORS Error
```
Check backend CORS config (./backend/src/index.js)
Verify FRONTEND_URL in .env
```

---

## 📊 User Journey Examples

### Engineer's Day
```
1. Login → 2. Register Device → 3. Wait for Approval 
   → 4. Check-in with Approved Devices → 5. Work in R&D 
   → 6. Check-out
```

### Manager's Task
```
1. Login → 2. Go to Approvals → 3. Review Pending
   → 4. Approve/Reject → 5. Add Comments
```

### Security Officer's Watch
```
1. Login → 2. View Dashboard → 3. Monitor Occupancy
   → 4. Track Activities (auto-updates every 10s)
```

---

## 🚀 Next Steps

### Immediate
- [ ] Complete SETUP_GUIDE.md steps
- [ ] Run `npm run migrate && npm run seed`
- [ ] Login with demo accounts
- [ ] Test device registration workflow

### Short-term (Week 1-2)
- [ ] Customize branding & colors
- [ ] Add company logo
- [ ] Configure email notifications
- [ ] Test on different devices

### Medium-term (Week 3-4)
- [ ] Implement QR code scanning
- [ ] Add real-time WebSocket updates
- [ ] Create deployment configuration
- [ ] Set up CI/CD pipeline

### Long-term (Month 2+)
- [ ] Advanced analytics & reports
- [ ] Multi-location support
- [ ] Mobile app (React Native)
- [ ] Third-party integrations

---

## 📚 Documentation Files

| File | Content |
|------|---------|
| **README.md** | Project overview & features |
| **SETUP_GUIDE.md** | Detailed setup instructions |
| **ARCHITECTURE.md** | System design & diagrams |
| **backend/README.md** | Backend documentation |
| **frontend/README.md** | Frontend documentation |

---

## 🔗 Useful Links

- [Express.js Docs](https://expressjs.com)
- [React Docs](https://react.dev)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)

---

## 📞 Getting Help

1. **Check Documentation**: Read SETUP_GUIDE.md first
2. **Search Error**: Copy error message → Google
3. **Check Logs**: Look in terminal output
4. **Restart Services**: Turn off & on again
5. **Reset DB**: Run `npm run migrate && npm run seed`
6. **Contact Team**: Reach out to development team

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Backend runs on localhost:5000
- [ ] Frontend runs on localhost:3000
- [ ] Login with demo account works
- [ ] Can navigate to different pages
- [ ] Database queries execute
- [ ] No errors in browser console
- [ ] No errors in terminal

If any fail, refer to SETUP_GUIDE.md troubleshooting section.

---

**Ready to code? Jump to SETUP_GUIDE.md for detailed instructions!**

**Version**: 1.0.0 | **Updated**: April 2026
