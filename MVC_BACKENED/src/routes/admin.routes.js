import express from 'express';
import {
    getDashboardStats,
    getAllUsers,
    getUsersByRole,
    getUserById,
    deleteUser,
    getAllTeachers,
    getAllSections,
    getAllSubjects,
    getAllBranches,
 createStudent,
createTeacher,
} 
from '../controller/AdminController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorise } from '../middleware/role.middleware.js';

const router = express.Router();

// All admin routes are protected
router.use(authenticate);
router.use(authorise('admin'));

// ── Dashboard ─────────────────────────────────────────────────────────────
router.get('/stats', getDashboardStats);

// ── Users ─────────────────────────────────────────────────────────────────
router.get('/users', getAllUsers);
router.get('/users/role/:role', getUsersByRole);
router.get('/users/:userId', getUserById);
router.delete('/users/:userId', deleteUser);

// ── Dropdowns ─────────────────────────────────────────────────────────────
router.get('/teachers', getAllTeachers);
router.get('/sections', getAllSections);
router.get('/subjects', getAllSubjects);
router.get('/branches', getAllBranches);


router.post('/students/create', createStudent);
router.post('/teachers/create', createTeacher);

export default router;
