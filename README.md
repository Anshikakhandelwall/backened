# 🎓 SmartTimetable Alert System

> Intelligent university scheduling platform with real-time push notifications, automated substitution management, OCR-based timetable parsing, and IKS credit tracking — built as a Progressive Web App.

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
- [User Roles & Flow](#user-roles--flow)
- [OCR Timetable Pipeline](#ocr-timetable-pipeline)
- [Push Notifications](#push-notifications)
- [Auto-Substitution Engine](#auto-substitution-engine)
- [PWA Installation](#pwa-installation)
- [Excel Templates](#excel-templates)
- [Security](#security)

---

## Overview

SmartTimetable is a full-stack MVC web application that automates university timetable management. Admin uploads a timetable image → OCR extracts the structure → slots are auto-created in the database → students see colored timetable boxes automatically. The system sends push notifications 5 minutes before every lecture, auto-assigns substitute teachers when unavailability is reported, and tracks IKS event credits — all without constant admin intervention.

---

## Features

### 🔔 Real-Time Push Notifications
- Push notification to students and teachers **5 minutes before every lecture**
- Instant alert when a substitute teacher is assigned
- Event conflict alerts when a lecture is replaced by an event
- Works on phone home screen via **Web Push (VAPID)**
- Delivered even when browser is closed

### 📸 OCR Timetable Pipeline
- Admin uploads timetable image (JPG/PNG)
- `sharp` preprocesses image (grayscale, normalize, sharpen, upscale)
- `tesseract.js` runs OCR to extract text
- Parser detects subject codes (CSL0206, MAL0201 etc.)
- Codes matched against subjects in DB → slots auto-created
- Students see colored boxes immediately — no manual slot entry

### 🔁 Auto-Substitution Engine
- Teacher marks unavailability → system finds free teacher automatically
- Checks all teachers for timetable conflicts before assigning
- Notifies substitute teacher, all affected students, and admin via push
- Admin can override any auto-assignment
- Zero admin involvement required

### 📅 Timetable Management
- Admin creates slots manually OR uploads timetable image
- Upload replaces old slots automatically
- Delete uploaded timetable and its slots anytime
- Students see dynamic colored boxes based on DB slots

### 🎓 Role-Based Access
| Role | Access |
|------|--------|
| Student | View timetable, events, IKS credits, report absence |
| Teacher | Mark lectures, manage unavailability, view substitutions |
| Admin | Full system — users, timetable, events, substitutions, OCR upload |

### 📊 IKS Credit Tracking
- Admin marks event attendance via Excel upload
- Credits automatically assigned to attended students
- Progress indicator showing earned vs required credits

### 📱 Progressive Web App
- Install on Android, iPhone, Windows, Mac from browser
- Works offline (cached pages via Service Worker)
- Background push notifications without App Store

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js v18+ |
| Framework | Express.js v4 |
| Database | MySQL 8.0 |
| Authentication | JWT (access + refresh tokens) |
| Password Hashing | bcrypt (12 rounds) |
| Push Notifications | web-push (VAPID) |
| Scheduled Jobs | node-cron |
| File Uploads | multer |
| Image Processing | sharp |
| OCR | tesseract.js |
| Excel Parsing | xlsx |
| Email (OTP) | nodemailer |
| Frontend | Vanilla HTML / CSS / JavaScript |
| Architecture | MVC (Model-View-Controller) |

---

## Project Structure

```
MVC_BACKENED/
│
├── src/
│   ├── server.js                  # Entry point — starts Express + cron
│   ├── app.js                     # Express setup, CORS, routes
│   │
│   ├── config/
│   │   ├── db.js                  # MySQL connection pool
│   │   └── upload.js              # Multer config (image + Excel)
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
│   │   ├── auth.middleware.js      # JWT verification
│   │   └── role.middleware.js      # Role-based access guard
│   │
│   ├── services/
│   │   ├── OCRService.js           # sharp preprocessing + tesseract OCR
│   │   ├── TimetableParserService.js  # Text → structured slots
│   │   ├── SlotCreatorService.js   # DB lookup + slot insertion
│   │   ├── AutoSubstitutionService.js # Auto-assign substitute logic
│   │   └── PushService.js         # Web Push dispatch
│   │
│   └── cron/
│       └── scheduler.js           # 5-minute lecture alert cron
│
├── uploads/
│   ├── timetables/                # Uploaded timetable images
│   └── excel/                     # Temp Excel uploads
│
├── frontened/
│   ├── index.html                 # Landing page
│   ├── signin.html / signup.html
│   ├── forgotpassword.html / otpverification.html / resetpassword.html
│   ├── changepassword.html
│   │
│   ├── dashboard.html             # Student dashboard
│   ├── mytimetable.html           # Student timetable (colored boxes)
│   ├── events.html / iks.html
│   │
│   ├── teacher-dashboard.html
│   ├── teacher-timetable.html
│   ├── teacher-mark-lecture.html
│   ├── teacher-substitutions.html
│   │
│   ├── admin-dashboard.html
│   ├── admin-timetable.html       # Upload + manage slots
│   ├── admin-substitutions.html
│   ├── admin-attendance.html
│   ├── admin-events.html
│   ├── admin-users.html
│   ├── admin-manage.html          # School/Course/Branch/Sem/Section/Subject
│   ├── admin-manage-students.html # Section-first student registration
│   ├── admin-manage-teachers.html # Multi-section teacher assignment
│   │
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service Worker
│   ├── admin.css / dashboard.css / mytimetable.css
│   └── icon-72.png / icon-192.png / icon-512.png
│
├── .env                           # Environment variables
├── package.json
└── database.sql                   # Complete schema
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

# 2. Install all dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Edit .env with your values

# 4. Set up the database
mysql -u root -p < database.sql

# 5. Generate VAPID keys (one time only)
node -e "const wp=require('web-push');const k=wp.generateVAPIDKeys();console.log('PUBLIC:',k.publicKey);console.log('PRIVATE:',k.privateKey);"
# Copy keys into .env

# 6. Start the server
node src/server.js
```

Server starts at `http://localhost:5000`

Open frontend using VS Code Live Server — served at `http://127.0.0.1:3000`

### Verify server is running
```
http://127.0.0.1:5000/ping
```
Should return: `Backend working on port 5000`

---

## Environment Variables

Create `.env` in the project root:

```env
# ── Database ───────────────────────────────────────────────────────────
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=TIMETABLE

# ── JWT ────────────────────────────────────────────────────────────────
ACCESS_TOKEN_SECRET=your_access_secret_key_here
REFRESH_TOKEN_SECRET=your_refresh_secret_key_here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=7d

# ── Email (for OTP recovery) ───────────────────────────────────────────
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_gmail_app_password

# ── Web Push (VAPID) ───────────────────────────────────────────────────
VAPID_PUBLIC_KEY=your_generated_public_key
VAPID_PRIVATE_KEY=your_generated_private_key
VAPID_EMAIL=mailto:your@gmail.com

# ── Server ─────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=5000
```

> **Note:** For `EMAIL_PASS` use a Gmail App Password.
> Google Account → Security → 2-Step Verification → App Passwords

---

## Database Setup

Run the complete SQL script:

```bash
mysql -u root -p TIMETABLE < database.sql
```

### All 20 Tables

| Table | Purpose |
|-------|---------|
| `users` | Base table for all roles |
| `students` | Student profile (extends users) |
| `teachers` | Teacher profile (extends users) |
| `admins` | Admin profile (extends users) |
| `schools` | University top-level |
| `courses` | Under schools |
| `branches` | Under courses (CSE, ECE etc.) |
| `semesters` | Under branches (Sem 1–8) |
| `sections` | Under semesters (CS-A, CS-B) |
| `subjects` | Subject master with codes |
| `timetable_slots` | Weekly recurring schedule |
| `lecture_attendance` | Daily lecture status |
| `substitutions` | Substitute assignments |
| `teacher_unavailability` | Teacher unavailability → triggers auto-sub |
| `iks_events` | University/branch/section events |
| `event_attendance` | Student event attendance + credits |
| `section_timetables` | Uploaded timetable image per section |
| `push_subscriptions` | Web Push VAPID keys per user |
| `notifications` | Persistent notification log |
| `event_conflicts` | Event vs lecture clash records |

---

## API Reference

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/forgot
POST   /api/auth/verify-otp
POST   /api/auth/reset
POST   /api/auth/change-password
```

### Student
```
GET    /api/student/profile
GET    /api/student/timetable/today
GET    /api/student/timetable/weekly
POST   /api/student/report-absence
GET    /api/student/events
GET    /api/student/credits
GET    /api/student/notifications
GET    /api/student/substitutions
```

### Teacher
```
GET    /api/timetable/teacher/today
GET    /api/timetable/teacher/weekly
POST   /api/attendance/mark
GET    /api/attendance/teacher/history
GET    /api/substitutions/teacher
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
POST   /api/admin/students/create
POST   /api/admin/teachers/create
GET    /api/timetable/admin/all
POST   /api/timetable/admin/slot
DELETE /api/timetable/admin/slot/:id
POST   /api/substitutions/assign
GET    /api/substitutions/all
GET    /api/unavailability/all
POST   /api/unavailability/override/:id
GET    /api/unavailability/free-teachers
POST   /api/events
PUT    /api/events/:id
DELETE /api/events/:id
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
POST     /api/upload/timetable              Upload image → OCR → auto-create slots
DELETE   /api/upload/timetable/:id          Delete uploaded timetable + its slots
GET      /api/upload/timetable/all          All uploaded timetables (admin)
GET      /api/upload/timetable/section/:id  Get timetable for a section
POST     /api/upload/students/excel         Bulk import students
POST     /api/upload/events/attendance/excel  Mark event attendance
```

### Push Notifications
```
GET      /api/push/vapid-key
POST     /api/push/subscribe
DELETE   /api/push/unsubscribe
POST     /api/push/test
```

---

## User Roles & Flow

### First-Time Setup Order
```
1. Register Admin via signup.html
2. Login as Admin → Manage Structure
3. Create: School → Course → Branch → Semester → Section → Subject
   (Make sure subjects have correct codes like CSL0206, MAL0201)
4. Manage Teachers → register teachers
5. Manage Students → select section → register students
6. Timetable → Upload Timetable → select section → upload image
   (OCR runs automatically and creates colored slots)
7. Students log in → My Timetable shows colored boxes
```

### Student Flow
```
Login → Allow notifications → Dashboard shows today's lectures
Get push alert 5 min before class → Report absent teacher if needed
View timetable → Check IKS credits → View events
```

### Teacher Flow
```
Login → View today's lectures → Mark as Conducted/Cancelled
Going to meeting? → Mark Unavailable → system auto-handles substitution
View substitution assignments → View events
```

---

## OCR Timetable Pipeline

```
Admin uploads timetable image (JPG/PNG)
        ↓
sharp preprocesses: grayscale + normalize + sharpen + upscale to 2000px
        ↓
tesseract.js extracts raw text from image
        ↓
Parser detects subject codes (e.g. CSL0206, MAL0201)
using 5 strategies: numbered-columns, row-based,
column-based, grid-based, free-form
        ↓
Each code queried against subjects table in DB
→ Exact match: use subject name from DB
→ Partial match: use closest subject
→ Not found: create new subject with code as name
        ↓
timetable_slots rows inserted (old slots deleted first)
        ↓
Students see colored boxes on My Timetable immediately
```

### For Best OCR Results
| Image Type | Result |
|---|---|
| Screenshot of digital timetable | ✅ Excellent |
| Clear printed photo, good light | ✅ Good |
| Photo in dim light or angled | ⚠️ Moderate |
| Handwritten | ❌ Poor |

### Subject Code Matching
Make sure your subjects in **Manage Structure → Subjects** have correct codes. The OCR reads codes accurately — the DB must have matching entries.

```sql
-- Check your subjects have codes
SELECT subject_name, subject_code FROM subjects;

-- Update a code if missing
UPDATE subjects SET subject_code = 'CSL0206'
WHERE subject_name = 'Computer System Organization';
```

---

## Push Notifications

### How It Works
```
Every minute — cron job checks for lectures in 5 minutes
        ↓
Finds matching timetable slots
        ↓
Sends Web Push to all students in that section
        ↓
Sends Web Push to assigned teacher
        ↓
Notification appears on phone home screen
```

### Triggers
| Event | Recipients |
|---|---|
| Lecture in 5 minutes | Students + Teacher |
| Substitute assigned | Affected students + Substitute teacher |
| Auto-substitution done | Admin |
| No substitute found | Admin |
| Lecture cancelled | Students in section |
| Event replaces lecture | Students in section |

### Enabling Push (Users)
1. Open app → Login
2. Click **Allow** when browser asks for notification permission
3. Done — active for all future sessions

---

## Auto-Substitution Engine

```
Teacher clicks "Mark Unavailable" → enters date, time, reason
        ↓
System finds all timetable slots in that time range for that teacher
        ↓
For each affected slot:
  → Query all other teachers
  → Filter out teachers with conflicting slots
  → Filter out teachers already marked unavailable
        ↓
First free teacher auto-assigned
        ↓
Push notifications sent to:
  - Substitute teacher
  - All students in the section
  - All admins
        ↓
Admin can override any assignment
```

---

## PWA Installation

### Android (Chrome)
1. Open site in Chrome → tap **⋮** menu → **Add to Home Screen**

### iPhone (Safari)
1. Open site in Safari → tap **Share** → **Add to Home Screen**
2. Requires iOS 16.4+ for push notifications

### Desktop (Chrome/Edge)
1. Click install icon in address bar → **Install**

> PWA requires HTTPS in production. Use Ngrok for local testing:
> ```bash
> npm install -g ngrok
> ngrok http 5000
> ```

---

## Excel Templates

### Student Bulk Import
Columns required:

| Name | Email | Password | Enrollment | Department |
|------|-------|----------|------------|------------|

Empty Password → default `Welcome@123`

### Event Attendance Marking
At least one of:

| Enrollment | Email |
|------------|-------|

---

## Scripts

```bash
# Start server
node src/server.js

# Start with auto-restart
nodemon src/server.js

# Or using npm scripts (add to package.json)
npm start        # node src/server.js
npm run dev      # nodemon src/server.js

# Generate VAPID keys
node -e "const wp=require('web-push');const k=wp.generateVAPIDKeys();console.log(k);"

# Test DB connection
node -e "import('./src/config/db.js').then(m=>m.default.query('SELECT 1').then(()=>console.log('DB OK')).catch(console.error))"
```

---

## Security

- Passwords hashed with **bcrypt** (12 salt rounds)
- JWT access tokens expire in **1 day**
- Refresh tokens in **httpOnly cookies** — inaccessible to JavaScript
- All protected routes verified by **JWT middleware**
- Role-based access on every route
- OTP codes expire in **10 minutes**
- File uploads restricted to allowed MIME types
- SQL injection prevented via parameterized queries
- CORS restricted to known frontend origins

---

## Common Issues

| Error | Fix |
|---|---|
| `ERR_INTERNET_DISCONNECTED` | Server not running — run `node src/server.js` |
| `Table doesn't exist` | Run missing SQL from database.sql in MySQL Workbench |
| `CORS blocked` | Check `app.js` CORS config includes your frontend origin |
| `File not found` (uploads) | Check `express.static` path in `app.js` |
| `Parsed 0 slots` | Ensure subjects have correct codes in DB |
| `JWT expired` | Frontend auto-refreshes — if loop, clear localStorage |
| Port already in use | `netstat -ano \| findstr :5000` then `taskkill /PID xxx /F` |

---

## License

Built for educational purposes as part of a university project.

---

*SmartTimetable Alert System — Built for Smart University Management* 🎓

OWNER- ANSHIKA KHANDELWAL