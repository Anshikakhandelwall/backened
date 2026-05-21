import express           from 'express';
import {
  getStudentToday,
  getStudentWeekly,
  getTeacherToday,
  getTeacherWeekly,
  getAllSlots,
}                        from '../controller/TimetableController.js';
import { authenticate }  from '../middleware/auth.middleware.js';
import { authorise }     from '../middleware/role.middleware.js';

const router = express.Router();

// ── Student ───────────────────────────────────────────────────────────
router.get('/student/today',
  authenticate, authorise('student'),
  getStudentToday
);

router.get('/student/weekly',
  authenticate, authorise('student'),
  getStudentWeekly
);

// ── Teacher ───────────────────────────────────────────────────────────
router.get('/teacher/today',
  authenticate, authorise('teacher'),
  getTeacherToday
);

router.get('/teacher/weekly',
  authenticate, authorise('teacher'),
  getTeacherWeekly
);

// ── Admin ─────────────────────────────────────────────────────────────
router.get('/admin/all',
  authenticate, authorise('admin'),
  getAllSlots
);

export default router;