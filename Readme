# 🎓 SmartTimetable Alert System

> Intelligent university scheduling platform with real-time push notifications, automated substitution management, and IKS credit tracking — built as a Progressive Web App.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Reference](#api-reference)
- [User Roles](#user-roles)
- [Push Notifications](#push-notifications)
- [PWA Installation](#pwa-installation)
- [Screenshots](#screenshots)

---

## Overview

SmartTimetable is a full-stack MVC web application that automates university timetable management. The system sends push notifications 5 minutes before every lecture, automatically assigns substitute teachers when a teacher marks themselves unavailable, and tracks IKS event credits for students — all without requiring constant admin intervention.

---

## Features

### 🔔 Real-Time Notifications
- Push notification to students and teachers **5 minutes before every lecture**
- Instant alert when a substitute teacher is assigned
- Event conflict alerts when a lecture is replaced by an event
- Works on phone home screen via **Web Push (VAPID)**

### 🔁 Auto-Substitution Engine
- Teacher marks unavailability → system finds a **free teacher automatically**
- Checks all other teachers for conflicts before assigning
- Notifies substitute teacher, all affected students, and admin
- Admin can override any auto-assignment

### 📅 Timetable Management
- Admin creates timetable slots (section, subject, teacher, time, room)
- Upload timetable as **image or PDF** per section — visible to all students
- Students see both slot-based table and uploaded image

### 🎓 Role-Based Access
| Role | Access |
|------|--------|
| Student | View timetable, events, IKS credits, notifications |
| Teacher | Mark lectures, manage unavailability, view substitutions |
| Admin | Full system control — users, timetable, events, substitutions |

### 📊 IKS Credit Tracking
- Admin marks event attendance via **Excel upload**
- Credits automatically assigned to attended students
- Progress bar showing earned vs required credits

### 📱 Progressive Web App
- Install on Android, iPhone, Windows, Mac
- Works offline (cached pages)
- Background push notifications without App Store

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js v18+ |
| Framework | Express.js v4 |
| Database | MySQL 8.0 |
| Authentication | JWT (access + refresh tokens) |
| Password Hashing | bcrypt |
| Push Notifications | web-push (VAPID) |
| Cron Jobs | node-cron |
| File Uploads | multer |
| Excel Parsing | xlsx |
| Email (OTP) | nodemailer |
| Frontend | Vanilla HTML / CSS / JavaScript |
| Architecture | MVC (Model-View-Controller) |

---

## Project Structure

```
MVC_BACKENED/
│
├── server.js                  # Entry point — starts Express + cron
├── .env                       # Environment variables
├── package.json
│
├── uploads/
│   ├── timetables/            # Uploaded timetable images/PDFs
│   └── excel/                 # Temp Excel uploads
│
├── src/
│   ├── config/
│   │   ├── db.js              # MySQL connection pool
│   │   └── upload.js          # Multer config (timetable + Excel)
│   │
│   ├── models/
│   │   ├── UserModel.js
│   │   ├── StudentModel.js
│   │   ├── AdminModel.js
│   │   ├── TimetableModel.js
│   │   ├── TimetableSlotModel.js
│   │   ├── TimetableUploadModel.js
│   │   ├── LectureAttendanceModel.js
│   │   ├── SubstitutionModel.js
│   │   ├── UnavailabilityModel.js
│   │   ├── EventModel.js
│   │   ├── CreditModel.js
│   │   ├── ManageModel.js
│   │   └── PushModel.js
│   │
│   ├── controllers/
│   │   ├── AuthController.js
│   │   ├── StudentController.js
│   │   ├── AdminController.js
│   │   ├── TimetableController.js
│   │   ├── TimetableSlotController.js
│   │   ├── TimetableUploadController.js
│   │   ├── LectureAttendanceController.js
│   │   ├── SubstitutionController.js
│   │   ├── UnavailabilityController.js
│   │   ├── EventController.js
│   │   ├── ExcelImportController.js
│   │   └── ManageController.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── student.routes.js
│   │   ├── admin.routes.js
│   │   ├── timetable.routes.js
│   │   ├── timetableSlot.routes.js
│   │   ├── lectureAttendance.routes.js
│   │   ├── substitution.routes.js
│   │   ├── unavailability.routes.js
│   │   ├── event.routes.js
│   │   ├── manage.routes.js
│   │   ├── upload.routes.js
│   │   └── push.routes.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js  # JWT verification
│   │   └── role.middleware.js  # Role-based access guard
│   │
│   ├── services/
│   │   ├── AutoSubstitutionService.js  # Auto-assign substitute logic
│   │   └── PushService.js              # Web Push dispatch
│   │
│   ├── cron/
│   │   └── scheduler.js        # 5-minute lecture alert cron
│   │
│   └── app.js                  # Express app setup + route registration
│
└── frontened/
    ├── index.html              # Landing page
    ├── signin.html
    ├── signup.html
    ├── forgotpassword.html
    ├── otpverification.html
    ├── resetpassword.html
    ├── changepassword.html
    ├── style.css
    │
    ├── dashboard.html          # Student dashboard
    ├── mytimetable.html
    ├── events.html
    ├── iks.html
    ├── dashboard.css
    │
    ├── teacher-dashboard.html
    ├── teacher-timetable.html
    ├── teacher-mark-lecture.html
    ├── teacher-substitutions.html
    ├── teacher-events.html
    ├── teacher-dashboard.css
    │
    ├── admin-dashboard.html
    ├── admin-timetable.html
    ├── admin-substitutions.html
    ├── admin-attendance.html
    ├── admin-events.html
    ├── admin-users.html
    ├── admin-manage.html
    ├── admin-manage-students.html
    ├── admin-manage-teachers.html
    ├── admin.css
    │
    ├── manifest.json           # PWA manifest
    ├── sw.js                   # Service Worker
    ├── icon-72.png
    ├── icon-192.png
    └── icon-512.png
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MySQL 8.0+
- Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/MVC_BACKENED.git
cd MVC_BACKENED

# 2. Install dependencies
npm install

# 3. Create .env file (see Environment Variables section)
cp .env.example .env

# 4. Set up the database
# Open MySQL Workbench or terminal and run:
mysql -u root -p < database.sql

# 5. Generate VAPID keys for push notifications
node -e "const wp=require('web-push');const k=wp.generateVAPIDKeys();console.log('PUBLIC:',k.publicKey);console.log('PRIVATE:',k.privateKey);"
# Copy the output into your .env file

# 6. Start the server
node server.js
```

The server starts at `http://localhost:3000`

Open the frontend by right-clicking any HTML file in the `frontened/` folder and selecting **Open with Live Server** in VS Code.

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# ── Database ───────────────────────────────────────────────
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=TIMETABLE

# ── JWT ────────────────────────────────────────────────────
ACCESS_TOKEN_SECRET=your_access_secret_key_here
REFRESH_TOKEN_SECRET=your_refresh_secret_key_here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=7d

# ── Email (for OTP) ────────────────────────────────────────
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_gmail_app_password

# ── Web Push (VAPID) ───────────────────────────────────────
VAPID_PUBLIC_KEY=your_generated_public_key
VAPID_PRIVATE_KEY=your_generated_private_key
VAPID_EMAIL=mailto:your@gmail.com

# ── Server ─────────────────────────────────────────────────
NODE_ENV=development
PORT=3000
```

> **Note:** For `EMAIL_PASS`, use a Gmail App Password (not your regular password).
> Go to Google Account → Security → 2-Step Verification → App Passwords.

---

## Database Setup

Run the complete SQL script to create all 18 tables:

```bash
mysql -u root -p TIMETABLE < database.sql
```

### Tables Created

| Table | Purpose |
|-------|---------|
| `users` | Base table for all roles |
| `students` | Student profile (extends users) |
| `teachers` | Teacher profile (extends users) |
| `admins` | Admin profile (extends users) |
| `schools` | University top-level structure |
| `courses` | Under schools |
| `branches` | Under courses (CSE, ECE, etc.) |
| `semesters` | Under branches (Sem 1–8) |
| `sections` | Under semesters (CS-A, CS-B) |
| `subjects` | Subject master per branch + semester |
| `timetable_slots` | Weekly recurring schedule |
| `lecture_attendance` | Daily lecture status tracking |
| `substitutions` | Substitute teacher assignments |
| `teacher_unavailability` | Teacher unavailability — triggers auto-sub |
| `iks_events` | University/branch/section events |
| `event_attendance` | Student event attendance + credits |
| `section_timetables` | Uploaded timetable image/PDF per section |
| `push_subscriptions` | Web Push VAPID keys per user |
| `notifications` | Persistent notification log |
| `event_conflicts` | Event vs lecture clash records |

---

## API Reference

### Auth
```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login — returns access token
POST   /api/auth/refresh           Refresh access token (uses cookie)
POST   /api/auth/logout            Logout — clears refresh token
POST   /api/auth/forgot            Send OTP to email
POST   /api/auth/verify-otp        Verify OTP
POST   /api/auth/reset             Reset password
POST   /api/auth/change-password   Change password (authenticated)
```

### Student
```
GET    /api/student/profile
GET    /api/student/timetable/today
GET    /api/student/timetable/weekly
POST   /api/student/report-absence
GET    /api/student/events
POST   /api/student/events/attend
GET    /api/student/credits
GET    /api/student/notifications
PUT    /api/student/notifications/:id
GET    /api/student/substitutions
```

### Teacher
```
GET    /api/timetable/teacher/today
GET    /api/timetable/teacher/weekly
POST   /api/attendance/mark
GET    /api/attendance/teacher/history
GET    /api/substitutions/teacher
GET    /api/events/teacher
POST   /api/unavailability/mark
GET    /api/unavailability/my
```

### Admin
```
GET    /api/admin/stats
GET    /api/admin/users
GET    /api/admin/users/role/:role
DELETE /api/admin/users/:userId
GET    /api/admin/teachers
GET    /api/admin/sections
GET    /api/admin/subjects
GET    /api/admin/branches
POST   /api/admin/students/create
POST   /api/admin/teachers/create
GET    /api/timetable/admin/all
POST   /api/timetable/admin/slot
DELETE /api/timetable/admin/slot/:id
GET    /api/attendance/admin/absent-today
GET    /api/attendance/admin/by-date
POST   /api/substitutions/assign
GET    /api/substitutions/all
POST   /api/events
PUT    /api/events/:id
DELETE /api/events/:id
GET    /api/unavailability/all
POST   /api/unavailability/override/:id
GET    /api/unavailability/free-teachers
```

### Manage Structure
```
GET/POST/DELETE   /api/manage/schools
GET/POST/DELETE   /api/manage/courses
GET/POST/DELETE   /api/manage/branches
GET/POST/DELETE   /api/manage/semesters
GET/POST/DELETE   /api/manage/sections
GET/POST/DELETE   /api/manage/subjects
```

### Upload
```
POST   /api/upload/timetable              Upload timetable image/PDF
GET    /api/upload/timetable/section/:id  Get timetable for a section
GET    /api/upload/timetable/all          All uploaded timetables
POST   /api/upload/students/excel         Bulk import students
POST   /api/upload/events/attendance/excel  Mark event attendance via Excel
```

### Push Notifications
```
GET    /api/push/vapid-key      Get VAPID public key
POST   /api/push/subscribe      Save push subscription
DELETE /api/push/unsubscribe    Remove push subscription
POST   /api/push/test           Send test notification
```

---

## User Roles

### Setting Up for the First Time

Follow this exact order:

```
1. Register Admin account via signup.html
2. Login as Admin → go to Manage Structure
3. Create: School → Course → Branch → Semester → Section → Subject
4. Go to Manage Teachers → register teachers
5. Go to Manage Students → select section → register students
6. Go to Timetable Manager → add slots OR upload timetable image
7. Teachers and Students can now log in
```

### Student Default Flow
```
Login → Allow notifications → Dashboard shows today's lectures
Get push alert 5 min before class → Mark absent if teacher missing
View timetable → Check IKS credits → View events
```

### Teacher Default Flow
```
Login → View today's lectures → Mark each as Conducted/Cancelled
Going to meeting? → Click "Mark Unavailable" → System auto-handles
View substitution history → View events
```

---

## Push Notifications

### How It Works

```
Every minute — cron job runs
    ↓
Finds lectures starting in exactly 5 minutes
    ↓
Sends Web Push to all students in that section
    ↓
Sends Web Push to the assigned teacher
    ↓
Notification appears on phone/desktop home screen
```

### Enabling Push (Users)

1. Open the app on your phone or browser
2. Login to your account
3. Click **Allow** when the browser asks for notification permission
4. Done — notifications are now active

### Push is triggered for:
- Lecture starting in 5 minutes
- Substitute teacher assigned
- Lecture cancelled
- Event replacing a class
- Auto-substitution completed (admin only)

---

## PWA Installation

### Android (Chrome)
1. Open `https://your-domain.com` in Chrome
2. Tap the **three-dot menu** → **Add to Home Screen**
3. Tap **Add** — icon appears on home screen

### iPhone (Safari)
1. Open the site in **Safari**
2. Tap the **Share button** (box with arrow)
3. Scroll down → **Add to Home Screen**
4. Tap **Add**

> Push notifications on iPhone require iOS 16.4+ and the site must be opened in Safari first.

### Desktop (Chrome/Edge)
1. Open the site in Chrome or Edge
2. Click the **install icon** in the address bar
3. Click **Install**

---

## Excel Templates

### Student Bulk Import
Your Excel file must have these columns:

| Name | Email | Password | Enrollment | Department |
|------|-------|----------|------------|------------|

If Password is empty, default password `Welcome@123` is used.

### Event Attendance Marking
Your Excel file must have at least one of:

| Enrollment | Email |
|------------|-------|

---

## Scripts

```bash
# Start server
node server.js

# Start with auto-restart (install nodemon first)
npm install -g nodemon
nodemon server.js

# Generate VAPID keys
node -e "const wp=require('web-push');const k=wp.generateVAPIDKeys();console.log(k);"

# Test database connection
node -e "import('./src/config/db.js').then(m=>m.default.query('SELECT 1').then(()=>console.log('DB connected')).catch(console.error))"
```

---

## Security

- Passwords hashed with **bcrypt** (12 salt rounds)
- JWT access tokens expire in **1 day** (configurable)
- Refresh tokens stored as **httpOnly cookies** — inaccessible to JavaScript
- All protected routes verified by **JWT middleware**
- Role-based access enforced on every sensitive route
- OTP codes expire in **10 minutes**
- File uploads restricted to allowed MIME types only

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

This project is built for educational purposes as part of a university project.

---

## Contact

Built with ❤️ for Smart University Management

> For issues or questions, open a GitHub issue or contact the project maintainer.
