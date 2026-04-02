import bcrypt from 'bcrypt';
import UserModel from '../models/User.js';
import { generateOTP, getOTPExpiry } from '../utils/otp.js';
import { sendOTPEmail } from '../utils/mailer.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';

const SALT_ROUNDS = 12;
const refreshTokenStore = new Set();

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

// ── REGISTER ───────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password, role, ...extraData } = req.body;

    if (!name || !email || !password || !role)
      return sendError(res, 400, 'name, email, password and role are required');

    if (!['student', 'teacher', 'admin'].includes(role))
      return sendError(res, 400, 'Invalid role');

    const existing = await UserModel.findByEmail(email);
    if (existing)
      return sendError(res, 409, 'Email already registered');

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = await UserModel.createUser({ name, email, hashedPassword, role });

    if (role === 'student') {
      const { section_id, enrollment, department } = extraData;
      if (!section_id || !enrollment)
        return sendError(res, 400, 'section_id and enrollment are required for student');
      await UserModel.createStudent({ userId, section_id, enrollment, department });

    } else if (role === 'teacher') {
      const { department, designation } = extraData;
      await UserModel.createTeacher({ userId, department, designation });

    } else if (role === 'admin') {
      const { role_type } = extraData;
      await UserModel.createAdmin({ userId, role_type });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      userId,
    });

  } catch (err) {
    console.error('register error:', err);
    sendError(res, 500, 'Registration failed');
  }
};

// ── LOGIN ──────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return sendError(res, 400, 'Email and password are required');

    const user = await UserModel.findByEmail(email);
    if (!user)
      return sendError(res, 401, 'Invalid email or password');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return sendError(res, 401, 'Invalid email or password');

    const payload      = { userId: user.user_id, role: user.role };
    const accessToken  = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    refreshTokenStore.add(refreshToken);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success:      true,
      accessToken,
      role:         user.role,
      name:         user.name,
      isFirstLogin: user.is_first_login,
    });

  } catch (err) {
    console.error('login error:', err);
    sendError(res, 500, 'Login failed');
  }
};

// ── REFRESH TOKEN ──────────────────────────────────────────────────────────
export const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token || !refreshTokenStore.has(token))
      return sendError(res, 403, 'Invalid or expired refresh token');

    const decoded     = verifyRefreshToken(token);
    const accessToken = generateAccessToken({
      userId: decoded.userId,
      role:   decoded.role,
    });

    res.status(200).json({ success: true, accessToken });

  } catch (err) {
    console.error('refresh error:', err);
    sendError(res, 403, 'Token refresh failed');
  }
};

// ── LOGOUT ─────────────────────────────────────────────────────────────────
export const logout = (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) refreshTokenStore.delete(token);

    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });

  } catch (err) {
    console.error('logout error:', err);
    sendError(res, 500, 'Logout failed');
  }
};

// ── FORGOT PASSWORD ────────────────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return sendError(res, 400, 'Email is required');

    const user = await UserModel.findByEmail(email);
    if (!user)
      return sendError(res, 404, 'No account found with this email');

    const otp    = generateOTP();
    const expiry = getOTPExpiry();

    await UserModel.saveOTP({ email, otp, expiry });
    await sendOTPEmail(email, otp);

    res.status(200).json({ success: true, message: 'OTP sent to your email' });

  } catch (err) {
    console.error('forgotPassword error:', err);
    sendError(res, 500, 'Could not send OTP');
  }
};

// ── VERIFY OTP ─────────────────────────────────────────────────────────────
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return sendError(res, 400, 'Email and OTP are required');

    const user = await UserModel.findByEmail(email);
    if (!user)
      return sendError(res, 404, 'No account found with this email');

    if (user.otp_code !== otp)
      return sendError(res, 400, 'Invalid OTP');

    if (new Date() > new Date(user.otp_expiry))
      return sendError(res, 400, 'OTP has expired. Please request a new one');

    res.status(200).json({ success: true, message: 'OTP verified successfully' });

  } catch (err) {
    console.error('verifyOTP error:', err);
    sendError(res, 500, 'OTP verification failed');
  }
};

// ── RESET PASSWORD ─────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword)
      return sendError(res, 400, 'email, otp and newPassword are required');

    if (newPassword.length < 8)
      return sendError(res, 400, 'Password must be at least 8 characters');

    const user = await UserModel.findByEmail(email);
    if (!user)
      return sendError(res, 404, 'No account found with this email');

    if (user.otp_code !== otp)
      return sendError(res, 400, 'Invalid OTP');

    if (new Date() > new Date(user.otp_expiry))
      return sendError(res, 400, 'OTP has expired. Please request a new one');

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await UserModel.updatePassword({ email, hashedPassword });

    res.status(200).json({ success: true, message: 'Password reset successfully' });

  } catch (err) {
    console.error('resetPassword error:', err);
    sendError(res, 500, 'Password reset failed');
  }
};