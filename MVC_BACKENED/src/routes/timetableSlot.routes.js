import express                from 'express';
import {
  getAllSlots,
  getSlotById,
  createSlot,
  updateSlot,
  deleteSlot,
}                             from '../controller/TimetableSlotController.js';
import { authenticate }       from '../middleware/auth.middleware.js';
import { authorise }          from '../middleware/role.middleware.js';

const router = express.Router();

// ── Admin only ────────────────────────────────────────────────────────────
router.get('/',           authenticate, authorise('admin'),           getAllSlots);
router.get('/:slotId',    authenticate, authorise('admin'),           getSlotById);
router.post('/',          authenticate, authorise('admin'),           createSlot);
router.put('/:slotId',    authenticate, authorise('admin'),           updateSlot);
router.delete('/:slotId', authenticate, authorise('admin'),           deleteSlot);

export default router;