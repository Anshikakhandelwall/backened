import db from '../config/db.js';

const StudentModel = {

  // ── Get student profile ───────────────────────────────────────────────
  getProfile: async (studentId) => {
    const [rows] = await db.query(
      `SELECT
         u.user_id,
         u.name,
         u.email,
         u.role,
         u.created_at,
         s.enrollment,
         s.department,
         s.section_id,
         sec.section_name,
         sem.sem_number,
         b.branch_name,
         c.course_name
       FROM users     u
       JOIN students  s   ON u.user_id    = s.student_id
       JOIN sections  sec ON s.section_id = sec.section_id
       JOIN semesters sem ON sec.sem_id   = sem.sem_id
       JOIN branches  b   ON sem.branch_id = b.branch_id
       JOIN courses   c   ON b.course_id  = c.course_id
       WHERE u.user_id = ?`,
      [studentId]
    );
    return rows[0] || null;
  },

  // ── Get student's section_id ──────────────────────────────────────────
  getSectionId: async (studentId) => {
    const [rows] = await db.query(
      `SELECT section_id FROM students WHERE student_id = ?`,
      [studentId]
    );
    return rows[0]?.section_id || null;
  },

  // ── Get today's timetable for student's section ───────────────────────
  getTodayTimetable: async (sectionId, dayOfWeek) => {
    const [rows] = await db.query(
      `SELECT
         ts.slot_id,
         ts.start_time,
         ts.end_time,
         ts.room,
         ts.slot_type,
         s.subject_name,
         s.subject_code,
         u.name    AS teacher_name,
         la.status AS lecture_status
       FROM timetable_slots ts
       JOIN subjects  s ON ts.subject_id = s.subject_id
       JOIN teachers  t ON ts.teacher_id = t.teacher_id
       JOIN users     u ON t.teacher_id  = u.user_id
       LEFT JOIN lecture_attendance la
         ON la.slot_id      = ts.slot_id
         AND la.lecture_date = CURDATE()
       WHERE ts.section_id  = ?
         AND ts.day_of_week = ?
       ORDER BY ts.start_time ASC`,
      [sectionId, dayOfWeek]
    );
    return rows;
  },

  // ── Get weekly timetable for student's section ────────────────────────
  getWeeklyTimetable: async (sectionId) => {
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

  // ── Report teacher absence ────────────────────────────────────────────
  reportAbsence: async ({ slotId, lectureDate, reportedBy }) => {
    const [result] = await db.query(
      `INSERT INTO lecture_attendance
         (slot_id, lecture_date, status, reported_by)
       VALUES (?, ?, 'teacher_absent', ?)
       ON DUPLICATE KEY UPDATE
         status      = 'teacher_absent',
         reported_by = VALUES(reported_by)`,
      [slotId, lectureDate, reportedBy]
    );
    return result;
  },

  // ── Get events for student ────────────────────────────────────────────
  getEvents: async (studentId) => {
    const [rows] = await db.query(
      `SELECT
         e.*,
         b.branch_name,
         sec.section_name,
         ea.attended_at,
         ea.credits_earned
       FROM iks_events e
       LEFT JOIN branches  b   ON e.branch_id  = b.branch_id
       LEFT JOIN sections  sec ON e.section_id = sec.section_id
       LEFT JOIN event_attendance ea
         ON ea.event_id   = e.event_id
         AND ea.student_id = ?
       WHERE e.scope = 'university'
         OR (e.scope = 'branch' AND e.branch_id = (
               SELECT br.branch_id
               FROM   students  st
               JOIN   sections  sc  ON st.section_id = sc.section_id
               JOIN   semesters sm  ON sc.sem_id     = sm.sem_id
               JOIN   branches  br  ON sm.branch_id  = br.branch_id
               WHERE  st.student_id = ?
             ))
         OR (e.scope = 'section' AND e.section_id = (
               SELECT section_id FROM students WHERE student_id = ?
             ))
       ORDER BY e.event_date ASC`,
      [studentId, studentId, studentId]
    );
    return rows;
  },

  // ── Get student's IKS credit summary ─────────────────────────────────
  getCreditSummary: async (studentId) => {
    const [[summary]] = await db.query(
      `SELECT
         COALESCE(SUM(ea.credits_earned), 0) AS total_credits,
         COUNT(ea.id)                         AS events_attended
       FROM event_attendance ea
       WHERE ea.student_id = ?`,
      [studentId]
    );

    const [history] = await db.query(
      `SELECT
         ea.credits_earned,
         ea.attended_at,
         e.event_name,
         e.event_date,
         e.venue,
         e.scope,
         e.credits AS event_credits
       FROM event_attendance ea
       JOIN iks_events e ON ea.event_id = e.event_id
       WHERE ea.student_id = ?
       ORDER BY ea.attended_at DESC`,
      [studentId]
    );

    return {
      total_credits:    summary.total_credits,
      events_attended:  summary.events_attended,
      required_credits: 10,
      remaining:        Math.max(0, 10 - summary.total_credits),
      history,
    };
  },

  // ── Mark event attendance ─────────────────────────────────────────────
  markEventAttendance: async (eventId, studentId, credits) => {
    const [result] = await db.query(
      `INSERT INTO event_attendance
         (event_id, student_id, credits_earned)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         credits_earned = VALUES(credits_earned),
         attended_at    = CURRENT_TIMESTAMP`,
      [eventId, studentId, credits]
    );
    return result;
  },

  // ── Get notifications for student ─────────────────────────────────────
  getNotifications: async (studentId) => {
    const [rows] = await db.query(
      `SELECT *
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [studentId]
    );
    return rows;
  },

  // ── Mark notification as read ─────────────────────────────────────────
  markNotificationRead: async (notifId, studentId) => {
    await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE notif_id = ? AND user_id = ?`,
      [notifId, studentId]
    );
  },

  // ── Get upcoming substitutions for student's section ──────────────────
  getSectionSubstitutions: async (sectionId) => {
    const [rows] = await db.query(
      `SELECT
         sub.sub_date,
         sub.reason,
         ts.start_time,
         ts.end_time,
         ts.room,
         s.subject_name,
         u_orig.name AS original_teacher,
         u_sub.name  AS substitute_teacher
       FROM substitutions sub
       JOIN timetable_slots ts    ON sub.slot_id               = ts.slot_id
       JOIN subjects         s    ON ts.subject_id             = s.subject_id
       JOIN users         u_orig  ON sub.original_teacher_id   = u_orig.user_id
       JOIN users         u_sub   ON sub.substitute_teacher_id = u_sub.user_id
       WHERE ts.section_id = ?
         AND sub.sub_date >= CURDATE()
       ORDER BY sub.sub_date ASC`,
      [sectionId]
    );
    return rows;
  },

};

export default StudentModel;