import express      from 'express';
import cookieParser from 'cookie-parser';
import dotenv       from 'dotenv';
import authRoutes   from './routes/auth.routes.js';
import cors         from 'cors';

dotenv.config();

const app = express();

// app.use(cors({
//   origin: 'http://127.0.0.1:3000',
//   credentials: true
// }));

app.use(cors({
  origin: ['http://127.0.0.1:3000', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Backend working on port 5000');
});

app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Something went wrong' });
});

export default app;