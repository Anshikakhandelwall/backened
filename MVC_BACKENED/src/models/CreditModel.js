import db from '../config/db.js';

const CreditModel = {

  // ── Mark student attendance for an event ─────────────────────────────────
  markAttendance: async (eventId, studentId, creditsEarned) => {
    const [result] = await db.query(
      `INSERT INTO event_attendance
         (event_id, student_id, credits_earned)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         credits_earned = VALUES(credits_earned),
         attended_at    = CURRENT_TIMESTAMP`,
      [eventId, studentId, creditsEarned]
    );
    return result;
  },

  // ── Get student's total credits ───────────────────────────────────────────
  getTotalCredits: async (studentId) => {
    const [rows] = await db.query(
      `SELECT
         COALESCE(SUM(credits_earned), 0) AS total_credits,
         COUNT(*)                          AS events_attended
       FROM event_attendance
       WHERE student_id = ?`,
      [studentId]
    );
    return rows[0];
  },

  // ── Get student's event attendance history ────────────────────────────────
  getHistory: async (studentId) => {
    const [rows] = await db.query(
      `SELECT
         ea.*,
         e.event_name,
         e.event_date,
         e.venue,
         e.scope
       FROM event_attendance ea
       JOIN iks_events e ON ea.event_id = e.event_id
       WHERE ea.student_id = ?
       ORDER BY ea.attended_at DESC`,
      [studentId]
    );
    return rows;
  },

  // ── Get all attendees for an event (admin) ────────────────────────────────
  getEventAttendees: async (eventId) => {
    const [rows] = await db.query(
      `SELECT
         ea.*,
         u.name,
         u.email,
         st.enrollment
       FROM event_attendance ea
       JOIN students st ON ea.student_id = st.student_id
       JOIN users    u  ON st.student_id = u.user_id
       WHERE ea.event_id = ?
       ORDER BY ea.attended_at DESC`,
      [eventId]
    );
    return rows;
  },

};

export default CreditModel;