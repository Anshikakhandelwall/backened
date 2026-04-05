import db from '../config/db.js';

const TimetableModel = {

  // ── Get today's lectures for a teacher ──────────────────────────────────
  getTodayByTeacher: async (teacherId, dayOfWeek) => {
    const [rows] = await db.query(
      `SELECT
         ts.slot_id,
         ts.start_time,
         ts.end_time,
         ts.room,
         ts.slot_type,
         s.subject_name,
         s.subject_code,
         sec.section_name,
         la.status,
         la.attendance_id
       FROM timetable_slots ts
       JOIN subjects  s   ON ts.subject_id  = s.subject_id
       JOIN sections  sec ON ts.section_id  = sec.section_id
       LEFT JOIN lecture_attendance la
         ON la.slot_id = ts.slot_id
         AND la.lecture_date = CURDATE()
       WHERE ts.teacher_id  = ?
         AND ts.day_of_week = ?
       ORDER BY ts.start_time ASC`,
      [teacherId, dayOfWeek]
    );
    return rows;
  },

  // ── Get full weekly timetable for a teacher ──────────────────────────────
  getWeeklyByTeacher: async (teacherId) => {
    const [rows] = await db.query(
      `SELECT
         ts.slot_id,
         ts.day_of_week,
         ts.start_time,
         ts.end_time,
         ts.room,
         ts.slot_type,
         s.subject_name,
         s.subject_code,
         sec.section_name
       FROM timetable_slots ts
       JOIN subjects  s   ON ts.subject_id = s.subject_id
       JOIN sections  sec ON ts.section_id = sec.section_id
       WHERE ts.teacher_id = ?
       ORDER BY FIELD(ts.day_of_week,
         'Monday','Tuesday','Wednesday',
         'Thursday','Friday','Saturday'),
         ts.start_time ASC`,
      [teacherId]
    );
    return rows;
  },

  // ── Get today's lectures for a section (student view) ───────────────────
  getTodayBySection: async (sectionId, dayOfWeek) => {
    const [rows] = await db.query(
      `SELECT
         ts.slot_id,
         ts.start_time,
         ts.end_time,
         ts.room,
         ts.slot_type,
         s.subject_name,
         u.name AS teacher_name,
         la.status
       FROM timetable_slots ts
       JOIN subjects  s ON ts.subject_id  = s.subject_id
       JOIN teachers  t ON ts.teacher_id  = t.teacher_id
       JOIN users     u ON t.teacher_id   = u.user_id
       LEFT JOIN lecture_attendance la
         ON la.slot_id = ts.slot_id
         AND la.lecture_date = CURDATE()
       WHERE ts.section_id  = ?
         AND ts.day_of_week = ?
       ORDER BY ts.start_time ASC`,
      [sectionId, dayOfWeek]
    );
    return rows;
  },

  // ── Get full weekly timetable for a section ──────────────────────────────
  getWeeklyBySection: async (sectionId) => {
    const [rows] = await db.query(
      `SELECT
         ts.slot_id,
         ts.day_of_week,
         ts.start_time,
         ts.end_time,
         ts.room,
         ts.slot_type,
         s.subject_name,
         u.name AS teacher_name
       FROM timetable_slots ts
       JOIN subjects  s ON ts.subject_id = s.subject_id
       JOIN teachers  t ON ts.teacher_id = t.teacher_id
       JOIN users     u ON t.teacher_id  = u.user_id
       WHERE ts.section_id = ?
       ORDER BY FIELD(ts.day_of_week,
         'Monday','Tuesday','Wednesday',
         'Thursday','Friday','Saturday'),
         ts.start_time ASC`,
      [sectionId]
    );
    return rows;
  },

  // ── Get teacher_id from user_id ──────────────────────────────────────────
  getTeacherByUserId: async (userId) => {
    const [rows] = await db.query(
      `SELECT teacher_id, department, designation
       FROM teachers WHERE teacher_id = ?`,
      [userId]
    );
    return rows[0] || null;
  },

  // ── Get student's section_id from user_id ────────────────────────────────
  getStudentSection: async (userId) => {
    const [rows] = await db.query(
      `SELECT section_id FROM students WHERE student_id = ?`,
      [userId]
    );
    return rows[0]?.section_id || null;
  },

};

export default TimetableModel;