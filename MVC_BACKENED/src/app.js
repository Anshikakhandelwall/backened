import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import cors from 'cors';
import timetableRoutes from './routes/timetable.routes.js';
import attendanceRoutes from './routes/lectureAttendance.routes.js';
import substitutionRoutes from './routes/substitution.routes.js';
import eventRoutes from './routes/event.routes.js';
import adminRoutes from './routes/admin.routes.js';
import slotRoutes from './routes/timetableSlot.routes.js';
import studentRoutes from './routes/student.routes.js';
import manageRoutes       from './routes/manage.routes.js';
import uploadRoutes       from './routes/upload.routes.js';
import pushRoutes from './routes/push.routes.js';



dotenv.config();

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      // Local development
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      // Production — add your Vercel URL here after deploying
      'https://your-app.vercel.app',
      // Allow all vercel preview deployments
    ];

    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    // In production allow all HTTPS origins temporarily
    // (tighten this after you know your exact Vercel URL)
    if (process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }

    if (allowed.includes(origin)) callback(null, true);
    else callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin',      req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods',     'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers',     'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});


app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Backend working on port 5000');
});

app.use('/api/auth', authRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/substitutions', substitutionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/timetable/admin/slot', slotRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/manage',  manageRoutes);
app.use('/api/upload',     uploadRoutes);
app.use('/api/push', pushRoutes);


app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Something went wrong' });
});

export default app;

import path            from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Works on Windows locally and Linux on Railway
app.use('/uploads', express.static(
  path.resolve(__dirname, '..', 'uploads')
));