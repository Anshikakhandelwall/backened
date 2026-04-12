import db from '../config/db.js';

const ManageModel = {

  // ── SCHOOLS ───────────────────────────────────────────────────────────
  getAllSchools: async () => {
    const [rows] = await db.query(
      `SELECT * FROM schools ORDER BY school_id ASC`
    );
    return rows;
  },

  createSchool: async (schoolName) => {
    const [result] = await db.query(
      `INSERT INTO schools (school_name) VALUES (?)`,
      [schoolName]
    );
    return result.insertId;
  },

  deleteSchool: async (schoolId) => {
    await db.query(`DELETE FROM schools WHERE school_id = ?`, [schoolId]);
  },

  // ── COURSES ───────────────────────────────────────────────────────────
  getAllCourses: async () => {
    const [rows] = await db.query(
      `SELECT c.*, s.school_name
       FROM courses c
       JOIN schools s ON c.school_id = s.school_id
       ORDER BY c.course_id ASC`
    );
    return rows;
  },

  createCourse: async (courseName, schoolId) => {
    const [result] = await db.query(
      `INSERT INTO courses (course_name, school_id) VALUES (?, ?)`,
      [courseName, schoolId]
    );
    return result.insertId;
  },

  deleteCourse: async (courseId) => {
    await db.query(`DELETE FROM courses WHERE course_id = ?`, [courseId]);
  },

  // ── BRANCHES ──────────────────────────────────────────────────────────
  getAllBranches: async () => {
    const [rows] = await db.query(
      `SELECT b.*, c.course_name
       FROM branches b
       JOIN courses c ON b.course_id = c.course_id
       ORDER BY b.branch_id ASC`
    );
    return rows;
  },

  createBranch: async (branchName, courseId) => {
    const [result] = await db.query(
      `INSERT INTO branches (branch_name, course_id) VALUES (?, ?)`,
      [branchName, courseId]
    );
    return result.insertId;
  },

  deleteBranch: async (branchId) => {
    await db.query(`DELETE FROM branches WHERE branch_id = ?`, [branchId]);
  },

  // ── SEMESTERS ─────────────────────────────────────────────────────────
  getAllSemesters: async () => {
    const [rows] = await db.query(
      `SELECT sem.*, b.branch_name
       FROM semesters sem
       JOIN branches b ON sem.branch_id = b.branch_id
       ORDER BY b.branch_name ASC, sem.sem_number ASC`
    );
    return rows;
  },

  createSemester: async (semNumber, branchId) => {
    const [result] = await db.query(
      `INSERT INTO semesters (sem_number, branch_id) VALUES (?, ?)`,
      [semNumber, branchId]
    );
    return result.insertId;
  },

  deleteSemester: async (semId) => {
    await db.query(`DELETE FROM semesters WHERE sem_id = ?`, [semId]);
  },

  // ── SECTIONS ──────────────────────────────────────────────────────────
  getAllSections: async () => {
    const [rows] = await db.query(
      `SELECT sec.*, sem.sem_number, b.branch_name
       FROM sections  sec
       JOIN semesters sem ON sec.sem_id    = sem.sem_id
       JOIN branches  b   ON sem.branch_id = b.branch_id
       ORDER BY b.branch_name ASC, sem.sem_number ASC, sec.section_name ASC`
    );
    return rows;
  },

  createSection: async (sectionName, semId) => {
    const [result] = await db.query(
      `INSERT INTO sections (section_name, sem_id) VALUES (?, ?)`,
      [sectionName, semId]
    );
    return result.insertId;
  },

  deleteSection: async (sectionId) => {
    await db.query(`DELETE FROM sections WHERE section_id = ?`, [sectionId]);
  },

  // ── SUBJECTS ──────────────────────────────────────────────────────────
  getAllSubjects: async () => {
    const [rows] = await db.query(
      `SELECT s.*, b.branch_name, sem.sem_number
       FROM subjects  s
       LEFT JOIN branches  b   ON s.branch_id = b.branch_id
       LEFT JOIN semesters sem ON s.sem_id    = sem.sem_id
       ORDER BY s.subject_name ASC`
    );
    return rows;
  },

  createSubject: async (subjectName, subjectCode, branchId, semId) => {
    const [result] = await db.query(
      `INSERT INTO subjects (subject_name, subject_code, branch_id, sem_id)
       VALUES (?, ?, ?, ?)`,
      [subjectName, subjectCode, branchId, semId]
    );
    return result.insertId;
  },

  deleteSubject: async (subjectId) => {
    await db.query(`DELETE FROM subjects WHERE subject_id = ?`, [subjectId]);
  },

};

export default ManageModel;