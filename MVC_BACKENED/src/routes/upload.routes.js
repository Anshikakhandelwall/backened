import express                    from 'express';
import {
  uploadTimetable as uploadTimetableFile,
  uploadExcel,
}                                 from '../config/upload.js';
import {
  uploadTimetable,
  getTimetableBySection,
  getAllTimetables,
  serveFile,
}                                 from '../controller/TimetableUploadController.js';
import {
  importStudentsFromExcel,
  markEventAttendanceFromExcel,
}                                 from '../controller/ExcelImportController.js';
import { authenticate }           from '../middleware/auth.middleware.js';
import { authorise }              from '../middleware/role.middleware.js';

const router = express.Router();

// ── Timetable upload ──────────────────────────────────────────────────────
router.post('/timetable',
  authenticate, authorise('admin'),
  uploadTimetableFile.single('timetable'),
  uploadTimetable
);

router.get('/timetable/all',
  authenticate, authorise('admin'),
  getAllTimetables
);

router.get('/timetable/section/:sectionId',
  authenticate,
  getTimetableBySection
);

router.get('/timetable/file/:filename',
  serveFile
);

// ── Excel import ──────────────────────────────────────────────────────────
router.post('/students/excel',
  authenticate, authorise('admin'),
  uploadExcel.single('students'),
  importStudentsFromExcel
);

router.post('/events/attendance/excel',
  authenticate, authorise('admin'),
  uploadExcel.single('attendance'),
  markEventAttendanceFromExcel
);

export default router;

