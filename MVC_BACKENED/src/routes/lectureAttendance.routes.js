import express from 'express';
import {
    markStatus,
    getTeacherHistory,
    getTodayAbsent,
      getByDate,
} from '../controller/LectureAttendanceController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorise } from '../middleware/role.middleware.js';

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

// Admin views attendance by date
router.get('/admin/by-date',
    authenticate, authorise('admin'),
    getByDate
);
export default router;