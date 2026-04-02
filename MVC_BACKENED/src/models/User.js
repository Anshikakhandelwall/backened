import db from '../config/db.js';

const UserModel = {

  findByEmail: async (email) => {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );
    return rows[0] || null;
  },

  findById: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE user_id = ?', [userId]
    );
    return rows[0] || null;
  },

  createUser: async ({ name, email, hashedPassword, role }) => {
    const [result] = await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, role]
    );
    return result.insertId;
  },

  createStudent: async ({ userId, section_id, enrollment, department }) => {
    await db.query(
      `INSERT INTO students (student_id, section_id, enrollment, department)
       VALUES (?, ?, ?, ?)`,
      [userId, section_id, enrollment, department]
    );
  },

  createTeacher: async ({ userId, department, designation }) => {
    await db.query(
      `INSERT INTO teachers (teacher_id, department, designation)
       VALUES (?, ?, ?)`,
      [userId, department, designation]
    );
  },

  createAdmin: async ({ userId, role_type }) => {
    await db.query(
      `INSERT INTO admins (admin_id, role_type) VALUES (?, ?)`,
      [userId, role_type]
    );
  },

  saveOTP: async ({ email, otp, expiry }) => {
    await db.query(
      `UPDATE users SET otp_code = ?, otp_expiry = ? WHERE email = ?`,
      [otp, expiry, email]
    );
  },

  clearOTP: async (email) => {
    await db.query(
      `UPDATE users SET otp_code = NULL, otp_expiry = NULL WHERE email = ?`,
      [email]
    );
  },

  updatePassword: async ({ email, hashedPassword }) => {
    await db.query(
      `UPDATE users
       SET password = ?, otp_code = NULL, otp_expiry = NULL, is_first_login = FALSE
       WHERE email = ?`,
      [hashedPassword, email]
    );
  },

  markFirstLoginDone: async (userId) => {
    await db.query(
      `UPDATE users SET is_first_login = FALSE WHERE user_id = ?`,
      [userId]
    );
  },
};

export default UserModel;