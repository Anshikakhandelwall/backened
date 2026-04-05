import express              from 'express';
import {
  markStatus,
  getTeacherHistory,
  getTodayAbsent,
}                           from '../controller/LectureAttendanceController.js';
import { authenticate }     from '../middleware/auth.middleware.js';
import { authorise }        from '../middleware/role.middleware.js';

const router = express.Router();

// Teacher marks their own lecture
router.post('/mark',
  authenticate, authorise('teacher'),
  markStatus
);

// Teacher views their own history
router.get('/teacher/history',
  authenticate, authorise('teacher'),
  getTeacherHistory
);

// Admin views today's absent lectures
router.get('/admin/absent-today',
  authenticate, authorise('admin'),
  getTodayAbsent
);

export default router;