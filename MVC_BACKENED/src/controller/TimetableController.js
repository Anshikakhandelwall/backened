// import TimetableModel from '../models/TimetableModel.js';

// const sendError = (res, status, message) =>
//   res.status(status).json({ success: false, message });

// const DAYS = ['Sunday','Monday','Tuesday','Wednesday',
//               'Thursday','Friday','Saturday'];

// // ── Teacher: today's lectures ────────────────────────────────────────────
// export const getTeacherToday = async (req, res) => {
//   try {
//     const teacherId = req.user.userId;
//     const dayOfWeek = DAYS[new Date().getDay()];

//     const teacher = await TimetableModel.getTeacherByUserId(teacherId);
//     if (!teacher)
//       return sendError(res, 404, 'Teacher profile not found');

//     const lectures = await TimetableModel.getTodayByTeacher(teacherId, dayOfWeek);

//     res.status(200).json({
//       success: true,
//       day:     dayOfWeek,
//       data:    lectures,
//     });

//   } catch (err) {
//     console.error('getTeacherToday error:', err);
//     sendError(res, 500, 'Could not fetch today\'s timetable');
//   }
// };

// // ── Teacher: full weekly timetable ───────────────────────────────────────
// export const getTeacherWeekly = async (req, res) => {
//   try {
//     const teacherId = req.user.userId;

//     const teacher = await TimetableModel.getTeacherByUserId(teacherId);
//     if (!teacher)
//       return sendError(res, 404, 'Teacher profile not found');

//     const lectures = await TimetableModel.getWeeklyByTeacher(teacherId);

//     res.status(200).json({
//       success: true,
//       data:    lectures,
//     });

//   } catch (err) {
//     console.error('getTeacherWeekly error:', err);
//     sendError(res, 500, 'Could not fetch weekly timetable');
//   }
// };

// // ── Student: today's lectures ────────────────────────────────────────────
// export const getStudentToday = async (req, res) => {
//   try {
//     const userId    = req.user.userId;
//     const dayOfWeek = DAYS[new Date().getDay()];

//     const sectionId = await TimetableModel.getStudentSection(userId);
//     if (!sectionId)
//       return sendError(res, 404, 'Student section not found');

//     const lectures = await TimetableModel.getTodayBySection(sectionId, dayOfWeek);

//     res.status(200).json({
//       success: true,
//       day:     dayOfWeek,
//       data:    lectures,
//     });

//   } catch (err) {
//     console.error('getStudentToday error:', err);
//     sendError(res, 500, 'Could not fetch today\'s timetable');
//   }
// };

// // ── Student: full weekly timetable ───────────────────────────────────────
// export const getStudentWeekly = async (req, res) => {
//   try {
//     const userId = req.user.userId;

//     const sectionId = await TimetableModel.getStudentSection(userId);
//     if (!sectionId)
//       return sendError(res, 404, 'Student section not found');

//     const lectures = await TimetableModel.getWeeklyBySection(sectionId);

//     res.status(200).json({
//       success: true,
//       data:    lectures,
//     });

//   } catch (err) {
//     console.error('getStudentWeekly error:', err);
//     sendError(res, 500, 'Could not fetch weekly timetable');
//   }
// };

import path                  from 'path';
import fs                    from 'fs';
import { fileURLToPath }     from 'url';
import TimetableUploadModel  from '../models/TimetableUploadModel.js';
import {
  preprocessImage,
  extractTextFromImage,
  cleanupProcessed,
}                            from '../services/OCRService.js';
import { parseTimetableText }  from '../services/TimetableParserService.js';
import { createSlotsFromParsed } from '../services/SlotCreatorService.js';

const __filename  = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads', 'timetables');

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

// ── Upload → OCR → Parse → Create slots ───────────────────────────────
export const uploadAndParseTimetable = async (req, res) => {
  let processedPath = null;

  try {
    if (!req.file)
      return sendError(res, 400, 'No file uploaded');

    const { section_id } = req.body;
    if (!section_id)
      return sendError(res, 400, 'section_id is required');

    const originalPath = path.join(UPLOADS_DIR, req.file.filename);
    const fileType     = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';

    console.log('\n=== Timetable Upload Pipeline ===');
    console.log('File:', req.file.filename);
    console.log('Section:', section_id);

    // ── Step 1: Save upload record ──────────────────────────────────
    await TimetableUploadModel.save({
      sectionId:  section_id,
      fileName:   req.file.originalname,
      filePath:   req.file.filename,
      fileType,
      uploadedBy: req.user.userId,
    });

    if (fileType === 'pdf') {
      return res.status(200).json({
        success:      true,
        message:      'PDF uploaded. OCR works best with images — please convert to JPG/PNG for auto-slot creation.',
        slotsCreated: 0,
        slotsSkipped: 0,
        slotsFailed:  0,
      });
    }

    // ── Step 2: Preprocess image ────────────────────────────────────
    console.log('Step 2: Preprocessing image...');
    processedPath = await preprocessImage(originalPath);

    // ── Step 3: Run OCR ─────────────────────────────────────────────
    console.log('Step 3: Running OCR...');
    const rawText = await extractTextFromImage(processedPath);

    console.log('\n--- OCR Raw Text ---');
    console.log(rawText);
    console.log('-------------------\n');

    if (!rawText || rawText.trim().length < 10) {
      return res.status(200).json({
        success: true,
        message: 'File uploaded but OCR could not extract text. Image may be too blurry. Slots were not created.',
        rawText: rawText.slice(0, 500),
        slotsCreated: 0,
        slotsSkipped: 0,
        slotsFailed:  0,
      });
    }

    // ── Step 4: Parse text into structured slots ────────────────────
    console.log('Step 4: Parsing timetable structure...');
    const parsedSlots = parseTimetableText(rawText);
    console.log(`Parsed ${parsedSlots.length} potential slots:`, parsedSlots);

    if (parsedSlots.length === 0) {
      return res.status(200).json({
        success:      true,
        message:      'File uploaded but could not detect timetable structure from OCR text. Try a clearer image.',
        slotsCreated: 0,
        slotsSkipped: 0,
        slotsFailed:  0,
        rawText:      rawText.slice(0, 1000),
      });
    }

    // ── Step 5: Create slots in database ───────────────────────────
    console.log('Step 5: Creating slots in database...');
    const results = await createSlotsFromParsed(parsedSlots, section_id);

    console.log('\n=== Results ===');
    console.log(`Created: ${results.created.length}`);
    console.log(`Skipped: ${results.skipped.length}`);
    console.log(`Failed:  ${results.failed.length}`);

    res.status(200).json({
      success:      true,
      message:      `Timetable processed. ${results.created.length} slots created automatically.`,
      slotsCreated: results.created.length,
      slotsSkipped: results.skipped.length,
      slotsFailed:  results.failed.length,
      created:      results.created,
      failed:       results.failed,
      skipped:      results.skipped,
      rawText:      rawText.slice(0, 500), // for debugging
    });

  } catch (err) {
    console.error('uploadAndParseTimetable error:', err);
    sendError(res, 500, `Pipeline error: ${err.message}`);
  } finally {
    // Always clean up processed temp file
    if (processedPath) cleanupProcessed(processedPath);
  }
};

// ── Get uploaded timetable for a section ──────────────────────────────
export const getTimetableBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const record        = await TimetableUploadModel.getBySectionId(sectionId);
    res.status(200).json({ success: true, data: record || null });
  } catch (err) {
    console.error('getTimetableBySection error:', err);
    sendError(res, 500, 'Could not fetch timetable');
  }
};

// ── Get all uploaded timetables (admin) ───────────────────────────────
export const getAllTimetables = async (req, res) => {
  try {
    const records = await TimetableUploadModel.getAll();
    res.status(200).json({ success: true, data: records });
  } catch (err) {
    console.error('getAllTimetables error:', err);
    sendError(res, 500, 'Could not fetch timetables');
  }
};

// ── Serve uploaded file ────────────────────────────────────────────────
export const serveFile = (req, res) => {
  const safeName = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, safeName);

  if (!fs.existsSync(filePath))
    return sendError(res, 404, 'File not found');

  res.sendFile(filePath);
};
import db from '../config/db.js';

// ── Student: today's lectures ──────────────────────────────────────────
export const getStudentToday = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const today     = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const [rows] = await db.query(
      `SELECT
         ts.slot_id,
         ts.start_time,
         ts.end_time,
         ts.room,
         ts.slot_type,
         s.subject_name,
         u.name  AS teacher_name,
         sec.section_name,
         la.status AS lecture_status
       FROM timetable_slots ts
       JOIN subjects  s   ON ts.subject_id  = s.subject_id
       JOIN teachers  t   ON ts.teacher_id  = t.teacher_id
       JOIN users     u   ON t.teacher_id   = u.user_id
       JOIN sections  sec ON ts.section_id  = sec.section_id
       JOIN students  st  ON ts.section_id  = st.section_id
       LEFT JOIN lecture_attendance la
              ON la.slot_id = ts.slot_id
             AND la.lecture_date = CURDATE()
       WHERE st.student_id  = ?
         AND ts.day_of_week = ?
       ORDER BY ts.start_time ASC`,
      [studentId, today]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('getStudentToday error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch today timetable' });
  }
};

// ── Student: weekly lectures ───────────────────────────────────────────
export const getStudentWeekly = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const [rows] = await db.query(
      `SELECT
         ts.slot_id,
         ts.day_of_week,
         ts.start_time,
         ts.end_time,
         ts.room,
         ts.slot_type,
         s.subject_name,
         u.name AS teacher_name,
         sec.section_name
       FROM timetable_slots ts
       JOIN subjects  s   ON ts.subject_id = s.subject_id
       JOIN teachers  t   ON ts.teacher_id = t.teacher_id
       JOIN users     u   ON t.teacher_id  = u.user_id
       JOIN sections  sec ON ts.section_id = sec.section_id
       JOIN students  st  ON ts.section_id = st.section_id
       WHERE st.student_id = ?
       ORDER BY
         FIELD(ts.day_of_week,
           'Monday','Tuesday','Wednesday',
           'Thursday','Friday','Saturday'),
         ts.start_time ASC`,
      [studentId]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('getStudentWeekly error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch weekly timetable' });
  }
};

// ── Teacher: today's lectures ──────────────────────────────────────────
export const getTeacherToday = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const today     = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const [rows] = await db.query(
      `SELECT
         ts.slot_id,
         ts.start_time,
         ts.end_time,
         ts.room,
         ts.slot_type,
         s.subject_name,
         sec.section_name,
         la.status AS lecture_status
       FROM timetable_slots ts
       JOIN subjects  s   ON ts.subject_id = s.subject_id
       JOIN sections  sec ON ts.section_id = sec.section_id
       LEFT JOIN lecture_attendance la
              ON la.slot_id = ts.slot_id
             AND la.lecture_date = CURDATE()
       WHERE ts.teacher_id  = ?
         AND ts.day_of_week = ?
       ORDER BY ts.start_time ASC`,
      [teacherId, today]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('getTeacherToday error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch today timetable' });
  }
};

// ── Teacher: weekly lectures ───────────────────────────────────────────
export const getTeacherWeekly = async (req, res) => {
  try {
    const teacherId = req.user.userId;

    const [rows] = await db.query(
      `SELECT
         ts.slot_id,
         ts.day_of_week,
         ts.start_time,
         ts.end_time,
         ts.room,
         ts.slot_type,
         s.subject_name,
         sec.section_name,
         la.status AS lecture_status
       FROM timetable_slots ts
       JOIN subjects  s   ON ts.subject_id = s.subject_id
       JOIN sections  sec ON ts.section_id = sec.section_id
       LEFT JOIN lecture_attendance la
              ON la.slot_id = ts.slot_id
             AND la.lecture_date = CURDATE()
       WHERE ts.teacher_id = ?
       ORDER BY
         FIELD(ts.day_of_week,
           'Monday','Tuesday','Wednesday',
           'Thursday','Friday','Saturday'),
         ts.start_time ASC`,
      [teacherId]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('getTeacherWeekly error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch weekly timetable' });
  }
};

// ── Admin: get all slots ───────────────────────────────────────────────
export const getAllSlots = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         ts.*,
         s.subject_name,
         u.name    AS teacher_name,
         sec.section_name,
         b.branch_name,
         sem.sem_number
       FROM timetable_slots ts
       JOIN subjects  s   ON ts.subject_id = s.subject_id
       JOIN teachers  t   ON ts.teacher_id = t.teacher_id
       JOIN users     u   ON t.teacher_id  = u.user_id
       JOIN sections  sec ON ts.section_id = sec.section_id
       JOIN semesters sem ON sec.sem_id     = sem.sem_id
       JOIN branches  b   ON sem.branch_id  = b.branch_id
       ORDER BY sec.section_name, ts.day_of_week, ts.start_time`
    );

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('getAllSlots error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch slots' });
  }
};