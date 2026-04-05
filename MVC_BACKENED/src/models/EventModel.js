import db from '../config/db.js';

const EventModel = {

  // ── Get all events (with optional scope filter) ──────────────────────────
  getAll: async () => {
    const [rows] = await db.query(
      `SELECT
         e.*,
         u.name AS created_by_name,
         b.branch_name,
         s.section_name
       FROM iks_events e
       JOIN users    u ON e.created_by  = u.user_id
       LEFT JOIN branches  b ON e.branch_id  = b.branch_id
       LEFT JOIN sections  s ON e.section_id = s.section_id
       ORDER BY e.event_date ASC`
    );
    return rows;
  },

  // ── Get events visible to a specific student ─────────────────────────────
  getForStudent: async (studentId) => {
    const [rows] = await db.query(
      `SELECT
         e.*,
         b.branch_name,
         s.section_name,
         ea.attended_at,
         ea.credits_earned
       FROM iks_events e
       LEFT JOIN branches b  ON e.branch_id  = b.branch_id
       LEFT JOIN sections s  ON e.section_id = s.section_id
       LEFT JOIN event_attendance ea
         ON ea.event_id   = e.event_id
         AND ea.student_id = ?
       WHERE e.scope = 'university'
         OR (e.scope = 'branch' AND e.branch_id = (
               SELECT br.branch_id
               FROM students st
               JOIN sections sec ON st.section_id = sec.section_id
               JOIN semesters sem ON sec.sem_id    = sem.sem_id
               JOIN branches  br  ON sem.branch_id = br.branch_id
               WHERE st.student_id = ?
             ))
         OR (e.scope = 'section' AND e.section_id = (
               SELECT section_id FROM students WHERE student_id = ?
             ))
       ORDER BY e.event_date ASC`,
      [studentId, studentId, studentId]
    );
    return rows;
  },

  // ── Get events visible to a teacher ─────────────────────────────────────
  getForTeacher: async () => {
    const [rows] = await db.query(
      `SELECT
         e.*,
         u.name  AS created_by_name,
         b.branch_name,
         s.section_name
       FROM iks_events e
       JOIN users    u ON e.created_by  = u.user_id
       LEFT JOIN branches b ON e.branch_id  = b.branch_id
       LEFT JOIN sections s ON e.section_id = s.section_id
       ORDER BY e.event_date ASC`
    );
    return rows;
  },

  // ── Get single event by ID ───────────────────────────────────────────────
  getById: async (eventId) => {
    const [rows] = await db.query(
      `SELECT
         e.*,
         u.name AS created_by_name,
         b.branch_name,
         s.section_name
       FROM iks_events e
       JOIN users    u ON e.created_by  = u.user_id
       LEFT JOIN branches b ON e.branch_id  = b.branch_id
       LEFT JOIN sections s ON e.section_id = s.section_id
       WHERE e.event_id = ?`,
      [eventId]
    );
    return rows[0] || null;
  },

  // ── Create event (admin only) ────────────────────────────────────────────
  create: async ({
    eventName, description, eventDate,
    startTime, endTime, venue, credits,
    scope, branchId, sectionId, createdBy,
  }) => {
    const [result] = await db.query(
      `INSERT INTO iks_events
         (event_name, description, event_date,
          start_time, end_time, venue, credits,
          scope, branch_id, section_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventName, description, eventDate,
        startTime, endTime, venue, credits,
        scope,
        branchId   || null,
        sectionId  || null,
        createdBy,
      ]
    );
    return result.insertId;
  },

  // ── Update event (admin only) ────────────────────────────────────────────
  update: async (eventId, {
    eventName, description, eventDate,
    startTime, endTime, venue, credits,
    scope, branchId, sectionId,
  }) => {
    const [result] = await db.query(
      `UPDATE iks_events SET
         event_name  = ?,
         description = ?,
         event_date  = ?,
         start_time  = ?,
         end_time    = ?,
         venue       = ?,
         credits     = ?,
         scope       = ?,
         branch_id   = ?,
         section_id  = ?
       WHERE event_id = ?`,
      [
        eventName, description, eventDate,
        startTime, endTime, venue, credits,
        scope,
        branchId  || null,
        sectionId || null,
        eventId,
      ]
    );
    return result.affectedRows;
  },

  // ── Delete event (admin only) ────────────────────────────────────────────
  delete: async (eventId) => {
    const [result] = await db.query(
      `DELETE FROM iks_events WHERE event_id = ?`,
      [eventId]
    );
    return result.affectedRows;
  },

  // ── Check event vs timetable conflict ────────────────────────────────────
  checkConflict: async (eventId) => {
    const [rows] = await db.query(
      `SELECT
         ec.*,
         ts.start_time,
         ts.end_time,
         s.subject_name,
         sec.section_name
       FROM event_conflicts ec
       JOIN timetable_slots ts  ON ec.slot_id    = ts.slot_id
       JOIN subjects         s  ON ts.subject_id = s.subject_id
       JOIN sections         sec ON ts.section_id = sec.section_id
       WHERE ec.event_id = ?`,
      [eventId]
    );
    return rows;
  },

  // ── Save detected conflict ───────────────────────────────────────────────
  saveConflict: async (eventId, slotId, conflictDate) => {
    await db.query(
      `INSERT IGNORE INTO event_conflicts
         (event_id, slot_id, conflict_date)
       VALUES (?, ?, ?)`,
      [eventId, slotId, conflictDate]
    );
  },

  // ── Detect conflicts automatically ───────────────────────────────────────
  detectConflicts: async (eventId) => {
    const [rows] = await db.query(
      `SELECT ts.slot_id, ts.section_id
       FROM iks_events   e
       JOIN timetable_slots ts
         ON (
           e.scope = 'university'
           OR (e.scope = 'section' AND ts.section_id = e.section_id)
           OR (e.scope = 'branch'  AND ts.section_id IN (
                 SELECT sec.section_id
                 FROM sections  sec
                 JOIN semesters sem ON sec.sem_id    = sem.sem_id
                 WHERE sem.branch_id = e.branch_id
               ))
         )
         AND DAYNAME(e.event_date) = ts.day_of_week
         AND e.start_time < ts.end_time
         AND e.end_time   > ts.start_time
       WHERE e.event_id = ?`,
      [eventId]
    );
    return rows;
  },

};

export default EventModel;