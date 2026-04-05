import AdminModel from '../models/AdminModel.js';

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

// ── Dashboard stats ──────────────────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await AdminModel.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    sendError(res, 500, 'Could not fetch stats');
  }
};

// ── Get all users ─────────────────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const users = await AdminModel.getAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error('getAllUsers error:', err);
    sendError(res, 500, 'Could not fetch users');
  }
};

// ── Get users by role ─────────────────────────────────────────────────────
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ['student', 'teacher', 'admin'];
    if (!validRoles.includes(role))
      return sendError(res, 400, 'Invalid role');

    const users = await AdminModel.getUsersByRole(role);
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error('getUsersByRole error:', err);
    sendError(res, 500, 'Could not fetch users');
  }
};

// ── Get single user ───────────────────────────────────────────────────────
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await AdminModel.getUserById(userId);
    if (!user) return sendError(res, 404, 'User not found');
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('getUserById error:', err);
    sendError(res, 500, 'Could not fetch user');
  }
};

// ── Delete user ───────────────────────────────────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    const { userId }    = req.params;
    const requesterId   = req.user.userId;

    if (parseInt(userId) === requesterId)
      return sendError(res, 400, 'You cannot delete your own account');

    const user = await AdminModel.getUserById(userId);
    if (!user) return sendError(res, 404, 'User not found');

    await AdminModel.deleteUser(userId);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('deleteUser error:', err);
    sendError(res, 500, 'Could not delete user');
  }
};

// ── Dropdown: all teachers ────────────────────────────────────────────────
export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await AdminModel.getAllTeachers();
    res.status(200).json({ success: true, data: teachers });
  } catch (err) {
    console.error('getAllTeachers error:', err);
    sendError(res, 500, 'Could not fetch teachers');
  }
};

// ── Dropdown: all sections ────────────────────────────────────────────────
export const getAllSections = async (req, res) => {
  try {
    const sections = await AdminModel.getAllSections();
    res.status(200).json({ success: true, data: sections });
  } catch (err) {
    console.error('getAllSections error:', err);
    sendError(res, 500, 'Could not fetch sections');
  }
};

// ── Dropdown: all subjects ────────────────────────────────────────────────
export const getAllSubjects = async (req, res) => {
  try {
    const subjects = await AdminModel.getAllSubjects();
    res.status(200).json({ success: true, data: subjects });
  } catch (err) {
    console.error('getAllSubjects error:', err);
    sendError(res, 500, 'Could not fetch subjects');
  }
};

// ── Dropdown: all branches ────────────────────────────────────────────────
export const getAllBranches = async (req, res) => {
  try {
    const branches = await AdminModel.getAllBranches();
    res.status(200).json({ success: true, data: branches });
  } catch (err) {
    console.error('getAllBranches error:', err);
    sendError(res, 500, 'Could not fetch branches');
  }
};