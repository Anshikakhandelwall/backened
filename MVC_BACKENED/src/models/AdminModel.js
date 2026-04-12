import db from '../config/db.js';

const AdminModel = {

  // ── Dashboard stats ──────────────────────────────────────────────────
  getDashboardStats: async () => {
    const [[students]]      = await db.query(`SELECT COUNT(*) AS total FROM students`);
    const [[teachers]]      = await db.query(`SELECT COUNT(*) AS total FROM teachers`);
    const [[absentToday]]   = await db.query(
      `SELECT COUNT(*) AS total FROM lecture_attendance
       WHERE lecture_date = CURDATE() AND status = 'teacher_absent'`
    );
    const [[upcomingEvents]] = await db.query(
      `SELECT COUNT(*) AS total FROM iks_events
       WHERE event_date >= CURDATE()`
    );
    const [[todayLectures]]  = await db.query(
      `SELECT COUNT(*) AS total FROM timetable_slots
       WHERE day_of_week = DAYNAME(CURDATE())`
    );

    return {
      total_students:  students.total,
      total_teachers:  teachers.total,
      absent_today:    absentToday.total,
      upcoming_events: upcomingEvents.total,
      today_lectures:  todayLectures.total,
    };
  },

  // ── Get all users ────────────────────────────────────────────────────
  getAllUsers: async () => {
    const [rows] = await db.query(
      `SELECT
         u.user_id,
         u.name,
         u.email,
         u.role,
         u.is_first_login,
         u.created_at,
         COALESCE(s.enrollment,  '')  AS enrollment,
         COALESCE(s.section_id,  0)   AS section_id,
         COALESCE(t.designation, '')  AS designation,
         COALESCE(a.role_type,   '')  AS role_type,
         COALESCE(s.department,
                  t.department,  '')  AS department
       FROM users u
       LEFT JOIN students s ON u.user_id = s.student_id
       LEFT JOIN teachers t ON u.user_id = t.teacher_id
       LEFT JOIN admins   a ON u.user_id = a.admin_id
       ORDER BY u.created_at DESC`
    );
    return rows;
  },

  // ── Get users by role ─────────────────────────────────────────────────
  getUsersByRole: async (role) => {
    const [rows] = await db.query(
      `SELECT
         u.user_id,
         u.name,
         u.email,
         u.role,
         u.created_at,
         COALESCE(s.enrollment,  '') AS enrollment,
         COALESCE(t.designation, '') AS designation,
         COALESCE(t.department,
                  s.department,  '') AS department
       FROM users u
       LEFT JOIN students s ON u.user_id = s.student_id
       LEFT JOIN teachers t ON u.user_id = t.teacher_id
       WHERE u.role = ?
       ORDER BY u.name ASC`,
      [role]
    );
    return rows;
  },

  // ── Get single user ───────────────────────────────────────────────────
  getUserById: async (userId) => {
    const [rows] = await db.query(
      `SELECT
         u.*,
         COALESCE(s.enrollment,  '') AS enrollment,
         COALESCE(s.section_id,  0)  AS section_id,
         COALESCE(t.designation, '') AS designation,
         COALESCE(a.role_type,   '') AS role_type,
         COALESCE(s.department,
                  t.department,  '') AS department
       FROM users u
       LEFT JOIN students s ON u.user_id = s.student_id
       LEFT JOIN teachers t ON u.user_id = t.teacher_id
       LEFT JOIN admins   a ON u.user_id = a.admin_id
       WHERE u.user_id = ?`,
      [userId]
    );
    return rows[0] || null;
  },

  // ── Delete user ───────────────────────────────────────────────────────
  deleteUser: async (userId) => {
    const [result] = await db.query(
      `DELETE FROM users WHERE user_id = ?`,
      [userId]
    );
    return result.affectedRows;
  },

  // ── Get all teachers (for dropdowns) ─────────────────────────────────
  getAllTeachers: async () => {
    const [rows] = await db.query(
      `SELECT
         t.teacher_id,
         u.name,
         u.email,
         t.department,
         t.designation
       FROM teachers t
       JOIN users u ON t.teacher_id = u.user_id
       ORDER BY u.name ASC`
    );
    return rows;
  },

  // ── Get all sections (for dropdowns) ─────────────────────────────────
  getAllSections: async () => {
    const [rows] = await db.query(
      `SELECT
         sec.section_id,
         sec.section_name,
         sem.sem_number,
         b.branch_name,
         c.course_name
       FROM sections  sec
       JOIN semesters sem ON sec.sem_id    = sem.sem_id
       JOIN branches  b   ON sem.branch_id = b.branch_id
       JOIN courses   c   ON b.course_id   = c.course_id
       ORDER BY b.branch_name, sem.sem_number, sec.section_name ASC`
    );
    return rows;
  },

  // ── Get all subjects (for dropdowns) ─────────────────────────────────
  getAllSubjects: async () => {
    const [rows] = await db.query(
      `SELECT
         s.subject_id,
         s.subject_name,
         s.subject_code,
         b.branch_name
       FROM subjects  s
       LEFT JOIN branches b ON s.branch_id = b.branch_id
       ORDER BY s.subject_name ASC`
    );
    return rows;
  },

  // ── Get all branches (for dropdowns) ─────────────────────────────────
  getAllBranches: async () => {
    const [rows] = await db.query(
      `SELECT
         b.branch_id,
         b.branch_name,
         c.course_name
       FROM branches b
       JOIN courses  c ON b.course_id = c.course_id
       ORDER BY b.branch_name ASC`
    );
    return rows;
  },

  // ── Create student (admin only) ───────────────────────────────────────
createStudent: async ({ name, email, hashedPassword, enrollment, department, sectionId }) => {
  const db = (await import('../config/db.js')).default;

  const [result] = await db.query(
    `INSERT INTO users (name, email, password, role)
     VALUES (?, ?, ?, 'student')`,
    [name, email, hashedPassword]
  );
  const userId = result.insertId;

  await db.query(
    `INSERT INTO students (student_id, section_id, enrollment, department)
     VALUES (?, ?, ?, ?)`,
    [userId, sectionId, enrollment, department]
  );

  return userId;
},

// ── Create teacher (admin only) ───────────────────────────────────────
createTeacher: async ({ name, email, hashedPassword, department, designation }) => {
  const db = (await import('../config/db.js')).default;

  const [result] = await db.query(
    `INSERT INTO users (name, email, password, role)
     VALUES (?, ?, ?, 'teacher')`,
    [name, email, hashedPassword]
  );
  const userId = result.insertId;

  await db.query(
    `INSERT INTO teachers (teacher_id, department, designation)
     VALUES (?, ?, ?)`,
    [userId, department, designation]
  );

  return userId;
},

};

export default AdminModel;