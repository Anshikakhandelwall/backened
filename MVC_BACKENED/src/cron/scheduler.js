import cron                   from 'node-cron';
import { checkUpcomingLectures } from '../services/PushService.js';

export const startCronJobs = () => {

  // ── Run every minute — check for lectures in 5 minutes ──────────────
  cron.schedule('* * * * *', async () => {
    await checkUpcomingLectures();
  });

  console.log('✅ Cron scheduler started — checking every minute for upcoming lectures');
};