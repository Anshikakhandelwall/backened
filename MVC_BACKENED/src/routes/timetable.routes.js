import express from 'express';
import {
    getTeacherToday,
    getTeacherWeekly,
    getStudentToday,
    getStudentWeekly,
} from '../controller/TimetableController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorise } from '../middleware/role.middleware.js';

const router = express.Router();

// Teacher routes
router.get('/teacher/today',
    authenticate, authorise('teacher'),
    getTeacherToday
);

router.get('/teacher/weekly',
    authenticate, authorise('teacher'),
    getTeacherWeekly
);

// Student routes
router.get('/student/today',
    authenticate, authorise('student'),
    getStudentToday
);

router.get('/student/weekly',
    authenticate, authorise('student'),
    getStudentWeekly
);

export default router;