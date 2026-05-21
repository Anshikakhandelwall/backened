import multer  from 'multer';
import path    from 'path';
import fs      from 'fs';

const uploadDir     = './uploads';
const timetableDir  = './uploads/timetables';
const excelDir      = './uploads/excel';

[uploadDir, timetableDir, excelDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ── Timetable storage ──────────────────────────────────────────────────
const timetableStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/timetables'),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `timetable_${Date.now()}${ext}`;  // ← removed section_id here
    cb(null, name);
  },
});

const timetableFilter = (req, file, cb) => {
  const allowed = ['image/jpeg','image/jpg','image/png','application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG and PDF files allowed'), false);
};

export const uploadTimetable = multer({
  storage:    timetableStorage,
  fileFilter: timetableFilter,
  limits:     { fileSize: 10 * 1024 * 1024 },
});

// ── Excel storage ──────────────────────────────────────────────────────
const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/excel'),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `students_${Date.now()}${ext}`);
  },
});

const excelFilter = (req, file, cb) => {
  const allowed = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only Excel files (.xlsx, .xls) allowed'), false);
};

export const uploadExcel = multer({
  storage:    excelStorage,
  fileFilter: excelFilter,
  limits:     { fileSize: 5 * 1024 * 1024 },
});