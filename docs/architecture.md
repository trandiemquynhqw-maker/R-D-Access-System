# 🏗️ System Architecture

## Overall System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet Browser                          │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌──────────────────────┐        ┌──────────────────────┐
│   React Frontend     │        │  Tablet Interface    │
│  (Phase 1 & Init)    │        │  (Phase 2 - Entry)   │
│                      │        │                      │
│ - Device Reg        │        │ - Check-in/out       │
│ - Dashboard         │        │ - QR Scanning        │
│ - Approvals         │        │ - Device Selection   │
└──────────┬───────────┘        └──────────┬───────────┘
           │                               │
           │                               │
           └───────────────┬───────────────┘
                           │
                    HTTP/REST API
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌─────────────────────────────┐  ┌──────────────────────────┐
│    Express.js Backend       │  │    Real-time Events      │
│     (API Server)            │  │    (Socket.io - Future)  │
│                             │  │                          │
│ /api/auth                   │  │ - Live occupancy updates │
│ /api/devices                │  │ - Check-in notifications │
│ /api/access                 │  │ - Activity streams       │
└──────────────┬──────────────┘  └──────────────────────────┘
               │
               ▼
        ┌─────────────────┐
        │  PostgreSQL     │
        │   Database      │
        │                 │
        │ - Users         │
        │ - Devices       │
        │ - Requests      │
        │ - Access Logs   │
        │ - Activity      │
        └─────────────────┘
```

## Component Architecture

### Frontend Layer
```
┌──────────────────────────────────────────────────────────┐
│                     React App                             │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           Route Components                          │ │
│  │ ┌────────────┐  ┌────────────┐  ┌──────────────┐   │ │
│  │ │ LoginPage  │  │DeviceRegPage│  │CheckInPage   │   │ │
│  │ └────────────┘  └────────────┘  └──────────────┘   │ │
│  │ ┌────────────┐  ┌──────────────────────────────┐   │ │
│  │ │ApprovalPage│  │ DashboardPage (Security)    │   │ │
│  │ └────────────┘  └──────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────┘ │
│                           ▲                               │
│  ┌────────────────────────┴────────────────────────────┐ │
│  │         Zustand State Management                    │ │
│  │ ┌──────────────┐           ┌──────────────┐        │ │
│  │ │ authStore    │           │deviceStore   │        │ │
│  │ │ - user       │           │ - devices    │        │ │
│  │ │ - token      │           │ - requests   │        │ │
│  │ └──────────────┘           └──────────────┘        │ │
│  └─────────────────────────────────────────────────────┘ │
│                           ▲                               │
│  ┌────────────────────────┴────────────────────────────┐ │
│  │         API Services Layer                          │ │
│  │ ┌──────────────┐  ┌──────────────┐                │ │
│  │ │authService   │  │deviceService │  accessService│ │
│  │ └──────────────┘  └──────────────┘                │ │
│  └─────────────────────────────────────────────────────┘ │
│                           │                               │
│  ┌────────────────────────▼────────────────────────────┐ │
│  │         Axios HTTP Client                           │ │
│  │  - Request/Response Interceptors                    │ │
│  │  - Token Management                                 │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Backend Layer
```
┌──────────────────────────────────────────────────────────┐
│              Express.js Server (Port 5000)                │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │        Route Handlers                              │  │
│  │ ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │  │
│  │ │authRoutes│  │deviceRoutes│ │accessRoutes     │  │  │
│  │ └──────────┘  └──────────┘  └──────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                           │                                │
│  ┌────────────────────────▼────────────────────────────┐  │
│  │        Middleware Layer                             │  │
│  │ ┌──────────────────────────────────────────────┐   │  │
│  │ │ - JWT Authentication Middleware             │   │  │
│  │ │ - Role-Based Access Control                 │   │  │
│  │ │ - Request Validation                        │   │  │
│  │ │ - CORS, Security (helmet)                   │   │  │
│  │ └──────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
│                           │                                │
│  ┌────────────────────────▼────────────────────────────┐  │
│  │      Controller Layer (Business Logic)              │  │
│  │ ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │  │
│  │ │authCtrl  │  │deviceCtrl │ │accessCtrl       │   │  │
│  │ └──────────┘  └──────────┘  └──────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
│                           │                                │
│  ┌────────────────────────▼────────────────────────────┐  │
│  │         Models (Data Layer)                         │  │
│  │ ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │  │
│  │ │User      │  │Device    │  │AccessLog        │   │  │
│  │ │DeviceReq │  │ActivityLog                     │   │  │
│  │ └──────────┘  └──────────┘  └──────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
│                           │                                │
│  ┌────────────────────────▼────────────────────────────┐  │
│  │      Database Connection Pool                       │  │
│  │    (PostgreSQL via pg client)                       │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Database Schema
```
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                  │
│                    (rnd_access_db)                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  users (人員)              devices (設備)                │
│  ┌──────────────────┐   ┌──────────────────┐           │
│  │ id (PK)          │───┤ id (PK)          │           │
│  │ username         │   │ owner_id (FK)    │           │
│  │ email            │   │ device_type      │           │
│  │ password_hash    │   │ brand            │           │
│  │ full_name        │   │ model            │           │
│  │ role (enum)      │   │ serial_number    │           │
│  │ status (active)  │   │ status (pending) │           │
│  │ created_at       │   │ created_at       │           │
│  └──────────────────┘   └──────────────────┘           │
│            │                       │                    │
│            └───────────┬───────────┘                    │
│                        │                               │
│  device_requests       │         access_logs           │
│  ┌──────────────────┐  │  ┌──────────────────┐        │
│  │ id (PK)          │  │  │ id (PK)          │        │
│  │ device_id (FK)   │◄─┤  │ user_id (FK)     │◄───┐   │
│  │ requester_id (FK)│  │  │ device_ids[]     │    │   │
│  │ approver_id (FK) │  │  │ check_in_time    │    │   │
│  │ status (pending) │  │  │ check_out_time   │    │   │
│  │ comments         │  │  │ status           │    │   │
│  │ created_at       │  │  │ created_at       │    │   │
│  └──────────────────┘  │  └──────────────────┘    │   │
│                        │                          │   │
│                        └──────────────────────────┘   │
│                                                         │
│  activity_logs (活動日誌)                              │
│  ┌──────────────────┐                                 │
│  │ id (PK)          │                                 │
│  │ user_id (FK)     │                                 │
│  │ activity_type    │                                 │
│  │ description      │                                 │
│  │ metadata (JSON)  │                                 │
│  │ created_at       │                                 │
│  └──────────────────┘                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Data Flow: Device Registration (Phase 1)

```
Engineer             Frontend              Backend               Database
   │                    │                    │                      │
   ├─ Click "Add"──────→ │                    │                      │
   │                    ├─ Show Form          │                      │
   │                    │                    │                      │
   ├─ Fill Device───────→ │                    │                      │
   │                    │                    │                      │
   ├─ Click Submit─────→ │                    │                      │
   │                    ├─ POST /api/devices─→ │                      │
   │                    │                    ├─ Save Device──────────→│
   │                    │                    │                    INSERT
   │                    │                    │←─ Device ID──────────┤
   │                    │                    ├─ Create Request──────→│
   │                    │                    │                    INSERT
   │                    │←─ Response─────────┤                      │
   │                    ├─ Show Success      │                      │
   │                    │                    │                      │
   │                    ├─ Fetch Devices────→│                      │
   │                    │                    ├─ Query Devices──────→│
   │                    │←─ Device List──────┤←─ SELECT results───┤
   │                    ├─ Display List      │                      │
   │                    │                    │                      │
   │ (Status: PENDING)  │                    │                      │
   │                    │                    │                      │
```

## Data Flow: Device Approval (Manager)

```
Manager              Frontend              Backend               Database
   │                    │                    │                      │
   ├─ Login────────────→ │                    │                      │
   │                    ├─ POST /login──────→ │                      │
   │                    │←─ Token────────────┤                      │
   │                    │                    │                      │
   ├─ Click Approvals──→ │                    │                      │
   │                    ├─ GET /requests/pending                     │
   │                    │                    ├─ Query pending───────→│
   │                    │←─ List────────────┤←─ Results──────────┤
   │                    ├─ Display requests  │                      │
   │                    │                    │                      │
   ├─ Add Comments─────→ │                    │                      │
   ├─ Click Approve────→ │                    │                      │
   │                    ├─ POST /approve────→ │                      │
   │                    │                    ├─ Update Request──────→│
   │                    │                    │                    UPDATE
   │                    │                    ├─ Update Device───────→│
   │                    │                    │                    UPDATE
   │                    │←─ Response─────────┤                      │
   │                    ├─ Remove from list  │                      │
   │                    │ (Status: APPROVED) │                      │
   │                    │                    │                      │
```

## Data Flow: Check-in/Out (Phase 2)

```
Engineer             Frontend              Backend               Database
   │                    │                    │                      │
   ├─ Navigate──────────→ │                    │                      │
   │  to Check-in       ├─ GET /approved────→ │                      │
   │                    │                    ├─ Query Approved──────→│
   │                    │←─ Devices─────────┤←─ Results──────────┤
   │                    ├─ Show Devices      │                      │
   │                    │                    │                      │
   ├─ Select Devices───→ │                    │                      │
   │ (Laptop, Phone)    │                    │                      │
   │                    │                    │                      │
   ├─ Click Check-in───→ │                    │                      │
   │                    ├─ POST /check-in───→ │                      │
   │                    │ {device_ids}       ├─ Create AccessLog───→│
   │                    │                    │                    INSERT
   │                    │                    │ (status=checked_in)   │
   │                    │←─ Success─────────┤                      │
   │                    ├─ Show Checked In   │                      │
   │ (Inside Room)      │                    │                      │
   │                    │                    │                      │
   ├─ (Later)──────────→ │                    │                      │
   │ Click Check-out    ├─ POST /check-out──→ │                      │
   │                    │                    ├─ Find Active Log─────→│
   │                    │                    │←─ AccessLog record──┤
   │                    │                    ├─ Update AccessLog───→│
   │                    │                    │ (status=checked_out)  │
   │                    │                    │ (check_out_time)      │
   │                    │←─ Response─────────┤                      │
   │                    ├─ Show Checked Out  │                      │
   │ (Left Room)        │                    │                      │
   │                    │                    │                      │
```

## Data Flow: Real-time Dashboard (Security)

```
Security              Frontend              Backend              Database
   │                    │                    │                      │
   ├─ Open Dashboard───→ │                    │                      │
   │                    ├─ GET /occupancy────→ │                      │
   │                    │                    ├─ Query Checked-in────→│
   │                    │←─ Count────────────┤←─ Results──────────┤
   │                    ├─ Display: 1 person │                      │
   │                    │                    │                      │
   │                    ├─ GET /activity────→ │                      │
   │                    │                    ├─ Query Access Logs──→│
   │                    │←─ Activity log────┤←─ Results──────────┤
   │                    ├─ Display Timeline  │                      │
   │                    │                    │                      │
   │ (Auto-refresh      │                    │                      │
   │  every 10s)        │                    │                      │
   │                    ├─ GET /occupancy (repeat)                  │
   │                    │                    ├─ Query again─────────→│
   │                    │←─ Updated Count───┤←─ Results──────────┤
   │ (Engineer checks   ├─ Update Display    │                      │
   │  out)              │ → Now: 0 people    │                      │
   │                    │                    │                      │
```

## Security Architecture

```
┌────────────────────────────────────┐
│         HTTPS/TLS Encryption       │
└────────────────────────────────────┘
                  ▼
┌────────────────────────────────────┐
│    Request Authentication          │
│  - JWT Token Validation            │
│  - Token in Authorization Header   │
└────────────────────────────────────┘
                  ▼
┌────────────────────────────────────┐
│  Role-Based Access Control (RBAC)  │
│  - engineer    → Limited access    │
│  - manager     → Approval access   │
│  - security    → Dashboard access  │
└────────────────────────────────────┘
                  ▼
┌────────────────────────────────────┐
│    Input Validation & Sanitization │
│  - express-validator               │
│  - Parameter checking              │
└────────────────────────────────────┘
                  ▼
┌────────────────────────────────────┐
│     Data Encryption at Rest        │
│  - Password hashing (bcryptjs)     │
│  - JWT secrets                     │
└────────────────────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling
```
┌──────────────┐  ┌──────────────┐
│  Frontend 1  │  │  Frontend 2  │
└──────────────┘  └──────────────┘
       │                │
       └────────┬───────┘
                │
          ┌─────────────┐
          │ Load Bal    │
          └─────────────┘
                │
       ┌────────┼────────┐
       │        │        │
┌──────▼──┐ ┌──▼──────┐ ┌──▼──────┐
│Backend 1│ │Backend 2│ │Backend 3│
└────┬────┘ └─────────┘ └────┬────┘
     │                       │
     └───────────┬───────────┘
                 │
         ┌───────────────┐
         │ PostgreSQL    │
         │ (Primary/Rep) │
         └───────────────┘
```

### Caching Strategy
```
Frontend Cache → Zustand Store
                      ↓
                  API Request
                      ↓
                 Backend Cache (Redis)
                      ↓
                  Database Query
```

---

**Document Version**: 1.0.0
**Last Updated**: April 2026
