import LectureAttendanceModel from '../models/LectureAttendanceModel.js';
import TimetableModel         from '../models/TimetableModel.js';

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

// ── Mark lecture status ──────────────────────────────────────────────────
export const markStatus = async (req, res) => {
  try {
    const { slot_id, lecture_date, status, remarks } = req.body;
    const userId = req.user.userId;
    const role   = req.user.role;

    if (!slot_id || !lecture_date || !status)
      return sendError(res, 400, 'slot_id, lecture_date and status are required');

    const validStatuses = ['conducted','cancelled','delayed','teacher_absent'];
    if (!validStatuses.includes(status))
      return sendError(res, 400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);

    // Only teacher can mark their own lectures
    if (role === 'teacher') {
      const teacher = await TimetableModel.getTeacherByUserId(userId);
      if (!teacher)
        return sendError(res, 403, 'Teacher profile not found');
    }

    await LectureAttendanceModel.markStatus({
      slotId:       slot_id,
      lectureDate:  lecture_date,
      status,
      reportedBy:   userId,
    });

    res.status(200).json({
      success: true,
      message: `Lecture marked as ${status}`,
    });

  } catch (err) {
    console.error('markStatus error:', err);
    sendError(res, 500, 'Could not mark lecture status');
  }
};

// ── Get teacher's attendance history ────────────────────────────────────
export const getTeacherHistory = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { from, to } = req.query;

    // Default: last 30 days
    const toDate   = to   || new Date().toISOString().split('T')[0];
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                              .toISOString().split('T')[0];

    const records = await LectureAttendanceModel.getByTeacher(
      teacherId, fromDate, toDate
    );

    res.status(200).json({
      success: true,
      data:    records,
    });

  } catch (err) {
    console.error('getTeacherHistory error:', err);
    sendError(res, 500, 'Could not fetch attendance history');
  }
};
export const getByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date || new Date().toISOString().split('T')[0];

    const [rows] = await (await import('../config/db.js')).default.query(
      `SELECT
         la.*,
         ts.start_time,
         ts.end_time,
         ts.room,
         s.subject_name,
         sec.section_name,
         u.name  AS teacher_name,
         u.email AS teacher_email
       FROM lecture_attendance la
       JOIN timetable_slots ts  ON la.slot_id    = ts.slot_id
       JOIN subjects         s  ON ts.subject_id = s.subject_id
       JOIN sections         sec ON ts.section_id = sec.section_id
       JOIN teachers         t  ON ts.teacher_id = t.teacher_id
       JOIN users            u  ON t.teacher_id  = u.user_id
       WHERE la.lecture_date = ?
       ORDER BY ts.start_time ASC`,
      [queryDate]
    );

    res.status(200).json({ success: true, data: rows });

  } catch (err) {
    console.error('getByDate error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch records' });
  }
};

// ── Get today's absent lectures (admin only) ─────────────────────────────
export const getTodayAbsent = async (req, res) => {
  try {
    const records = await LectureAttendanceModel.getTodayAbsent();

    res.status(200).json({
      success: true,
      data:    records,
    });

  } catch (err) {
    console.error('getTodayAbsent error:', err);
    sendError(res, 500, 'Could not fetch absent lectures');
  }
};