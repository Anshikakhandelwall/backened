import express                      from 'express';
import { uploadTimetable as multerUpload, uploadExcel } from '../config/upload.js';
import {
  uploadAndParseTimetable,
  getTimetableBySection,
  getAllTimetables,
  deleteTimetable,
  serveFile,
}                                   from '../controller/TimetableUploadController.js';
import {
  importStudentsFromExcel,
  markEventAttendanceFromExcel,
}                                   from '../controller/ExcelImportController.js';
import { authenticate }             from '../middleware/auth.middleware.js';
import { authorise }                from '../middleware/role.middleware.js';

const router = express.Router();

// ── Upload image → OCR → auto-create slots ────────────────────────────
router.post('/timetable',
  authenticate,
  authorise('admin'),
  multerUpload.single('timetable'),
  uploadAndParseTimetable
);

// ── Delete uploaded timetable + its slots ─────────────────────────────
router.delete('/timetable/:id',
  authenticate,
  authorise('admin'),
  deleteTimetable
);

// ── Get all uploaded timetables (admin) ───────────────────────────────
router.get('/timetable/all',
  authenticate,
  authorise('admin'),
  getAllTimetables
);

// ── Get timetable for a section (student + admin) ─────────────────────
router.get('/timetable/section/:sectionId',
  authenticate,
  getTimetableBySection
);

// ── Serve uploaded file ───────────────────────────────────────────────
router.get('/timetable/file/:filename',
  serveFile
);

// ── Excel: bulk import students ───────────────────────────────────────
router.post('/students/excel',
  authenticate,
  authorise('admin'),
  uploadExcel.single('students'),
  importStudentsFromExcel
);

// ── Excel: mark event attendance ──────────────────────────────────────
router.post('/events/attendance/excel',
  authenticate,
  authorise('admin'),
  uploadExcel.single('attendance'),
  markEventAttendanceFromExcel
);

export default router;