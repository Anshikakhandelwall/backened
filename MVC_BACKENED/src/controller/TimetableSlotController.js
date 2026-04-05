import TimetableSlotModel from '../models/TimetableSlotModel.js';

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

// ── Get all slots ─────────────────────────────────────────────────────────
export const getAllSlots = async (req, res) => {
  try {
    const slots = await TimetableSlotModel.getAll();
    res.status(200).json({ success: true, data: slots });
  } catch (err) {
    console.error('getAllSlots error:', err);
    sendError(res, 500, 'Could not fetch timetable slots');
  }
};

// ── Get single slot ───────────────────────────────────────────────────────
export const getSlotById = async (req, res) => {
  try {
    const { slotId } = req.params;
    const slot = await TimetableSlotModel.getById(slotId);
    if (!slot) return sendError(res, 404, 'Slot not found');
    res.status(200).json({ success: true, data: slot });
  } catch (err) {
    console.error('getSlotById error:', err);
    sendError(res, 500, 'Could not fetch slot');
  }
};

// ── Create slot ───────────────────────────────────────────────────────────
export const createSlot = async (req, res) => {
  try {
    const {
      section_id, subject_id, teacher_id,
      day_of_week, start_time, end_time,
      room, slot_type,
    } = req.body;

    // ── Validate ────────────────────────────────────────────────────────
    if (!section_id || !subject_id || !teacher_id ||
        !day_of_week || !start_time || !end_time)
      return sendError(res, 400,
        'section_id, subject_id, teacher_id, day_of_week, start_time and end_time are required'
      );

    const validDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    if (!validDays.includes(day_of_week))
      return sendError(res, 400, `day_of_week must be one of: ${validDays.join(', ')}`);

    if (start_time >= end_time)
      return sendError(res, 400, 'start_time must be before end_time');

    // ── Check for time conflict ──────────────────────────────────────────
    const conflict = await TimetableSlotModel.checkConflict({
      sectionId:  section_id,
      dayOfWeek:  day_of_week,
      startTime:  start_time,
      endTime:    end_time,
    });

    if (conflict)
      return sendError(res, 409,
        'This slot conflicts with an existing slot for this section'
      );

    const slotId = await TimetableSlotModel.create({
      sectionId:  section_id,
      subjectId:  subject_id,
      teacherId:  teacher_id,
      dayOfWeek:  day_of_week,
      startTime:  start_time,
      endTime:    end_time,
      room:       room     || null,
      slotType:   slot_type || 'lecture',
    });

    res.status(201).json({
      success: true,
      message: 'Timetable slot created successfully',
      slotId,
    });

  } catch (err) {
    console.error('createSlot error:', err);
    sendError(res, 500, 'Could not create slot');
  }
};

// ── Update slot ───────────────────────────────────────────────────────────
export const updateSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const {
      section_id, subject_id, teacher_id,
      day_of_week, start_time, end_time,
      room, slot_type,
    } = req.body;

    const existing = await TimetableSlotModel.getById(slotId);
    if (!existing) return sendError(res, 404, 'Slot not found');

    if (start_time && end_time && start_time >= end_time)
      return sendError(res, 400, 'start_time must be before end_time');

    // ── Check conflict excluding current slot ────────────────────────────
    if (section_id || day_of_week || start_time || end_time) {
      const conflict = await TimetableSlotModel.checkConflict({
        sectionId:    section_id  || existing.section_id,
        dayOfWeek:    day_of_week || existing.day_of_week,
        startTime:    start_time  || existing.start_time,
        endTime:      end_time    || existing.end_time,
        excludeSlotId: slotId,
      });
      if (conflict)
        return sendError(res, 409,
          'This slot conflicts with an existing slot for this section'
        );
    }

    await TimetableSlotModel.update(slotId, {
      sectionId: section_id  || existing.section_id,
      subjectId: subject_id  || existing.subject_id,
      teacherId: teacher_id  || existing.teacher_id,
      dayOfWeek: day_of_week || existing.day_of_week,
      startTime: start_time  || existing.start_time,
      endTime:   end_time    || existing.end_time,
      room:      room        ?? existing.room,
      slotType:  slot_type   || existing.slot_type,
    });

    res.status(200).json({
      success: true,
      message: 'Slot updated successfully',
    });

  } catch (err) {
    console.error('updateSlot error:', err);
    sendError(res, 500, 'Could not update slot');
  }
};

// ── Delete slot ───────────────────────────────────────────────────────────
export const deleteSlot = async (req, res) => {
  try {
    const { slotId } = req.params;

    const existing = await TimetableSlotModel.getById(slotId);
    if (!existing) return sendError(res, 404, 'Slot not found');

    await TimetableSlotModel.delete(slotId);

    res.status(200).json({
      success: true,
      message: 'Slot deleted successfully',
    });

  } catch (err) {
    console.error('deleteSlot error:', err);
    sendError(res, 500, 'Could not delete slot');
  }
};