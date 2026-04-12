import path               from 'path';
import fs                 from 'fs';
import TimetableUploadModel from '../models/TimetableUploadModel.js';

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

// ── Upload timetable ──────────────────────────────────────────────────────
export const uploadTimetable = async (req, res) => {
  try {
    if (!req.file)
      return sendError(res, 400, 'No file uploaded');

    const { section_id } = req.body;
    if (!section_id)
      return sendError(res, 400, 'section_id is required');

    const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';

    await TimetableUploadModel.save({
      sectionId:  section_id,
      fileName:   req.file.originalname,
      filePath:   req.file.filename,
      fileType,
      uploadedBy: req.user.userId,
    });

    res.status(200).json({
      success:  true,
      message:  'Timetable uploaded successfully',
      filePath: req.file.filename,
      fileType,
    });

  } catch (err) {
    console.error('uploadTimetable error:', err);
    sendError(res, 500, 'Could not upload timetable');
  }
};

// ── Get timetable for a section ───────────────────────────────────────────
export const getTimetableBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const record = await TimetableUploadModel.getBySectionId(sectionId);

    if (!record)
      return res.status(200).json({ success: true, data: null });

    res.status(200).json({ success: true, data: record });

  } catch (err) {
    console.error('getTimetableBySection error:', err);
    sendError(res, 500, 'Could not fetch timetable');
  }
};

// ── Get all uploaded timetables (admin) ───────────────────────────────────
export const getAllTimetables = async (req, res) => {
  try {
    const records = await TimetableUploadModel.getAll();
    res.status(200).json({ success: true, data: records });
  } catch (err) {
    console.error('getAllTimetables error:', err);
    sendError(res, 500, 'Could not fetch timetables');
  }
};

// ── Serve uploaded file ───────────────────────────────────────────────────
export const serveFile = (req, res) => {
  const { filename } = req.params;
  const filePath = path.resolve(`./uploads/timetables/${filename}`);

  if (!fs.existsSync(filePath))
    return res.status(404).json({ success: false, message: 'File not found' });

  res.sendFile(filePath);
};