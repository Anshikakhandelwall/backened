import express      from 'express';
import cookieParser from 'cookie-parser';
import dotenv       from 'dotenv';
import authRoutes   from './routes/auth.routes.js';
import cors         from 'cors';
import timetableRoutes    from './routes/timetable.routes.js';
import attendanceRoutes   from './routes/lectureAttendance.routes.js';
import substitutionRoutes from './routes/substitution.routes.js';
import eventRoutes        from './routes/event.routes.js';
import adminRoutes        from './routes/admin.routes.js';
import slotRoutes         from './routes/timetableSlot.routes.js';

dotenv.config();

const app = express();

// app.use(cors({
//   origin: 'http://127.0.0.1:3000',
//   credentials: true
// }));

app.use(cors({
  origin: ['http://127.0.0.1:3000', 'http://localhost:3000'],
  credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Backend working on port 5000');
});

app.use('/api/auth', authRoutes);
app.use('/api/timetable',     timetableRoutes);
app.use('/api/attendance',    attendanceRoutes);
app.use('/api/substitutions', substitutionRoutes);
app.use('/api/events',        eventRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/timetable/admin/slot', slotRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Something went wrong' });
});

export default app;