import SubstitutionModel      from '../models/SubstitutionModel.js';
import TimetableModel         from '../models/TimetableModel.js';

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

// ── Get teacher's substitutions (covering + absences) ────────────────────
export const getTeacherSubstitutions = async (req, res) => {
  try {
    const teacherId = req.user.userId;

    const [covering, absences] = await Promise.all([
      SubstitutionModel.getCovering(teacherId),
      SubstitutionModel.getAbsences(teacherId),
    ]);

    res.status(200).json({
      success: true,
      data: { covering, absent: absences },
    });

  } catch (err) {
    console.error('getTeacherSubstitutions error:', err);
    sendError(res, 500, 'Could not fetch substitutions');
  }
};

// ── Assign substitution (admin only) ─────────────────────────────────────
export const assignSubstitution = async (req, res) => {
  try {
    const {
      slot_id,
      sub_date,
      original_teacher_id,
      substitute_teacher_id,
      reason,
    } = req.body;

    const assignedBy = req.user.userId;

    if (!slot_id || !sub_date || !original_teacher_id || !substitute_teacher_id)
      return sendError(res, 400,
        'slot_id, sub_date, original_teacher_id and substitute_teacher_id are required'
      );

    // Prevent duplicate substitution for same slot + date
    const already = await SubstitutionModel.exists(slot_id, sub_date);
    if (already)
      return sendError(res, 409,
        'A substitution already exists for this slot and date'
      );

    const subId = await SubstitutionModel.create({
      slotId:               slot_id,
      subDate:              sub_date,
      originalTeacherId:    original_teacher_id,
      substituteTeacherId:  substitute_teacher_id,
      assignedBy,
      reason:               reason || null,
    });

    res.status(201).json({
      success: true,
      message: 'Substitution assigned successfully',
      subId,
    });

  } catch (err) {
    console.error('assignSubstitution error:', err);
    sendError(res, 500, 'Could not assign substitution');
  }
};

// ── Get all substitutions (admin only) ───────────────────────────────────
export const getAllSubstitutions = async (req, res) => {
  try {
    const records = await SubstitutionModel.getAll();

    res.status(200).json({
      success: true,
      data:    records,
    });

  } catch (err) {
    console.error('getAllSubstitutions error:', err);
    sendError(res, 500, 'Could not fetch substitutions');
  }
};