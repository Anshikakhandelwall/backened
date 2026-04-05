import express from 'express';
import {
    getAllEvents,
    getStudentEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    markAttendance,
    getStudentCredits,
    getEventAttendees,
} from '../controller/EventController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorise } from '../middleware/role.middleware.js';

const router = express.Router();

// ── Student routes ────────────────────────────────────────────────────────
router.get('/student',
    authenticate, authorise('student'),
    getStudentEvents
);

router.get('/student/credits',
    authenticate, authorise('student'),
    getStudentCredits
);

router.post('/student/attend',
    authenticate, authorise('student'),
    markAttendance
);

// ── Teacher routes ────────────────────────────────────────────────────────
router.get('/teacher',
    authenticate, authorise('teacher', 'admin'),
    getAllEvents
);

// ── Shared: get single event ──────────────────────────────────────────────
router.get('/:eventId',
    authenticate,
    getEventById
);

// ── Admin routes ──────────────────────────────────────────────────────────
router.post('/',
    authenticate, authorise('admin'),
    createEvent
);

router.put('/:eventId',
    authenticate, authorise('admin'),
    updateEvent
);

router.delete('/:eventId',
    authenticate, authorise('admin'),
    deleteEvent
);

router.get('/:eventId/attendees',
    authenticate, authorise('admin'),
    getEventAttendees
);

export default router;