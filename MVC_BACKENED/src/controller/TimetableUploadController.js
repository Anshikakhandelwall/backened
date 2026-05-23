import path                    from 'path';
import fs                      from 'fs';
import { fileURLToPath }       from 'url';
import TimetableUploadModel    from '../models/TimetableUploadModel.js';
import {
  preprocessImage,
  extractTextFromImage,
  cleanupProcessed,
}                              from '../services/OCRService.js';
import { parseTimetableText }  from '../services/TimetableParserService.js';
import { createSlotsFromParsed } from '../services/SlotCreatorService.js';

const __filename  = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'timetables');

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

// ── Upload → OCR → Parse → Create slots ───────────────────────────────
export const uploadAndParseTimetable = async (req, res) => {
  let processedPath = null;

  try {
    console.log('=== uploadAndParseTimetable called ===');
    console.log('File:', req.file?.filename);
    console.log('Section ID:', req.body?.section_id);

    if (!req.file)
      return sendError(res, 400, 'No file uploaded');

    const { section_id } = req.body;
    if (!section_id)
      return sendError(res, 400, 'section_id is required');

    const originalPath = path.join(UPLOADS_DIR, req.file.filename);
    const fileType     = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';

    // Step 1 — Save upload record
    await TimetableUploadModel.save({
      sectionId:  section_id,
      fileName:   req.file.originalname,
      filePath:   req.file.filename,
      fileType,
      uploadedBy: req.user.userId,
    });

    if (fileType === 'pdf') {
      return res.status(200).json({
        success:      true,
        message:      'PDF uploaded. Use JPG/PNG for auto slot creation.',
        slotsCreated: 0,
        slotsSkipped: 0,
        slotsFailed:  0,
      });
    }

    // Step 2 — Preprocess image
    console.log('Step 2: Preprocessing image...');
    processedPath = await preprocessImage(originalPath);

    // Step 3 — OCR
    console.log('Step 3: Running OCR...');
    const rawText = await extractTextFromImage(processedPath);

    console.log('\n--- OCR Raw Text ---');
    console.log(rawText);
    console.log('--------------------\n');

    if (!rawText || rawText.trim().length < 10) {
      return res.status(200).json({
        success:      true,
        message:      'File uploaded but OCR could not extract text. Try a clearer image.',
        slotsCreated: 0,
        slotsSkipped: 0,
        slotsFailed:  0,
        rawText,
      });
    }

    // Step 4 — Parse
    console.log('Step 4: Parsing timetable...');
    const parsedSlots = parseTimetableText(rawText);
    console.log(`Parsed ${parsedSlots.length} slots`);

    if (parsedSlots.length === 0) {
      return res.status(200).json({
        success:      true,
        message:      'File uploaded but could not detect timetable structure. Try a clearer image.',
        slotsCreated: 0,
        slotsSkipped: 0,
        slotsFailed:  0,
        rawText:      rawText.slice(0, 1000),
      });
    }

    // Step 5 — Create slots in DB
    console.log('Step 5: Creating slots in DB...');
    const results = await createSlotsFromParsed(parsedSlots, section_id);

    console.log(`Created: ${results.created.length}`);
    console.log(`Skipped: ${results.skipped.length}`);
    console.log(`Failed:  ${results.failed.length}`);

    res.status(200).json({
      success:      true,
      message:      `Timetable processed. ${results.created.length} slots created automatically.`,
      slotsCreated: results.created.length,
      slotsSkipped: results.skipped.length,
      slotsFailed:  results.failed.length,
      created:      results.created,
      failed:       results.failed,
      rawText:      rawText.slice(0, 500),
    });

  } catch (err) {
    console.error('uploadAndParseTimetable error:', err);
    sendError(res, 500, `Pipeline error: ${err.message}`);
  } finally {
    if (processedPath) cleanupProcessed(processedPath);
  }
};

// ── Get timetable for a section ────────────────────────────────────────
export const getTimetableBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const record        = await TimetableUploadModel.getBySectionId(sectionId);
    res.status(200).json({ success: true, data: record || null });
  } catch (err) {
    console.error('getTimetableBySection error:', err);
    sendError(res, 500, 'Could not fetch timetable');
  }
};

// ── Get all uploaded timetables ────────────────────────────────────────
export const getAllTimetables = async (req, res) => {
  try {
    const records = await TimetableUploadModel.getAll();
    res.status(200).json({ success: true, data: records });
  } catch (err) {
    console.error('getAllTimetables error:', err);
    sendError(res, 500, 'Could not fetch timetables');
  }
};

// ── Serve file ─────────────────────────────────────────────────────────
export const serveFile = (req, res) => {
  const safeName = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, safeName);
  if (!fs.existsSync(filePath))
    return sendError(res, 404, 'File not found');
  res.sendFile(filePath);
};

export const deleteTimetable = async (req, res) => {
  try {
    const { id }        = req.params;
    const { section_id } = req.query;

    // Delete the DB record
    await TimetableUploadModel.deleteById(id);

    // Also delete slots for this section
    if (section_id) {
      const db = (await import('../config/db.js')).default;
      await db.query(
        `DELETE FROM timetable_slots WHERE section_id = ?`,
        [section_id]
      );
    }

    res.json({ success: true, message: 'Timetable deleted' });
  } catch (err) {
    console.error('deleteTimetable error:', err);
    res.status(500).json({ success: false, message: 'Could not delete' });
  }
};