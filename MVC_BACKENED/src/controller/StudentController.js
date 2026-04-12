import StudentModel from '../models/StudentModel.js';

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

const DAYS = ['Sunday','Monday','Tuesday','Wednesday',
              'Thursday','Friday','Saturday'];

// ── Get student profile ───────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const profile   = await StudentModel.getProfile(studentId);

    if (!profile)
      return sendError(res, 404, 'Student profile not found');

    res.status(200).json({ success: true, data: profile });

  } catch (err) {
    console.error('getProfile error:', err);
    sendError(res, 500, 'Could not fetch profile');
  }
};

// ── Get today's timetable ─────────────────────────────────────────────────
export const getTodayTimetable = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const dayOfWeek = DAYS[new Date().getDay()];

    const sectionId = await StudentModel.getSectionId(studentId);
    if (!sectionId)
      return sendError(res, 404, 'Student section not found');

    const lectures = await StudentModel.getTodayTimetable(sectionId, dayOfWeek);

    res.status(200).json({
      success: true,
      day:     dayOfWeek,
      data:    lectures,
    });

  } catch (err) {
    console.error('getTodayTimetable error:', err);
    sendError(res, 500, 'Could not fetch timetable');
  }
};

// ── Get weekly timetable ──────────────────────────────────────────────────
export const getWeeklyTimetable = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const sectionId = await StudentModel.getSectionId(studentId);
    if (!sectionId)
      return sendError(res, 404, 'Student section not found');

    const lectures = await StudentModel.getWeeklyTimetable(sectionId);

    res.status(200).json({ success: true, data: lectures });

  } catch (err) {
    console.error('getWeeklyTimetable error:', err);
    sendError(res, 500, 'Could not fetch timetable');
  }
};

// ── Report teacher absence ────────────────────────────────────────────────
export const reportAbsence = async (req, res) => {
  try {
    const { slot_id, lecture_date } = req.body;
    const studentId = req.user.userId;

    if (!slot_id || !lecture_date)
      return sendError(res, 400, 'slot_id and lecture_date are required');

    await StudentModel.reportAbsence({
      slotId:      slot_id,
      lectureDate: lecture_date,
      reportedBy:  studentId,
    });

    res.status(200).json({
      success: true,
      message: 'Absence reported successfully. Admin has been notified.',
    });

  } catch (err) {
    console.error('reportAbsence error:', err);
    sendError(res, 500, 'Could not report absence');
  }
};

// ── Get events ────────────────────────────────────────────────────────────
export const getEvents = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const events    = await StudentModel.getEvents(studentId);

    res.status(200).json({ success: true, data: events });

  } catch (err) {
    console.error('getEvents error:', err);
    sendError(res, 500, 'Could not fetch events');
  }
};

// ── Get IKS credit summary ────────────────────────────────────────────────
export const getCreditSummary = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const summary   = await StudentModel.getCreditSummary(studentId);

    res.status(200).json({ success: true, data: summary });

  } catch (err) {
    console.error('getCreditSummary error:', err);
    sendError(res, 500, 'Could not fetch credits');
  }
};

// ── Mark event attendance ─────────────────────────────────────────────────
export const markEventAttendance = async (req, res) => {
  try {
    const { event_id } = req.body;
    const studentId    = req.user.userId;

    if (!event_id)
      return sendError(res, 400, 'event_id is required');

    // Get event credits
    const [rows] = await import('../config/db.js').then(m =>
      m.default.query(
        `SELECT credits FROM iks_events WHERE event_id = ?`,
        [event_id]
      )
    );

    if (!rows.length)
      return sendError(res, 404, 'Event not found');

    await StudentModel.markEventAttendance(event_id, studentId, rows[0].credits);

    res.status(200).json({
      success:       true,
      message:       'Attendance marked successfully',
      creditsEarned: rows[0].credits,
    });

  } catch (err) {
    console.error('markEventAttendance error:', err);
    sendError(res, 500, 'Could not mark attendance');
  }
};

// ── Get notifications ─────────────────────────────────────────────────────
export const getNotifications = async (req, res) => {
  try {
    const studentId     = req.user.userId;
    const notifications = await StudentModel.getNotifications(studentId);

    res.status(200).json({ success: true, data: notifications });

  } catch (err) {
    console.error('getNotifications error:', err);
    sendError(res, 500, 'Could not fetch notifications');
  }
};

// ── Mark notification read ────────────────────────────────────────────────
export const markNotificationRead = async (req, res) => {
  try {
    const { notifId } = req.params;
    const studentId   = req.user.userId;

    await StudentModel.markNotificationRead(notifId, studentId);

    res.status(200).json({ success: true, message: 'Notification marked as read' });

  } catch (err) {
    console.error('markNotificationRead error:', err);
    sendError(res, 500, 'Could not update notification');
  }
};

// ── Get section substitutions ─────────────────────────────────────────────
export const getSectionSubstitutions = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const sectionId = await StudentModel.getSectionId(studentId);
    if (!sectionId)
      return sendError(res, 404, 'Student section not found');

    const subs = await StudentModel.getSectionSubstitutions(sectionId);

    res.status(200).json({ success: true, data: subs });

  } catch (err) {
    console.error('getSectionSubstitutions error:', err);
    sendError(res, 500, 'Could not fetch substitutions');
  }
};