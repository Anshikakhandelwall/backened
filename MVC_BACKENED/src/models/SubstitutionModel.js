import db from '../config/db.js';

const SubstitutionModel = {

  // ── Create substitution ──────────────────────────────────────────────────
  create: async ({ slotId, subDate, originalTeacherId, substituteTeacherId, assignedBy, reason }) => {
    const [result] = await db.query(
      `INSERT INTO substitutions
         (slot_id, sub_date, original_teacher_id,
          substitute_teacher_id, assigned_by, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [slotId, subDate, originalTeacherId,
       substituteTeacherId, assignedBy, reason]
    );
    return result.insertId;
  },

  // ── Get substitutions where teacher is covering ──────────────────────────
  getCovering: async (teacherId) => {
    const [rows] = await db.query(
      `SELECT
         sub.*,
         ts.start_time,
         ts.end_time,
         ts.room,
         s.subject_name,
         sec.section_name,
         u_orig.name AS original_teacher
       FROM substitutions sub
       JOIN timetable_slots ts  ON sub.slot_id           = ts.slot_id
       JOIN subjects         s  ON ts.subject_id         = s.subject_id
       JOIN sections         sec ON ts.section_id        = sec.section_id
       JOIN teachers         t  ON sub.original_teacher_id = t.teacher_id
       JOIN users            u_orig ON t.teacher_id      = u_orig.user_id
       WHERE sub.substitute_teacher_id = ?
       ORDER BY sub.sub_date DESC`,
      [teacherId]
    );
    return rows;
  },

  // ── Get substitutions where teacher was absent ───────────────────────────
  getAbsences: async (teacherId) => {
    const [rows] = await db.query(
      `SELECT
         sub.*,
         ts.start_time,
         ts.end_time,
         ts.room,
         s.subject_name,
         sec.section_name,
         u_sub.name AS substitute_teacher
       FROM substitutions sub
       JOIN timetable_slots ts ON sub.slot_id              = ts.slot_id
       JOIN subjects         s ON ts.subject_id            = s.subject_id
       JOIN sections        sec ON ts.section_id           = sec.section_id
       JOIN teachers         t ON sub.substitute_teacher_id = t.teacher_id
       JOIN users         u_sub ON t.teacher_id            = u_sub.user_id
       WHERE sub.original_teacher_id = ?
       ORDER BY sub.sub_date DESC`,
      [teacherId]
    );
    return rows;
  },

  // ── Get all substitutions for admin ─────────────────────────────────────
  getAll: async () => {
    const [rows] = await db.query(
      `SELECT
         sub.*,
         ts.start_time,
         ts.end_time,
         ts.room,
         s.subject_name,
         sec.section_name,
         u_orig.name AS original_teacher,
         u_sub.name  AS substitute_teacher
       FROM substitutions sub
       JOIN timetable_slots ts   ON sub.slot_id               = ts.slot_id
       JOIN subjects         s   ON ts.subject_id             = s.subject_id
       JOIN sections        sec  ON ts.section_id             = sec.section_id
       JOIN users         u_orig ON sub.original_teacher_id   = u_orig.user_id
       JOIN users         u_sub  ON sub.substitute_teacher_id = u_sub.user_id
       ORDER BY sub.sub_date DESC`,
    );
    return rows;
  },

  // ── Check if substitution already exists for slot+date ──────────────────
  exists: async (slotId, subDate) => {
    const [rows] = await db.query(
      `SELECT sub_id FROM substitutions
       WHERE slot_id = ? AND sub_date = ?`,
      [slotId, subDate]
    );
    return rows.length > 0;
  },

};

export default SubstitutionModel;