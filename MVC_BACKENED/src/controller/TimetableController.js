import TimetableModel from '../models/TimetableModel.js';

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

const DAYS = ['Sunday','Monday','Tuesday','Wednesday',
              'Thursday','Friday','Saturday'];

// ── Teacher: today's lectures ────────────────────────────────────────────
export const getTeacherToday = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const dayOfWeek = DAYS[new Date().getDay()];

    const teacher = await TimetableModel.getTeacherByUserId(teacherId);
    if (!teacher)
      return sendError(res, 404, 'Teacher profile not found');

    const lectures = await TimetableModel.getTodayByTeacher(teacherId, dayOfWeek);

    res.status(200).json({
      success: true,
      day:     dayOfWeek,
      data:    lectures,
    });

  } catch (err) {
    console.error('getTeacherToday error:', err);
    sendError(res, 500, 'Could not fetch today\'s timetable');
  }
};

// ── Teacher: full weekly timetable ───────────────────────────────────────
export const getTeacherWeekly = async (req, res) => {
  try {
    const teacherId = req.user.userId;

    const teacher = await TimetableModel.getTeacherByUserId(teacherId);
    if (!teacher)
      return sendError(res, 404, 'Teacher profile not found');

    const lectures = await TimetableModel.getWeeklyByTeacher(teacherId);

    res.status(200).json({
      success: true,
      data:    lectures,
    });

  } catch (err) {
    console.error('getTeacherWeekly error:', err);
    sendError(res, 500, 'Could not fetch weekly timetable');
  }
};

// ── Student: today's lectures ────────────────────────────────────────────
export const getStudentToday = async (req, res) => {
  try {
    const userId    = req.user.userId;
    const dayOfWeek = DAYS[new Date().getDay()];

    const sectionId = await TimetableModel.getStudentSection(userId);
    if (!sectionId)
      return sendError(res, 404, 'Student section not found');

    const lectures = await TimetableModel.getTodayBySection(sectionId, dayOfWeek);

    res.status(200).json({
      success: true,
      day:     dayOfWeek,
      data:    lectures,
    });

  } catch (err) {
    console.error('getStudentToday error:', err);
    sendError(res, 500, 'Could not fetch today\'s timetable');
  }
};

// ── Student: full weekly timetable ───────────────────────────────────────
export const getStudentWeekly = async (req, res) => {
  try {
    const userId = req.user.userId;

    const sectionId = await TimetableModel.getStudentSection(userId);
    if (!sectionId)
      return sendError(res, 404, 'Student section not found');

    const lectures = await TimetableModel.getWeeklyBySection(sectionId);

    res.status(200).json({
      success: true,
      data:    lectures,
    });

  } catch (err) {
    console.error('getStudentWeekly error:', err);
    sendError(res, 500, 'Could not fetch weekly timetable');
  }
};