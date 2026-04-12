import ManageModel from '../models/ManageModel.js';

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

// ── SCHOOLS ───────────────────────────────────────────────────────────────
export const getSchools = async (req, res) => {
  try {
    const data = await ManageModel.getAllSchools();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getSchools error:', err);
    sendError(res, 500, 'Could not fetch schools');
  }
};

export const createSchool = async (req, res) => {
  try {
    const { school_name } = req.body;
    if (!school_name)
      return sendError(res, 400, 'school_name is required');
    const id = await ManageModel.createSchool(school_name);
    res.status(201).json({ success: true, message: 'School created', id });
  } catch (err) {
    console.error('createSchool error:', err);
    sendError(res, 500, 'Could not create school');
  }
};

export const deleteSchool = async (req, res) => {
  try {
    await ManageModel.deleteSchool(req.params.id);
    res.status(200).json({ success: true, message: 'School deleted' });
  } catch (err) {
    console.error('deleteSchool error:', err);
    sendError(res, 500, 'Could not delete school');
  }
};

// ── COURSES ───────────────────────────────────────────────────────────────
export const getCourses = async (req, res) => {
  try {
    const data = await ManageModel.getAllCourses();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getCourses error:', err);
    sendError(res, 500, 'Could not fetch courses');
  }
};

export const createCourse = async (req, res) => {
  try {
    const { course_name, school_id } = req.body;
    if (!course_name || !school_id)
      return sendError(res, 400, 'course_name and school_id are required');
    const id = await ManageModel.createCourse(course_name, school_id);
    res.status(201).json({ success: true, message: 'Course created', id });
  } catch (err) {
    console.error('createCourse error:', err);
    sendError(res, 500, 'Could not create course');
  }
};

export const deleteCourse = async (req, res) => {
  try {
    await ManageModel.deleteCourse(req.params.id);
    res.status(200).json({ success: true, message: 'Course deleted' });
  } catch (err) {
    console.error('deleteCourse error:', err);
    sendError(res, 500, 'Could not delete course');
  }
};

// ── BRANCHES ──────────────────────────────────────────────────────────────
export const getBranches = async (req, res) => {
  try {
    const data = await ManageModel.getAllBranches();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getBranches error:', err);
    sendError(res, 500, 'Could not fetch branches');
  }
};

export const createBranch = async (req, res) => {
  try {
    const { branch_name, course_id } = req.body;
    if (!branch_name || !course_id)
      return sendError(res, 400, 'branch_name and course_id are required');
    const id = await ManageModel.createBranch(branch_name, course_id);
    res.status(201).json({ success: true, message: 'Branch created', id });
  } catch (err) {
    console.error('createBranch error:', err);
    sendError(res, 500, 'Could not create branch');
  }
};

export const deleteBranch = async (req, res) => {
  try {
    await ManageModel.deleteBranch(req.params.id);
    res.status(200).json({ success: true, message: 'Branch deleted' });
  } catch (err) {
    console.error('deleteBranch error:', err);
    sendError(res, 500, 'Could not delete branch');
  }
};

// ── SEMESTERS ─────────────────────────────────────────────────────────────
export const getSemesters = async (req, res) => {
  try {
    const data = await ManageModel.getAllSemesters();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getSemesters error:', err);
    sendError(res, 500, 'Could not fetch semesters');
  }
};

export const createSemester = async (req, res) => {
  try {
    const { sem_number, branch_id } = req.body;
    if (!sem_number || !branch_id)
      return sendError(res, 400, 'sem_number and branch_id are required');
    const id = await ManageModel.createSemester(sem_number, branch_id);
    res.status(201).json({ success: true, message: 'Semester created', id });
  } catch (err) {
    console.error('createSemester error:', err);
    sendError(res, 500, 'Could not create semester');
  }
};

export const deleteSemester = async (req, res) => {
  try {
    await ManageModel.deleteSemester(req.params.id);
    res.status(200).json({ success: true, message: 'Semester deleted' });
  } catch (err) {
    console.error('deleteSemester error:', err);
    sendError(res, 500, 'Could not delete semester');
  }
};

// ── SECTIONS ──────────────────────────────────────────────────────────────
export const getSections = async (req, res) => {
  try {
    const data = await ManageModel.getAllSections();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getSections error:', err);
    sendError(res, 500, 'Could not fetch sections');
  }
};

export const createSection = async (req, res) => {
  try {
    const { section_name, sem_id } = req.body;
    if (!section_name || !sem_id)
      return sendError(res, 400, 'section_name and sem_id are required');
    const id = await ManageModel.createSection(section_name, sem_id);
    res.status(201).json({ success: true, message: 'Section created', id });
  } catch (err) {
    console.error('createSection error:', err);
    sendError(res, 500, 'Could not create section');
  }
};

export const deleteSection = async (req, res) => {
  try {
    await ManageModel.deleteSection(req.params.id);
    res.status(200).json({ success: true, message: 'Section deleted' });
  } catch (err) {
    console.error('deleteSection error:', err);
    sendError(res, 500, 'Could not delete section');
  }
};

// ── SUBJECTS ──────────────────────────────────────────────────────────────
export const getSubjects = async (req, res) => {
  try {
    const data = await ManageModel.getAllSubjects();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getSubjects error:', err);
    sendError(res, 500, 'Could not fetch subjects');
  }
};

export const createSubject = async (req, res) => {
  try {
    const { subject_name, subject_code, branch_id, sem_id } = req.body;
    if (!subject_name || !subject_code)
      return sendError(res, 400, 'subject_name and subject_code are required');
    const id = await ManageModel.createSubject(
      subject_name, subject_code, branch_id || null, sem_id || null
    );
    res.status(201).json({ success: true, message: 'Subject created', id });
  } catch (err) {
    console.error('createSubject error:', err);
    if (err.code === 'ER_DUP_ENTRY')
      return sendError(res, 409, 'Subject code already exists');
    sendError(res, 500, 'Could not create subject');
  }
};

export const deleteSubject = async (req, res) => {
  try {
    await ManageModel.deleteSubject(req.params.id);
    res.status(200).json({ success: true, message: 'Subject deleted' });
  } catch (err) {
    console.error('deleteSubject error:', err);
    sendError(res, 500, 'Could not delete subject');
  }
};