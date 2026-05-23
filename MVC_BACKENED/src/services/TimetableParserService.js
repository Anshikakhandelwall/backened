// ── Period to time mapping (for numbered column timetables) ───────────
const PERIOD_TIMES = {
  '1': { start: '09:20', end: '10:10' },
  '2': { start: '10:10', end: '11:00' },
  '3': { start: '11:00', end: '11:50' },
  '4': { start: '11:50', end: '12:40' },
  '5': { start: '13:40', end: '14:30' },
  '6': { start: '14:30', end: '15:20' },
};

// ── Day name map — handles full, short, OCR-split variants ────────────
const DAY_MAP = {
  'monday':    'Monday',
  'tuesday':   'Tuesday',
  'wednesday': 'Wednesday',
  'thursday':  'Thursday',
  'friday':    'Friday',
  'saturday':  'Saturday',
  'sunday':    'Sunday',
  'mon':   'Monday',
  'tue':   'Tuesday',
  'tues':  'Tuesday',
  'wed':   'Wednesday',
  'thu':   'Thursday',
  'thur':  'Thursday',
  'thurs': 'Thursday',
  'fri':   'Friday',
  'sat':   'Saturday',
  'sun':   'Sunday',
  'mo':    'Monday',
  'tu':    'Tuesday',
  'we':    'Wednesday',
  'th':    'Thursday',
  'fr':    'Friday',
  'sa':    'Saturday',
  'm o':   'Monday',
  't u':   'Tuesday',
  'w e':   'Wednesday',
  't h':   'Thursday',
  'f r':   'Friday',
  's a':   'Saturday',
  'm':     'Monday',
  'f':     'Friday',
};

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// ── Common university time slots ───────────────────────────────────────
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

// ── Detect day from a line ─────────────────────────────────────────────
const detectDay = (line) => {
  const clean = line.trim().toLowerCase();

  for (const [key, val] of Object.entries(DAY_MAP)) {
    const escaped = key.replace(/\s+/g, '\\s*');
    const pattern = new RegExp(`^${escaped}[\\s|\\-\\|0-9]`, 'i');
    if (pattern.test(clean)) return val;
    if (clean === key) return val;
    if (clean.startsWith(key + ' ') ||
        clean.startsWith(key + '|') ||
        clean.startsWith(key + '\t')) return val;
  }

  const firstChars = clean.slice(0, 5).replace(/[\s|0-9\-]/g, '').toLowerCase();
  for (const [key, val] of Object.entries(DAY_MAP)) {
    if (key.length >= 2 && key.length <= 3 && firstChars === key) return val;
  }

  return null;
};

// ── Normalise time string to HH:MM ────────────────────────────────────
const normaliseTime = (raw) => {
  if (!raw) return null;
  const cleaned = raw.replace(/\s/g, '').toLowerCase();
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
    if (diff < minDiff && diff <= 30) { minDiff = diff; closest = slot; }
  }
  return closest;
};

// ── Detect slot type ───────────────────────────────────────────────────
const detectSlotType = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('lab') || lower.includes('practical') || lower.includes('workshop'))
    return 'lab';
  if (lower.includes('tutorial') || lower.includes('tut'))
    return 'tutorial';
  return 'lecture';
};

// ── Check if text looks like a subject name ───────────────────────────
const looksLikeSubject = (text) => {
  if (!text || text.trim().length < 3) return false;
  const t = text.trim().toLowerCase();
  const skip = ['day','time','break','lunch','slot','period','free',
                'holiday','the','and','for','with','from','to',
                'monday','tuesday','wednesday','thursday','friday','saturday'];
  if (skip.includes(t)) return false;
  if (/^[\d\s\-:.,|/\\]+$/.test(t)) return false;
  return true;
};

// ── Extract room ───────────────────────────────────────────────────────
const extractRoom = (text) => {
  const match = text.match(/\b(room|lab|hall|block|lt|cr|mg|seminar|audi)\s*[-#]?\s*[a-z0-9]{0,5}\b/i);
  return match ? match[0].trim() : '';
};

// ── Extract teacher name ───────────────────────────────────────────────
const extractTeacher = (text) => {
  const match = text.match(/\b(dr|prof|mr|ms|mrs|er)\.?\s+[a-z][\w\s]{2,30}/i);
  return match ? match[0].trim() : '';
};

// ── Extract teacher after a subject match position ────────────────────
const extractTeacherForSubject = (text, fromIndex) => {
  const snippet = text.slice(fromIndex, fromIndex + 120);
  const match   = snippet.match(/\b(dr|prof|mr|ms|mrs|er)\.?\s+[a-z][\w\s]{2,25}/i);
  return match ? match[0].trim() : '';
};

// ── Extract subject from messy text ──────────────────────────────────
const extractSubject = (text) => {
  const cleaned = text
    .replace(/\d{1,2}[:.h]\d{2}\s*(am|pm)?/gi, '')
    .replace(/\b(room|lab|hall|block)\s*\w*\s*\d*/gi, '')
    .replace(/\b(dr|prof|mr|ms|mrs|er)\.?\s+\w+/gi, '')
    .replace(/[|\-–—\d]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleaned.split(' ').filter(w => w.length > 2);
  if (words.length === 0) return null;
  return words.slice(0, 4).join(' ');
};

// ── Remove duplicates ─────────────────────────────────────────────────
const deduplicate = (slots) => {
  const seen = new Set();
  return slots.filter(s => {
    const key = `${s.day_of_week}_${s.start_time}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════
export const parseTimetableText = (rawText) => {
  console.log('\n=== Parser Input (first 600 chars) ===');
  console.log(rawText.slice(0, 600));
  console.log('======================================\n');

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const strategies = [
    { name: 'Numbered-columns', fn: () => strategyNumberedColumns(lines, rawText) },
    { name: 'Row-based',        fn: () => strategyRowBased(lines)                 },
    { name: 'Column-based',     fn: () => strategyColumnBased(lines)              },
    { name: 'Grid-based',       fn: () => strategyGrid(rawText)                   },
    { name: 'Free-form',        fn: () => strategyFreeForm(lines)                 },
  ];

  for (const { name, fn } of strategies) {
    try {
      const result = fn();
      if (result.length > 0) {
        console.log(`✓ Strategy "${name}" found ${result.length} slots`);
        return deduplicate(result);
      }
      console.log(`✗ Strategy "${name}" found 0 slots`);
    } catch (err) {
      console.log(`✗ Strategy "${name}" errored: ${err.message}`);
    }
  }

  console.log('✗ All strategies failed');
  return [];
};

// ── Strategy 0: Numbered period columns ───────────────────────────────
// Handles timetables where columns are periods 1-6 with subjects like
// "DESIGN THINKING(CSP201)", "Computer System Organization(CSL0206)"
const strategyNumberedColumns = (lines, rawText) => {
  const slots = [];

  // Step 1: Group lines by day
  const dayBlocks = {};
  let   curDay    = null;

  for (let i = 0; i < lines.length; i++) {
    const day = detectDay(lines[i]);
    if (day) {
      curDay = day;
      if (!dayBlocks[curDay]) dayBlocks[curDay] = [];
    }
    if (curDay) dayBlocks[curDay].push(lines[i]);
  }

  if (Object.keys(dayBlocks).length === 0) return [];

  // Step 2: For each day block, join all lines and extract subjects
  for (const [day, dayLines] of Object.entries(dayBlocks)) {
    // Join all lines for this day — subjects may span multiple lines
    const fullText = dayLines.join(' ');

    // Match "SubjectName(CODE)" — code is 2-4 letters + 3-6 digits
    const subjectPattern = /([A-Za-z][A-Za-z0-9\s\-]{1,50}?)\(([A-Z]{2,4}[0O]?\d{3,6})\)/g;
    const matches = [...fullText.matchAll(subjectPattern)];

    if (matches.length === 0) continue;

    const assignedPeriods = new Set();

    matches.forEach((m) => {
      // Find next available period
      let periodNum = 1;
      while (assignedPeriods.has(periodNum) && periodNum <= 6) periodNum++;
      const times = PERIOD_TIMES[String(periodNum)];
      if (!times) return;

      // Clean subject name — remove OCR noise at start
      let name = m[1]
        .replace(/\s+/g, ' ')
        .replace(/[|\\]/g, '')
        .trim();

      // Remove short noise fragments at beginning (OCR artifacts)
      name = name.replace(/^[\s\w]{1,3}\s+/i, '').trim();

      if (name.length < 3) return;

      const code        = m[2];
      const subjectName = `${name}(${code})`;

      assignedPeriods.add(periodNum);

      slots.push({
        day_of_week:  day,
        start_time:   times.start,
        end_time:     times.end,
        subject_name: subjectName,
        room:         'MG-503',
        slot_type:    detectSlotType(name),
        teacher_name: extractTeacherForSubject(fullText, m.index + m[0].length),
      });
    });
  }

  return slots;
};

// ── Strategy 1: Row-based ──────────────────────────────────────────────
const strategyRowBased = (lines) => {
  const slots = [];
  let currentDay = null;

  for (const line of lines) {
    const day = detectDay(line);
    if (day) currentDay = day;
    if (!currentDay) continue;

    const timeMatches = [...line.matchAll(/(\d{1,2})[:.h](\d{2})\s*(am|pm)?/gi)];
    if (timeMatches.length < 2) continue;

    const startRaw = normaliseTime(timeMatches[0][0]);
    const endRaw   = normaliseTime(timeMatches[1][0]);
    if (!startRaw || !endRaw) continue;

    const afterTimes  = line.replace(/\d{1,2}[:.h]\d{2}\s*(am|pm)?/gi, '|').split('|');
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

  return slots;
};

// ── Strategy 2: Column-based ───────────────────────────────────────────
const strategyColumnBased = (lines) => {
  const slots = [];
  let headerIdx   = -1;
  let timeColumns = [];

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const times = [...lines[i].matchAll(/(\d{1,2})[:.h](\d{2})/g)];
    if (times.length >= 3) {
      headerIdx   = i;
      timeColumns = times.map(m => normaliseTime(m[0])).filter(Boolean);
      break;
    }
  }

  if (headerIdx === -1 || timeColumns.length === 0) return [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line       = lines[i].trim();
    if (!line) continue;
    const currentDay = detectDay(line);
    if (!currentDay) continue;

    let cells = [];
    if (line.includes('\t'))     cells = line.split('\t');
    else if (line.includes('|')) cells = line.split('|');
    else                         cells = line.split(/\s{2,}/);

    cells = cells.map(c => c.trim()).filter(c => c.length > 0);
    if (cells[0] && detectDay(cells[0])) cells.shift();

    cells.forEach((cell, idx) => {
      if (idx >= timeColumns.length) return;
      const clean = cell.replace(/[-—]/g, '').trim();
      if (!looksLikeSubject(clean)) return;
      if (['break','lunch'].includes(clean.toLowerCase())) return;

      const start = timeColumns[idx];
      const end   = timeColumns[idx + 1] || findClosestSlot(start)?.end || '';
      if (!start || !end) return;

      slots.push({
        day_of_week:  currentDay,
        start_time:   start,
        end_time:     end,
        subject_name: clean,
        room:         extractRoom(cell),
        slot_type:    detectSlotType(clean),
        teacher_name: '',
      });
    });
  }

  return slots;
};

// ── Strategy 3: Grid-based ────────────────────────────────────────────
const strategyGrid = (rawText) => {
  const slots = [];
  const lines  = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const allTimes = [...new Set(
    [...rawText.matchAll(/\b(\d{1,2})[:.h](\d{2})\b/g)]
      .map(m => normaliseTime(m[0]))
      .filter(t => t && t >= '08:00' && t <= '18:00')
  )].sort();

  if (allTimes.length < 2) return [];

  let currentDay = null;

  for (const line of lines) {
    const day = detectDay(line);
    if (day) currentDay = day;
    if (!currentDay) continue;

    const timeMatch = line.match(/\b(\d{1,2})[:.h](\d{2})\b/);
    if (!timeMatch) continue;

    const start = normaliseTime(timeMatch[0]);
    if (!start) continue;

    const afterTime = line.slice(line.indexOf(timeMatch[0]) + timeMatch[0].length);
    const subjParts = afterTime.replace(/\d{1,2}[:.h]\d{2}/g, '').replace(/[|\-–—]/g, ' ').trim();
    if (!looksLikeSubject(subjParts)) continue;

    const endIdx = allTimes.indexOf(start);
    const end    = endIdx >= 0 && endIdx < allTimes.length - 1
      ? allTimes[endIdx + 1]
      : findClosestSlot(start)?.end || '';
    if (!end) continue;

    slots.push({
      day_of_week:  currentDay,
      start_time:   start,
      end_time:     end,
      subject_name: subjParts.slice(0, 60),
      room:         extractRoom(line),
      slot_type:    detectSlotType(subjParts),
      teacher_name: '',
    });
  }

  return slots;
};

// ── Strategy 4: Free-form ─────────────────────────────────────────────
const strategyFreeForm = (lines) => {
  const slots  = [];
  let   curDay = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const day  = detectDay(line);
    if (day) curDay = day;
    if (!curDay) continue;

    const times = [...line.matchAll(/\b(\d{1,2})[:.h](\d{2})\s*(am|pm)?\b/gi)]
      .map(m => normaliseTime(m[0])).filter(Boolean);
    if (times.length === 0) continue;

    const context = [line, lines[i+1]||'', lines[i+2]||''].join(' ');
    const subjRaw = context
      .replace(/\d{1,2}[:.h]\d{2}\s*(am|pm)?/gi, ' ')
      .replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, ' ')
      .replace(/[|\-–—\d]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = subjRaw.split(' ').filter(w => w.length > 3).slice(0, 5);
    if (words.length === 0) continue;

    const subj  = words.join(' ');
    const start = times[0];
    const end   = times[1] || findClosestSlot(start)?.end || '';
    if (!end) continue;

    slots.push({
      day_of_week:  curDay,
      start_time:   start,
      end_time:     end,
      subject_name: subj,
      room:         extractRoom(context),
      slot_type:    detectSlotType(subj),
      teacher_name: '',
    });
  }

  return slots;
};

export default { parseTimetableText };