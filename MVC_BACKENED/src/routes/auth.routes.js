import express from 'express';
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  verifyOTP,
  resetPassword,
} from '../controller/authController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorise }    from '../middleware/role.middleware.js';

const router = express.Router();

// Public
router.post('/register',   register);
router.post('/login',      login);
router.post('/refresh',    refresh);
router.post('/logout',     logout);
router.post('/forgot',     forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset',      resetPassword);

// Protected
router.get('/student/dashboard',
  authenticate, authorise('student'),
  (req, res) => res.json({ success: true, message: 'Student dashboard', user: req.user })
);
router.get('/teacher/dashboard',
  authenticate, authorise('teacher'),
  (req, res) => res.json({ success: true, message: 'Teacher dashboard', user: req.user })
);
router.get('/admin/dashboard',
  authenticate, authorise('admin'),
  (req, res) => res.json({ success: true, message: 'Admin dashboard', user: req.user })
);

export default router;