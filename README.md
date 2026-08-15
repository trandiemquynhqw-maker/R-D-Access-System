# R&D Access Management System

Full-stack access control system for managing people, devices, check-in/check-out sessions, and security monitoring in an R&D room environment.

This project was developed as an internship-oriented academic project for improving the equipment access control workflow at HCLTech Vietnam. It replaces manual device verification with a web-based process covering employee authentication, registered device validation, kiosk scanning, approval handling, and real-time monitoring for security staff.

## My Role

Full-stack Developer / System Analyst

- Analyzed the current R&D access control workflow and translated business rules into user flows, role permissions, database entities, and API behavior.
- Designed and implemented the React frontend for engineer, security, manager, admin, and auditor workflows.
- Built the Node.js/Express backend with authentication, RBAC middleware, PostgreSQL data models, and REST APIs.
- Implemented real-time security events with Socket.IO for kiosk scan updates and quick device registration alerts.
- Developed QR-based device/user flows, device approval management, access logs, session tracking, audit views, and multilingual UI support.
- Prepared technical documentation, setup guides, architecture notes, and business process materials for project evaluation.

## Business Problem

R&D areas require stricter control over which employees and devices can enter the room. Manual checks are slow, hard to audit, and can miss unregistered equipment. This system supports a more traceable process:

- Employees register devices before entering the R&D room.
- Security staff verify user identity and device QR codes at a kiosk.
- Unregistered devices trigger a quick registration and approval flow.
- Managers/security users review pending device requests.
- Auditors can review access sessions and activity logs.

## Key Features

- Role-based login for engineer, security, manager, admin, and auditor users.
- QR login and QR device verification flows.
- Kiosk check-in/check-out screen for R&D room entry control.
- Device registration, approval, rejection, and QR tag generation.
- Real-time security dashboard using Socket.IO.
- Access session tracking, occupancy status, and personal activity history.
- Admin/auditor pages for users, sessions, activity logs, and audit logs.
- Camera capture support for quick registration evidence.
- Multilingual interface with English and Vietnamese resources.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, React Router, Tailwind CSS, Zustand, Axios |
| UI & Data | Recharts, Lucide React, react-icons, xlsx, jsPDF |
| QR / Camera | html5-qrcode, qrcode.react, camera capture flow |
| Backend | Node.js, Express.js, REST API |
| Database | PostgreSQL, `pg` |
| Auth & Security | JWT, bcryptjs, Helmet, CORS, role-based middleware |
| Real-time | Socket.IO, Socket.IO Client |
| i18n | i18next, react-i18next |

## Main User Flows

```text
Engineer
  Login -> Register device -> Generate QR tag -> View personal access history

Security
  Kiosk scan -> Verify employee/device -> Approve quick registration -> Monitor live activity

Manager/Admin
  Review device requests -> Manage users -> Track occupancy/sessions -> Force-close sessions

Auditor
  View audit dashboard -> Review access logs and session records
```

## Project Structure

```text
R-D-Access-System/
├── backend/          # Express API, PostgreSQL models, routes, controllers
├── frontend/         # React UI, pages, stores, services, i18n resources
├── docs/             # Architecture, setup, workflow and project documentation
├── start-system.bat  # Local startup helper for Windows
└── README.md
```

## Run Locally

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run migrate
npm run seed
npm run dev
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- Backend health check: `http://localhost:5000/health`

## Demo Accounts

| Role | Username | Password |
| --- | --- | --- |
| Engineer | `engineer1` | `engineer123` |
| Security | `admin` | `admin123` |
| Manager | `project_manager` | `manager123` |

## Documentation

Project documents are organized in [`docs/`](docs/README.md), including architecture, setup guide, user flows, interaction design, multilingual implementation, and project completion notes.

## Notes

- Runtime secrets are not committed. Use `.env.example` files as templates.
- The committed Supabase values were replaced with placeholders; configure a personal Supabase project if you want to use Supabase-related frontend services.
- Camera access requires browser permission and works best on `localhost` or HTTPS.
