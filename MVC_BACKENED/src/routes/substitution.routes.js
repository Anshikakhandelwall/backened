import express              from 'express';
import {
  getTeacherSubstitutions,
  assignSubstitution,
  getAllSubstitutions,
}                           from '../controller/SubstitutionController.js';
import { authenticate }     from '../middleware/auth.middleware.js';
import { authorise }        from '../middleware/role.middleware.js';

const router = express.Router();

// Teacher views their own substitutions
router.get('/teacher',
  authenticate, authorise('teacher'),
  getTeacherSubstitutions
);

// Admin assigns substitution
router.post('/assign',
  authenticate, authorise('admin'),
  assignSubstitution
);

// Admin views all substitutions
router.get('/all',
  authenticate, authorise('admin'),
  getAllSubstitutions
);

export default router;