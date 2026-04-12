
import db from '../config/db.js';

const PushModel = {

  // ── Save subscription ──────────────────────────────────────────────
  save: async (userId, subscription) => {
    await db.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         endpoint = VALUES(endpoint),
         p256dh   = VALUES(p256dh),
         auth     = VALUES(auth)`,
      [
        userId,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth,
      ]
    );
  },

  // ── Delete subscription ────────────────────────────────────────────
  delete: async (userId) => {
    await db.query(
      `DELETE FROM push_subscriptions WHERE user_id = ?`,
      [userId]
    );
  },

  // ── Get subscriptions by section ───────────────────────────────────
  getBySection: async (sectionId) => {
    const [rows] = await db.query(
      `SELECT ps.*
       FROM push_subscriptions ps
       JOIN students s ON ps.user_id = s.student_id
       WHERE s.section_id = ?`,
      [sectionId]
    );
    return rows;
  },

  // ── Get subscription by user ───────────────────────────────────────
  getByUser: async (userId) => {
    const [rows] = await db.query(
      `SELECT * FROM push_subscriptions WHERE user_id = ?`,
      [userId]
    );
    return rows[0] || null;
  },

  // ── Get all teacher subscriptions ──────────────────────────────────
  getByTeacher: async (teacherId) => {
    const [rows] = await db.query(
      `SELECT * FROM push_subscriptions WHERE user_id = ?`,
      [teacherId]
    );
    return rows[0] || null;
  },

};

export default PushModel;