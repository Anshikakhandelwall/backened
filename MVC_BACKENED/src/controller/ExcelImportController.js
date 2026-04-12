import xlsx  from 'xlsx';
import bcrypt from 'bcrypt';
import db    from '../config/db.js';
import fs    from 'fs';

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

export const importStudentsFromExcel = async (req, res) => {
  try {
    if (!req.file)
      return sendError(res, 400, 'No file uploaded');

    const { section_id } = req.body;
    if (!section_id)
      return sendError(res, 400, 'section_id is required');

    // Parse Excel file
    const workbook  = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet     = workbook.Sheets[sheetName];
    const rows      = xlsx.utils.sheet_to_json(sheet);

    if (!rows.length)
      return sendError(res, 400, 'Excel file is empty');

    const results = { success: [], failed: [] };

    for (const row of rows) {
      const name       = row['Name']       || row['name']       || '';
      const email      = row['Email']      || row['email']      || '';
      const enrollment = row['Enrollment'] || row['enrollment'] || '';
      const department = row['Department'] || row['department'] || '';
      const password   = row['Password']   || row['password']   || 'Welcome@123';

      if (!name || !email) {
        results.failed.push({ row: name || email, reason: 'Missing name or email' });
        continue;
      }

      try {
        // Check duplicate
        const [existing] = await db.query(
          'SELECT user_id FROM users WHERE email = ?', [email]
        );
        if (existing.length > 0) {
          results.failed.push({ row: email, reason: 'Email already exists' });
          continue;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await db.query(
          `INSERT INTO users (name, email, password, role)
           VALUES (?, ?, ?, 'student')`,
          [name, email, hashedPassword]
        );
        const userId = result.insertId;

        await db.query(
          `INSERT INTO students (student_id, section_id, enrollment, department)
           VALUES (?, ?, ?, ?)`,
          [userId, section_id, enrollment || email.split('@')[0], department]
        );

        results.success.push({ name, email });
      } catch (err) {
        results.failed.push({ row: email, reason: err.message });
      }
    }

    // Delete temp file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      message: `${results.success.length} students imported, ${results.failed.length} failed`,
      imported: results.success.length,
      failed:   results.failed.length,
      details:  results,
    });

  } catch (err) {
    console.error('importStudents error:', err);
    sendError(res, 500, 'Could not import students');
  }
};

// ── Mark event attendance from Excel ─────────────────────────────────────
export const markEventAttendanceFromExcel = async (req, res) => {
  try {
    if (!req.file)
      return sendError(res, 400, 'No file uploaded');

    const { event_id } = req.body;
    if (!event_id)
      return sendError(res, 400, 'event_id is required');

    // Get event credits
    const [events] = await db.query(
      'SELECT credits FROM iks_events WHERE event_id = ?', [event_id]
    );
    if (!events.length)
      return sendError(res, 404, 'Event not found');

    const credits = events[0].credits;

    // Parse Excel
    const workbook  = xlsx.readFile(req.file.path);
    const sheet     = workbook.Sheets[workbook.SheetNames[0]];
    const rows      = xlsx.utils.sheet_to_json(sheet);

    if (!rows.length)
      return sendError(res, 400, 'Excel file is empty');

    const results = { success: [], failed: [] };

    for (const row of rows) {
      const enrollment = row['Enrollment'] || row['enrollment'] || '';
      const email      = row['Email']      || row['email']      || '';

      try {
        // Find student by enrollment or email
        let query, param;
        if (enrollment) {
          query = `SELECT s.student_id FROM students s WHERE s.enrollment = ?`;
          param = enrollment;
        } else if (email) {
          query = `SELECT s.student_id FROM students s
                   JOIN users u ON s.student_id = u.user_id
                   WHERE u.email = ?`;
          param = email;
        } else {
          results.failed.push({ row: JSON.stringify(row), reason: 'No enrollment or email' });
          continue;
        }

        const [students] = await db.query(query, [param]);
        if (!students.length) {
          results.failed.push({ row: enrollment || email, reason: 'Student not found' });
          continue;
        }

        const studentId = students[0].student_id;

        await db.query(
          `INSERT INTO event_attendance (event_id, student_id, credits_earned)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE
             credits_earned = VALUES(credits_earned),
             attended_at    = CURRENT_TIMESTAMP`,
          [event_id, studentId, credits]
        );

        results.success.push({ enrollment: enrollment || email });
      } catch (err) {
        results.failed.push({ row: enrollment || email, reason: err.message });
      }
    }

    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success:  true,
      message:  `${results.success.length} attendances marked, ${results.failed.length} failed`,
      marked:   results.success.length,
      failed:   results.failed.length,
      details:  results,
    });

  } catch (err) {
    console.error('markEventAttendance error:', err);
    sendError(res, 500, 'Could not process attendance');
  }
};