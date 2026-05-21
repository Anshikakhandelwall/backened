import db from '../config/db.js';

// ── Match parsed slots against DB and create timetable_slots rows ──────
export const createSlotsFromParsed = async (parsedSlots, sectionId) => {
  const results = { created: [], failed: [], skipped: [] };

  for (const slot of parsedSlots) {
    try {
      // ── Find or create subject ───────────────────────────────────
      let subjectId = await findSubject(slot.subject_name);
      if (!subjectId) {
        subjectId = await createSubject(slot.subject_name);
      }

      // ── Find teacher if name given ───────────────────────────────
      let teacherId = null;
      if (slot.teacher_name && slot.teacher_name.trim().length > 2) {
        teacherId = await findTeacher(slot.teacher_name);
      }

      // ── Fall back to any available teacher ───────────────────────
      if (!teacherId) {
        const [rows] = await db.query(
          `SELECT teacher_id FROM teachers LIMIT 1`
        );
        if (rows.length) teacherId = rows[0].teacher_id;
      }

      if (!teacherId) {
        results.failed.push({
          ...slot,
          reason: 'No teachers in system — register at least one teacher first',
        });
        continue;
      }

      // ── Check if slot already exists ─────────────────────────────
      const [existing] = await db.query(
        `SELECT slot_id FROM timetable_slots
         WHERE section_id  = ?
           AND day_of_week = ?
           AND start_time  = ?`,
        [sectionId, slot.day_of_week, slot.start_time]
      );

      if (existing.length) {
        results.skipped.push({ ...slot, reason: 'Slot already exists for this time' });
        continue;
      }

      // ── Create slot ───────────────────────────────────────────────
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
          slot.end_time   || addOneHour(slot.start_time),
          slot.room       || null,
          slot.slot_type  || 'lecture',
        ]
      );

      results.created.push(slot);
      console.log(`✓ Created: ${slot.day_of_week} ${slot.start_time} ${slot.subject_name}`);

    } catch (err) {
      console.error('Slot error:', err.message, slot);
      results.failed.push({ ...slot, reason: err.message });
    }
  }

  return results;
};

// ── Find subject by partial name match ────────────────────────────────
const findSubject = async (name) => {
  const cleaned = name.trim();
  const [rows]  = await db.query(
    `SELECT subject_id FROM subjects
     WHERE LOWER(subject_name) LIKE LOWER(?)
        OR LOWER(subject_code) LIKE LOWER(?)
     LIMIT 1`,
    [`%${cleaned}%`, `%${cleaned.slice(0,6)}%`]
  );
  return rows[0]?.subject_id || null;
};

// ── Create subject if not found ───────────────────────────────────────
const createSubject = async (name) => {
  const code = name
    .replace(/\s+/g, '')
    .toUpperCase()
    .slice(0, 8);

  // Use INSERT IGNORE to avoid duplicate code errors
  const [result] = await db.query(
    `INSERT INTO subjects (subject_name, subject_code)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE subject_id = LAST_INSERT_ID(subject_id)`,
    [name.trim(), code + '_' + Date.now().toString().slice(-4)]
  );
  return result.insertId;
};

// ── Find teacher by partial name match ────────────────────────────────
const findTeacher = async (name) => {
  const cleaned = name.replace(/^(dr|prof|mr|ms|mrs|er)\.?\s*/i, '').trim();
  const [rows]  = await db.query(
    `SELECT t.teacher_id
     FROM teachers t
     JOIN users u ON t.teacher_id = u.user_id
     WHERE LOWER(u.name) LIKE LOWER(?)
     LIMIT 1`,
    [`%${cleaned}%`]
  );
  return rows[0]?.teacher_id || null;
};

// ── Add one hour to a HH:MM string ───────────────────────────────────
const addOneHour = (time) => {
  if (!time) return '10:00';
  const [h, m] = time.split(':').map(Number);
  return `${String((h + 1) % 24).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
};