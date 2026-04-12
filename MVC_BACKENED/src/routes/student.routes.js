import express          from 'express';
import {
  getProfile,
  getTodayTimetable,
  getWeeklyTimetable,
  reportAbsence,
  getEvents,
  getCreditSummary,
  markEventAttendance,
  getNotifications,
  markNotificationRead,
  getSectionSubstitutions,
}                       from '../controller/StudentController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorise }    from '../middleware/role.middleware.js';

const router = express.Router();

// All student routes are protected
router.use(authenticate);
router.use(authorise('student'));

// ── Profile ───────────────────────────────────────────────────────────────
router.get('/profile',                  getProfile);

// ── Timetable ─────────────────────────────────────────────────────────────
router.get('/timetable/today',          getTodayTimetable);
router.get('/timetable/weekly',         getWeeklyTimetable);

// ── Absence report ────────────────────────────────────────────────────────
router.post('/report-absence',          reportAbsence);

// ── Events ────────────────────────────────────────────────────────────────
router.get('/events',                   getEvents);
router.post('/events/attend',           markEventAttendance);

// ── IKS Credits ───────────────────────────────────────────────────────────
router.get('/credits',                  getCreditSummary);

// ── Notifications ─────────────────────────────────────────────────────────
router.get('/notifications',            getNotifications);
router.put('/notifications/:notifId',   markNotificationRead);

// ── Substitutions ─────────────────────────────────────────────────────────
router.get('/substitutions',            getSectionSubstitutions);

export default router;