import db from '../config/db.js';

const TimetableSlotModel = {

  // ── Get all slots (admin view) ────────────────────────────────────────
  getAll: async () => {
    const [rows] = await db.query(
      `SELECT
         ts.slot_id,
         ts.day_of_week,
         ts.start_time,
         ts.end_time,
         ts.room,
         ts.slot_type,
         ts.section_id,
         ts.teacher_id,
         ts.subject_id,
         s.subject_name,
         s.subject_code,
         u.name    AS teacher_name,
         sec.section_name
       FROM timetable_slots ts
       JOIN subjects  s   ON ts.subject_id = s.subject_id
       JOIN teachers  t   ON ts.teacher_id = t.teacher_id
       JOIN users     u   ON t.teacher_id  = u.user_id
       JOIN sections  sec ON ts.section_id = sec.section_id
       ORDER BY FIELD(ts.day_of_week,
         'Monday','Tuesday','Wednesday',
         'Thursday','Friday','Saturday'),
         ts.start_time ASC`
    );
    return rows;
  },

  // ── Get slot by ID ────────────────────────────────────────────────────
  getById: async (slotId) => {
    const [rows] = await db.query(
      `SELECT
         ts.*,
         s.subject_name,
         u.name AS teacher_name,
         sec.section_name
       FROM timetable_slots ts
       JOIN subjects  s   ON ts.subject_id = s.subject_id
       JOIN teachers  t   ON ts.teacher_id = t.teacher_id
       JOIN users     u   ON t.teacher_id  = u.user_id
       JOIN sections  sec ON ts.section_id = sec.section_id
       WHERE ts.slot_id = ?`,
      [slotId]
    );
    return rows[0] || null;
  },

  // ── Create slot ───────────────────────────────────────────────────────
  create: async ({
    sectionId, subjectId, teacherId,
    dayOfWeek, startTime, endTime,
    room, slotType,
  }) => {
    const [result] = await db.query(
      `INSERT INTO timetable_slots
         (section_id, subject_id, teacher_id,
          day_of_week, start_time, end_time,
          room, slot_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sectionId, subjectId, teacherId,
        dayOfWeek, startTime, endTime,
        room || null, slotType || 'lecture',
      ]
    );
    return result.insertId;
  },

  // ── Update slot ───────────────────────────────────────────────────────
  update: async (slotId, {
    sectionId, subjectId, teacherId,
    dayOfWeek, startTime, endTime,
    room, slotType,
  }) => {
    const [result] = await db.query(
      `UPDATE timetable_slots SET
         section_id  = ?,
         subject_id  = ?,
         teacher_id  = ?,
         day_of_week = ?,
         start_time  = ?,
         end_time    = ?,
         room        = ?,
         slot_type   = ?
       WHERE slot_id = ?`,
      [
        sectionId, subjectId, teacherId,
        dayOfWeek, startTime, endTime,
        room || null, slotType || 'lecture',
        slotId,
      ]
    );
    return result.affectedRows;
  },

  // ── Delete slot ───────────────────────────────────────────────────────
  delete: async (slotId) => {
    const [result] = await db.query(
      `DELETE FROM timetable_slots WHERE slot_id = ?`,
      [slotId]
    );
    return result.affectedRows;
  },

  // ── Check for time conflict on same section + day ─────────────────────
  checkConflict: async ({
    sectionId, dayOfWeek,
    startTime, endTime, excludeSlotId,
  }) => {
    const [rows] = await db.query(
      `SELECT slot_id FROM timetable_slots
       WHERE section_id  = ?
         AND day_of_week = ?
         AND slot_id    != ?
         AND start_time  < ?
         AND end_time    > ?`,
      [
        sectionId, dayOfWeek,
        excludeSlotId || 0,
        endTime, startTime,
      ]
    );
    return rows.length > 0;
  },

};

export default TimetableSlotModel;