
import db from '../config/db.js';

export const createSlotsFromParsed = async (parsedSlots, sectionId) => {
  const results = { created: [], failed: [], skipped: [] };

  // ── Delete existing slots for this section first ───────────────────
  await db.query(
    `DELETE FROM timetable_slots WHERE section_id = ?`,
    [sectionId]
  );
  console.log(`Cleared old slots for section ${sectionId}`);

  for (const slot of parsedSlots) {
    try {
      // ── Step 1: Find subject by code in DB ──────────────────────────
      let subjectId   = null;
      let subjectName = slot.subject_name;
      const code      = slot.subject_code || slot.subject_name;

      // Try exact code match first
      const [exactMatch] = await db.query(
        `SELECT subject_id, subject_name FROM subjects
         WHERE UPPER(subject_code) = UPPER(?)
         LIMIT 1`,
        [code]
      );

      if (exactMatch.length > 0) {
        subjectId   = exactMatch[0].subject_id;
        subjectName = exactMatch[0].subject_name;
        console.log(`✓ Code ${code} → ${subjectName}`);
      } else {
        // Try partial code match (handles OCR variants like CSL020 vs CSL0205)
        const [partialMatch] = await db.query(
          `SELECT subject_id, subject_name FROM subjects
           WHERE UPPER(subject_code) LIKE UPPER(?)
              OR UPPER(subject_code) LIKE UPPER(?)
           LIMIT 1`,
          [`%${code}%`, `${code.slice(0, -1)}%`]
        );

        if (partialMatch.length > 0) {
          subjectId   = partialMatch[0].subject_id;
          subjectName = partialMatch[0].subject_name;
          console.log(`✓ Partial match ${code} → ${subjectName}`);
        } else {
          // Try matching by subject name containing the code
          const [nameMatch] = await db.query(
            `SELECT subject_id, subject_name FROM subjects
             WHERE UPPER(subject_name) LIKE UPPER(?)
             LIMIT 1`,
            [`%${code}%`]
          );

          if (nameMatch.length > 0) {
            subjectId   = nameMatch[0].subject_id;
            subjectName = nameMatch[0].subject_name;
            console.log(`✓ Name match ${code} → ${subjectName}`);
          } else {
            // Not in DB — create it with the code as both name and code
            console.log(`⚠ Code ${code} not found in DB — creating new subject`);
            const [newSub] = await db.query(
              `INSERT INTO subjects (subject_name, subject_code)
               VALUES (?, ?)
               ON DUPLICATE KEY UPDATE subject_id = LAST_INSERT_ID(subject_id)`,
              [code, code]
            );
            subjectId   = newSub.insertId;
            subjectName = code;
          }
        }
      }

      // ── Step 2: Find teacher ────────────────────────────────────────
      let teacherId = null;

      if (slot.teacher_name && slot.teacher_name.trim().length > 2) {
        const cleanName = slot.teacher_name
          .replace(/^(dr|prof|mr|ms|mrs|er)\.?\s*/i, '')
          .trim();

        const [teachers] = await db.query(
          `SELECT t.teacher_id
           FROM teachers t
           JOIN users u ON t.teacher_id = u.user_id
           WHERE LOWER(u.name) LIKE LOWER(?)
           LIMIT 1`,
          [`%${cleanName}%`]
        );
        if (teachers.length) teacherId = teachers[0].teacher_id;
      }

      // Fall back to any teacher in system
      if (!teacherId) {
        const [any] = await db.query(`SELECT teacher_id FROM teachers LIMIT 1`);
        if (any.length) teacherId = any[0].teacher_id;
      }

      if (!teacherId) {
        results.failed.push({ ...slot, reason: 'No teachers in system' });
        continue;
      }

      // ── Step 3: Insert slot ─────────────────────────────────────────
      await db.query(
        `INSERT INTO timetable_slots
           (section_id, subject_id, teacher_id, day_of_week,
            start_time, end_time, room, slot_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sectionId,
          subjectId,
          teacherId,
          slot.day_of_week,
          slot.start_time,
          slot.end_time,
          slot.room || null,
          slot.slot_type || 'lecture',
        ]
      );

      results.created.push({ ...slot, subject_name: subjectName });
      console.log(`✓ Created: ${slot.day_of_week} ${slot.start_time} ${subjectName}`);

    } catch (err) {
      console.error('Slot error:', err.message);
      results.failed.push({ ...slot, reason: err.message });
    }
  }

  return results;
};