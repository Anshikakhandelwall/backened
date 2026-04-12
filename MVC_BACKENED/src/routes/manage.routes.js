import express            from 'express';
import {
  getSchools,   createSchool,   deleteSchool,
  getCourses,   createCourse,   deleteCourse,
  getBranches,  createBranch,   deleteBranch,
  getSemesters, createSemester, deleteSemester,
  getSections,  createSection,  deleteSection,
  getSubjects,  createSubject,  deleteSubject,
}                         from '../controller/ManageController.js';
import { authenticate }   from '../middleware/auth.middleware.js';
import { authorise }      from '../middleware/role.middleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorise('admin'));

// ── Schools ───────────────────────────────────────────────────────────────
router.get   ('/schools',         getSchools);
router.post  ('/schools',         createSchool);
router.delete('/schools/:id',     deleteSchool);

// ── Courses ───────────────────────────────────────────────────────────────
router.get   ('/courses',         getCourses);
router.post  ('/courses',         createCourse);
router.delete('/courses/:id',     deleteCourse);

// ── Branches ──────────────────────────────────────────────────────────────
router.get   ('/branches',        getBranches);
router.post  ('/branches',        createBranch);
router.delete('/branches/:id',    deleteBranch);

// ── Semesters ─────────────────────────────────────────────────────────────
router.get   ('/semesters',       getSemesters);
router.post  ('/semesters',       createSemester);
router.delete('/semesters/:id',   deleteSemester);

// ── Sections ──────────────────────────────────────────────────────────────
router.get   ('/sections',        getSections);
router.post  ('/sections',        createSection);
router.delete('/sections/:id',    deleteSection);

// ── Subjects ──────────────────────────────────────────────────────────────
router.get   ('/subjects',        getSubjects);
router.post  ('/subjects',        createSubject);
router.delete('/subjects/:id',    deleteSubject);

export default router;