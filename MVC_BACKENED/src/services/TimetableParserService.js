// ── Day name detection ─────────────────────────────────────────────────
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const DAY_ALIASES = {
  'mon':  'Monday',
  'tue':  'Tuesday',
  'tues': 'Tuesday',
  'wed':  'Wednesday',
  'thu':  'Thursday',
  'thur': 'Thursday',
  'thurs':'Thursday',
  'fri':  'Friday',
  'sat':  'Saturday',
  'sun':  'Sunday',
};

// ── Time detection regex ───────────────────────────────────────────────
// Matches: 9:20, 09:20, 9.20, 9:20am, 9:20-10:10, 9AM
const TIME_REGEX = /\b(\d{1,2})[:.h](\d{0,2})\s*(am|pm)?\b/gi;

// Common university time slots — used as fallback if OCR misses times
const STANDARD_SLOTS = [
  { start: '09:20', end: '10:10' },
  { start: '10:10', end: '11:00' },
  { start: '11:00', end: '11:50' },
  { start: '11:50', end: '12:40' },
  { start: '13:40', end: '14:30' },
  { start: '14:30', end: '15:20' },
  { start: '08:00', end: '09:00' },
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '12:00', end: '13:00' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
];

// ── Normalise time string to HH:MM ────────────────────────────────────
const normaliseTime = (raw) => {
  if (!raw) return null;
  const cleaned = raw.replace(/\s/g, '').toLowerCase();

  // Already HH:MM
  if (/^\d{2}:\d{2}$/.test(cleaned)) return cleaned;

  const match = cleaned.match(/^(\d{1,2})[:.h]?(\d{0,2})(am|pm)?$/);
  if (!match) return null;

  let hours   = parseInt(match[1], 10);
  let minutes = parseInt(match[2] || '0', 10);
  const ampm  = match[3];

  if (ampm === 'pm' && hours < 12) hours += 12;
  if (ampm === 'am' && hours === 12) hours = 0;

  return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`;
};

// ── Find closest standard slot ─────────────────────────────────────────
const findClosestSlot = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const minutes = h * 60 + m;

  let closest = null;
  let minDiff = Infinity;

  for (const slot of STANDARD_SLOTS) {
    const [sh, sm] = slot.start.split(':').map(Number);
    const slotMin  = sh * 60 + sm;
    const diff     = Math.abs(slotMin - minutes);
    if (diff < minDiff && diff <= 30) { // within 30 minutes
      minDiff = diff;
      closest = slot;
    }
  }
  return closest;
};

// ── Detect slot type from subject name ────────────────────────────────
const detectSlotType = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('lab') || lower.includes('practical') || lower.includes('workshop'))
    return 'lab';
  if (lower.includes('tutorial') || lower.includes('tut'))
    return 'tutorial';
  return 'lecture';
};

// ── Main parser ────────────────────────────────────────────────────────
export const parseTimetableText = (rawText) => {
  const lines  = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const slots  = [];

  // Strategy 1: Row-based parsing
  // Detects if each line starts with a day name
  const rowBased = parseRowBased(lines);
  if (rowBased.length > 0) return rowBased;

  // Strategy 2: Column-based parsing
  // Detects time slots as column headers, days as row headers
  const colBased = parseColumnBased(lines);
  if (colBased.length > 0) return colBased;

  // Strategy 3: Free-form — find any day+time+subject combo
  return parseFreeForm(lines);
};

// ── Strategy 1: Row-based ──────────────────────────────────────────────
// Format: Monday | 9:20-10:10 | Mathematics | Room 101 | Dr. Smith
const parseRowBased = (lines) => {
  const slots = [];
  let currentDay = null;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Check if line starts with a day
    const dayMatch = DAYS.find(d => lowerLine.startsWith(d.toLowerCase()))
      || Object.entries(DAY_ALIASES).find(([k]) => lowerLine.startsWith(k))?.[1];

    if (dayMatch) {
      currentDay = typeof dayMatch === 'string' ? dayMatch : dayMatch;
    }

    if (!currentDay) continue;

    // Extract times from line
    const timeMatches = [...line.matchAll(/(\d{1,2})[:.h](\d{2})\s*(am|pm)?/gi)];

    if (timeMatches.length >= 2) {
      const startRaw = normaliseTime(timeMatches[0][0]);
      const endRaw   = normaliseTime(timeMatches[1][0]);

      if (!startRaw || !endRaw) continue;

      // Extract subject — everything between time and room/teacher info
      const afterTimes = line.replace(/\d{1,2}[:.h]\d{2}\s*(am|pm)?/gi, '|').split('|');
      const subjectPart = afterTimes.find(p => p.trim().length > 3 && !/^\s*[-|]\s*$/.test(p));
      const subjectName = subjectPart ? subjectPart.replace(/[|]/g, '').trim() : '';

      if (subjectName.length < 2) continue;

      slots.push({
        day_of_week:  currentDay,
        start_time:   startRaw,
        end_time:     endRaw,
        subject_name: subjectName,
        room:         extractRoom(line),
        slot_type:    detectSlotType(subjectName),
        teacher_name: extractTeacher(line),
      });
    }
  }

  return slots;
};

// ── Strategy 2: Column-based ───────────────────────────────────────────
// Format: Header row = time slots, Left column = days
const parseColumnBased = (lines) => {
  const slots = [];

  // Find header row containing multiple time patterns
  let headerIdx = -1;
  let timeColumns = [];

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const times = [...lines[i].matchAll(/(\d{1,2})[:.h](\d{2})/g)];
    if (times.length >= 3) {
      headerIdx  = i;
      timeColumns = times.map(m => normaliseTime(m[0])).filter(Boolean);
      break;
    }
  }

  if (headerIdx === -1 || timeColumns.length === 0) return [];

  // Process rows after header
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if line starts with a day
    let currentDay = null;
    for (const day of DAYS) {
      if (line.toLowerCase().startsWith(day.toLowerCase())) {
        currentDay = day;
        break;
      }
    }
    for (const [alias, day] of Object.entries(DAY_ALIASES)) {
      if (line.toLowerCase().startsWith(alias)) {
        currentDay = day;
        break;
      }
    }

    if (!currentDay) continue;

    // Split by common delimiters — tab, multiple spaces, pipe
    const cells = line
      .replace(currentDay, '')
      .split(/\t|\s{2,}|\|/)
      .map(c => c.trim())
      .filter(c => c.length > 1 && !/^\d{1,2}[:.]\d{2}$/.test(c));

    cells.forEach((cell, idx) => {
      if (idx >= timeColumns.length) return;
      if (!cell || cell === '-' || cell === '—' || cell === 'break' ||
          cell.toLowerCase() === 'break') return;

      const startTime = timeColumns[idx];
      const slot      = findClosestSlot(startTime);
      const endTime   = slot ? slot.end : timeColumns[idx + 1] || '';

      if (!startTime || !endTime) return;

      slots.push({
        day_of_week:  currentDay,
        start_time:   startTime,
        end_time:     endTime,
        subject_name: cell,
        room:         extractRoom(cell),
        slot_type:    detectSlotType(cell),
        teacher_name: '',
      });
    });
  }

  return slots;
};

// ── Strategy 3: Free-form ──────────────────────────────────────────────
const parseFreeForm = (lines) => {
  const slots = [];
  let currentDay = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect day
    for (const day of DAYS) {
      if (line.toLowerCase().includes(day.toLowerCase())) {
        currentDay = day;
        break;
      }
    }
    for (const [alias, day] of Object.entries(DAY_ALIASES)) {
      if (new RegExp(`\\b${alias}\\b`, 'i').test(line)) {
        currentDay = day;
        break;
      }
    }

    if (!currentDay) continue;

    // Look for time + subject on same or adjacent line
    const times = [...line.matchAll(/(\d{1,2})[:.h](\d{2})\s*(am|pm)?/gi)];
    if (times.length === 0) continue;

    const startRaw = normaliseTime(times[0][0]);
    const endRaw   = times[1] ? normaliseTime(times[1][0]) : null;

    if (!startRaw) continue;

    // Find subject — look in current line and next 2 lines
    const context     = [line, lines[i+1] || '', lines[i+2] || ''].join(' ');
    const subjectName = extractSubject(context);

    if (!subjectName) continue;

    // Get end time from standard slots if not found
    const matchedSlot = findClosestSlot(startRaw);
    const finalEnd    = endRaw || (matchedSlot ? matchedSlot.end : '');

    if (!finalEnd) continue;

    slots.push({
      day_of_week:  currentDay,
      start_time:   startRaw,
      end_time:     finalEnd,
      subject_name: subjectName,
      room:         extractRoom(context),
      slot_type:    detectSlotType(subjectName),
      teacher_name: extractTeacher(context),
    });
  }

  return slots;
};

// ── Helper extractors ──────────────────────────────────────────────────
const extractRoom = (text) => {
  const match = text.match(/\b(room|lab|hall|block|seminar)\s*[a-z]?\s*[-#]?\s*\d*[a-z]?\d*\b/i);
  return match ? match[0].trim() : '';
};

const extractTeacher = (text) => {
  const match = text.match(/\b(dr|prof|mr|ms|mrs|er)\.?\s+[a-z][\w\s]{2,30}/i);
  return match ? match[0].trim() : '';
};

const extractSubject = (text) => {
  // Remove times, room info, teacher titles, numbers
  const cleaned = text
    .replace(/\d{1,2}[:.h]\d{2}\s*(am|pm)?/gi, '')
    .replace(/\b(room|lab|hall|block)\s*\w*\s*\d*/gi, '')
    .replace(/\b(dr|prof|mr|ms|mrs|er)\.?\s+\w+/gi, '')
    .replace(/[|\-–—\d]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Find the longest meaningful word sequence
  const words = cleaned.split(' ').filter(w => w.length > 2);
  if (words.length === 0) return null;

  // Return first 4 words max as subject name
  return words.slice(0, 4).join(' ');
};

export default { parseTimetableText };