import db from '../config/db.js';

const LectureAttendanceModel = {

  // ── Mark or update lecture status ────────────────────────────────────────
  markStatus: async ({ slotId, lectureDate, status, reportedBy }) => {
    // Use INSERT ... ON DUPLICATE KEY to handle re-marking
    const [result] = await db.query(
      `INSERT INTO lecture_attendance
         (slot_id, lecture_date, status, reported_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         status      = VALUES(status),
         reported_by = VALUES(reported_by)`,
      [slotId, lectureDate, status, reportedBy]
    );
    return result;
  },

  // ── Get attendance for a specific slot and date ──────────────────────────
  getBySlotAndDate: async (slotId, lectureDate) => {
    const [rows] = await db.query(
      `SELECT * FROM lecture_attendance
       WHERE slot_id = ? AND lecture_date = ?`,
      [slotId, lectureDate]
    );
    return rows[0] || null;
  },

  // ── Get all attendance records for a teacher (by date range) ────────────
  getByTeacher: async (teacherId, fromDate, toDate) => {
    const [rows] = await db.query(
      `SELECT
         la.*,
         ts.start_time,
         ts.end_time,
         ts.room,
         s.subject_name,
         sec.section_name
       FROM lecture_attendance la
       JOIN timetable_slots ts  ON la.slot_id    = ts.slot_id
       JOIN subjects         s  ON ts.subject_id = s.subject_id
       JOIN sections         sec ON ts.section_id = sec.section_id
       WHERE ts.teacher_id   = ?
         AND la.lecture_date BETWEEN ? AND ?
       ORDER BY la.lecture_date DESC, ts.start_time ASC`,
      [teacherId, fromDate, toDate]
    );
    return rows;
  },

  // ── Get today's absent lectures (for admin alerts) ───────────────────────
  getTodayAbsent: async () => {
    const [rows] = await db.query(
      `SELECT
         la.*,
         ts.start_time,
         ts.end_time,
         ts.room,
         s.subject_name,
         sec.section_name,
         u.name AS teacher_name,
         u.email AS teacher_email
       FROM lecture_attendance la
       JOIN timetable_slots ts  ON la.slot_id    = ts.slot_id
       JOIN subjects         s  ON ts.subject_id = s.subject_id
       JOIN sections         sec ON ts.section_id = sec.section_id
       JOIN teachers         t  ON ts.teacher_id = t.teacher_id
       JOIN users            u  ON t.teacher_id  = u.user_id
       WHERE la.lecture_date = CURDATE()
         AND la.status       = 'teacher_absent'`,
    );
    return rows;
  },

};

export default LectureAttendanceModel;