import db from '../config/db.js';

const TimetableUploadModel = {

  save: async ({ sectionId, fileName, filePath, fileType, uploadedBy }) => {
    // Delete old timetable for this section first
    await db.query(
      `DELETE FROM section_timetables WHERE section_id = ?`,
      [sectionId]
    );
    const [result] = await db.query(
      `INSERT INTO section_timetables
         (section_id, file_name, file_path, file_type, uploaded_by)
       VALUES (?, ?, ?, ?, ?)`,
      [sectionId, fileName, filePath, fileType, uploadedBy]
    );
    return result.insertId;
  },

  getBySectionId: async (sectionId) => {
    const [rows] = await db.query(
      `SELECT st.*, sec.section_name, u.name AS uploaded_by_name
       FROM section_timetables st
       JOIN sections sec ON st.section_id = sec.section_id
       JOIN users    u   ON st.uploaded_by = u.user_id
       WHERE st.section_id = ?
       ORDER BY st.uploaded_at DESC
       LIMIT 1`,
      [sectionId]
    );
    return rows[0] || null;
  },

  getAll: async () => {
    const [rows] = await db.query(
      `SELECT st.*, sec.section_name, b.branch_name,
              sem.sem_number, u.name AS uploaded_by_name
       FROM section_timetables st
       JOIN sections  sec ON st.section_id  = sec.section_id
       JOIN semesters sem ON sec.sem_id     = sem.sem_id
       JOIN branches  b   ON sem.branch_id  = b.branch_id
       JOIN users     u   ON st.uploaded_by = u.user_id
       ORDER BY st.uploaded_at DESC`
    );
    return rows;
  },

};

export default TimetableUploadModel;