import express          from 'express';
import PushModel        from '../models/PushModel.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// ── Save push subscription ─────────────────────────────────────────────
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription)
      return res.status(400).json({ success: false, message: 'Subscription required' });

    await PushModel.save(req.user.userId, subscription);
    res.status(200).json({ success: true, message: 'Subscribed to push notifications' });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ success: false, message: 'Could not save subscription' });
  }
});

// ── Remove push subscription ───────────────────────────────────────────
router.delete('/unsubscribe', authenticate, async (req, res) => {
  try {
    await PushModel.delete(req.user.userId);
    res.status(200).json({ success: true, message: 'Unsubscribed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not remove subscription' });
  }
});

// ── Get VAPID public key ───────────────────────────────────────────────
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

export default router;