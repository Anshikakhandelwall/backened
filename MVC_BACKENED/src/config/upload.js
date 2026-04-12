import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if not exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const timetableDir = './uploads/timetables';
if (!fs.existsSync(timetableDir)) fs.mkdirSync(timetableDir, { recursive: true });

const excelDir = './uploads/excel';
if (!fs.existsSync(excelDir)) fs.mkdirSync(excelDir, { recursive: true });

// ── Timetable image/PDF storage ──────────────────────────────────────────
const timetableStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads/timetables'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `timetable_section_${req.body.section_id}_${Date.now()}${ext}`;
        cb(null, name);
    },
});

const timetableFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG and PDF files are allowed'), false);
};

export const uploadTimetable = multer({
    storage: timetableStorage,
    fileFilter: timetableFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ── Excel storage ────────────────────────────────────────────────────────
const excelStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads/excel'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `students_${Date.now()}${ext}`);
    },
});

const excelFilter = (req, file, cb) => {
    const allowed = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
};

export const uploadExcel = multer({
    storage: excelStorage,
    fileFilter: excelFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});