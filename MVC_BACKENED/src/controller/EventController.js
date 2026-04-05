import EventModel  from '../models/EventModel.js';
import CreditModel from '../models/CreditModel.js';

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

// ── Get all events (teacher + admin) ─────────────────────────────────────
export const getAllEvents = async (req, res) => {
  try {
    const events = await EventModel.getForTeacher();
    res.status(200).json({ success: true, data: events });
  } catch (err) {
    console.error('getAllEvents error:', err);
    sendError(res, 500, 'Could not fetch events');
  }
};

// ── Get events for logged-in student ─────────────────────────────────────
export const getStudentEvents = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const events    = await EventModel.getForStudent(studentId);
    res.status(200).json({ success: true, data: events });
  } catch (err) {
    console.error('getStudentEvents error:', err);
    sendError(res, 500, 'Could not fetch events');
  }
};

// ── Get single event by ID ────────────────────────────────────────────────
export const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await EventModel.getById(eventId);
    if (!event)
      return sendError(res, 404, 'Event not found');

    // Get conflicts for this event
    const conflicts = await EventModel.checkConflict(eventId);

    res.status(200).json({
      success: true,
      data:    { ...event, conflicts },
    });

  } catch (err) {
    console.error('getEventById error:', err);
    sendError(res, 500, 'Could not fetch event');
  }
};

// ── Create event (admin only) ─────────────────────────────────────────────
export const createEvent = async (req, res) => {
  try {
    const {
      event_name, description, event_date,
      start_time, end_time, venue, credits,
      scope, branch_id, section_id,
    } = req.body;

    const createdBy = req.user.userId;

    // ── Validate required fields ────────────────────────────────────────
    if (!event_name || !event_date || !start_time || !end_time || !scope)
      return sendError(res, 400,
        'event_name, event_date, start_time, end_time and scope are required'
      );

    const validScopes = ['university', 'branch', 'section'];
    if (!validScopes.includes(scope))
      return sendError(res, 400, `scope must be one of: ${validScopes.join(', ')}`);

    if (scope === 'branch' && !branch_id)
      return sendError(res, 400, 'branch_id is required for branch-level events');

    if (scope === 'section' && !section_id)
      return sendError(res, 400, 'section_id is required for section-level events');

    // ── Create event ────────────────────────────────────────────────────
    const eventId = await EventModel.create({
      eventName:   event_name,
      description: description || null,
      eventDate:   event_date,
      startTime:   start_time,
      endTime:     end_time,
      venue:       venue || null,
      credits:     credits || 1,
      scope,
      branchId:    branch_id  || null,
      sectionId:   section_id || null,
      createdBy,
    });

    // ── Auto-detect conflicts ───────────────────────────────────────────
    const conflicts = await EventModel.detectConflicts(eventId);

    for (const conflict of conflicts) {
      await EventModel.saveConflict(eventId, conflict.slot_id, event_date);
    }

    res.status(201).json({
      success:         true,
      message:         'Event created successfully',
      eventId,
      conflictsFound:  conflicts.length,
    });

  } catch (err) {
    console.error('createEvent error:', err);
    sendError(res, 500, 'Could not create event');
  }
};

// ── Update event (admin only) ─────────────────────────────────────────────
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      event_name, description, event_date,
      start_time, end_time, venue, credits,
      scope, branch_id, section_id,
    } = req.body;

    const event = await EventModel.getById(eventId);
    if (!event)
      return sendError(res, 404, 'Event not found');

    await EventModel.update(eventId, {
      eventName:   event_name   || event.event_name,
      description: description  ?? event.description,
      eventDate:   event_date   || event.event_date,
      startTime:   start_time   || event.start_time,
      endTime:     end_time     || event.end_time,
      venue:       venue        ?? event.venue,
      credits:     credits      ?? event.credits,
      scope:       scope        || event.scope,
      branchId:    branch_id    ?? event.branch_id,
      sectionId:   section_id   ?? event.section_id,
    });

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
    });

  } catch (err) {
    console.error('updateEvent error:', err);
    sendError(res, 500, 'Could not update event');
  }
};

// ── Delete event (admin only) ─────────────────────────────────────────────
export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await EventModel.getById(eventId);
    if (!event)
      return sendError(res, 404, 'Event not found');

    await EventModel.delete(eventId);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });

  } catch (err) {
    console.error('deleteEvent error:', err);
    sendError(res, 500, 'Could not delete event');
  }
};

// ── Mark student attendance ───────────────────────────────────────────────
export const markAttendance = async (req, res) => {
  try {
    const { event_id }  = req.body;
    const studentId     = req.user.userId;

    if (!event_id)
      return sendError(res, 400, 'event_id is required');

    const event = await EventModel.getById(event_id);
    if (!event)
      return sendError(res, 404, 'Event not found');

    await CreditModel.markAttendance(event_id, studentId, event.credits);

    res.status(200).json({
      success:       true,
      message:       'Attendance marked successfully',
      creditsEarned: event.credits,
    });

  } catch (err) {
    console.error('markAttendance error:', err);
    sendError(res, 500, 'Could not mark attendance');
  }
};

// ── Get student credits ───────────────────────────────────────────────────
export const getStudentCredits = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const [credits, history] = await Promise.all([
      CreditModel.getTotalCredits(studentId),
      CreditModel.getHistory(studentId),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total_credits:    credits.total_credits,
        events_attended:  credits.events_attended,
        required_credits: 10,
        remaining:        Math.max(0, 10 - credits.total_credits),
        history,
      },
    });

  } catch (err) {
    console.error('getStudentCredits error:', err);
    sendError(res, 500, 'Could not fetch credits');
  }
};

// ── Get event attendees (admin only) ─────────────────────────────────────
export const getEventAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await EventModel.getById(eventId);
    if (!event)
      return sendError(res, 404, 'Event not found');

    const attendees = await CreditModel.getEventAttendees(eventId);

    res.status(200).json({
      success: true,
      data:    attendees,
    });

  } catch (err) {
    console.error('getEventAttendees error:', err);
    sendError(res, 500, 'Could not fetch attendees');
  }
};