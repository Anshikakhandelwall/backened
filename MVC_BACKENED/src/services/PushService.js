import webpush  from 'web-push';
import dotenv   from 'dotenv';
import db       from '../config/db.js';
import PushModel from '../models/PushModel.js';

dotenv.config();

// ── Configure VAPID ────────────────────────────────────────────────────
if (process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('✅ Push notifications configured');
} else {
  console.warn('⚠️ VAPID keys missing — push notifications disabled');
}

// ── Send push to one subscription ─────────────────────────────────────
const sendPush = async (subscription, payload) => {
  try {
    const pushSub = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth:   subscription.auth,
      },
    };
    await webpush.sendNotification(pushSub, JSON.stringify(payload));
    return true;
  } catch (err) {
    if (err.statusCode === 410) {
      // Subscription expired — delete it
      await db.query(
        `DELETE FROM push_subscriptions WHERE endpoint = ?`,
        [subscription.endpoint]
      );
    }
    return false;
  }
};

// ── Send to entire section ─────────────────────────────────────────────
export const notifySection = async (sectionId, payload) => {
  const subscriptions = await PushModel.getBySection(sectionId);
  const results = await Promise.all(
    subscriptions.map(sub => sendPush(sub, payload))
  );
  return results.filter(Boolean).length;
};

// ── Send to specific user ──────────────────────────────────────────────
export const notifyUser = async (userId, payload) => {
  const sub = await PushModel.getByUser(userId);
  if (!sub) return false;
  return sendPush(sub, payload);
};

// ── Send to teacher ────────────────────────────────────────────────────
export const notifyTeacher = async (teacherId, payload) => {
  const sub = await PushModel.getByTeacher(teacherId);
  if (!sub) return false;
  return sendPush(sub, payload);
};

// ── 5-MINUTE LECTURE ALERT CRON ───────────────────────────────────────
// Called every minute by the cron job
export const checkUpcomingLectures = async () => {
  try {
    // Find all lectures starting in exactly 5 minutes
    const [lectures] = await db.query(
      `SELECT
         ts.slot_id,
         ts.section_id,
         ts.teacher_id,
         ts.start_time,
         ts.end_time,
         ts.room,
         ts.slot_type,
         s.subject_name,
         u.name AS teacher_name,
         DAYNAME(NOW()) AS today
       FROM timetable_slots ts
       JOIN subjects s ON ts.subject_id = s.subject_id
       JOIN teachers t ON ts.teacher_id = t.teacher_id
       JOIN users    u ON t.teacher_id  = u.user_id
       WHERE ts.day_of_week = DAYNAME(NOW())
         AND TIME(ts.start_time) = TIME(DATE_ADD(NOW(), INTERVAL 5 MINUTE))`
    );

    if (!lectures.length) return;

    console.log(`🔔 Found ${lectures.length} lecture(s) starting in 5 minutes`);

    for (const lecture of lectures) {
      const payload = {
        title: `⏰ Class in 5 minutes`,
        body:  `${lecture.subject_name} — ${lecture.room || 'TBD'} | ${lecture.teacher_name}`,
        icon:  '/icon-192.png',
        badge: '/badge-72.png',
        data: {
          type:        'upcoming_lecture',
          subject:     lecture.subject_name,
          teacher:     lecture.teacher_name,
          room:        lecture.room,
          start_time:  lecture.start_time,
          end_time:    lecture.end_time,
          url:         '/dashboard.html',
        },
      };

      // Notify all students in this section
      const count = await notifySection(lecture.section_id, payload);
      console.log(`✓ Sent to ${count} students in section ${lecture.section_id}`);

      // Also notify the teacher
      const teacherPayload = {
        title: `📚 Your class starts in 5 minutes`,
        body:  `${lecture.subject_name} — ${lecture.room || 'TBD'}`,
        icon:  '/icon-192.png',
        data: {
          type: 'upcoming_lecture',
          url:  '/teacher-dashboard.html',
        },
      };
      await notifyTeacher(lecture.teacher_id, teacherPayload);

      // Log notification in DB
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message)
         SELECT student_id, 'upcoming_lecture',
           '⏰ Class in 5 minutes',
           CONCAT(?, ' starts at ', ?, ' in ', IFNULL(?, 'TBD'))
         FROM students WHERE section_id = ?`,
        [
          lecture.subject_name,
          lecture.start_time,
          lecture.room,
          lecture.section_id,
        ]
      );
    }

  } catch (err) {
    console.error('checkUpcomingLectures error:', err);
  }
};

// ── SUBSTITUTION NOTIFICATION ──────────────────────────────────────────
export const notifySubstitution = async ({
  sectionId, originalTeacher, substituteName,
  subjectName, startTime, room,
}) => {
  const payload = {
    title: `🔁 Teacher Change`,
    body:  `${subjectName} at ${startTime}: ${substituteName} will take class instead of ${originalTeacher}`,
    icon:  '/icon-192.png',
    data:  { type: 'substitution', url: '/dashboard.html' },
  };
  return notifySection(sectionId, payload);
};

// ── EVENT CONFLICT NOTIFICATION ────────────────────────────────────────
export const notifyEventConflict = async ({
  sectionId, eventName, subjectName, startTime,
}) => {
  const payload = {
    title: `🎉 Class Replaced by Event`,
    body:  `${subjectName} at ${startTime} is replaced by: ${eventName}`,
    icon:  '/icon-192.png',
    data:  { type: 'event_conflict', url: '/events.html' },
  };
  return notifySection(sectionId, payload);
};

export default {
  notifySection,
  notifyUser,
  notifyTeacher,
  checkUpcomingLectures,
  notifySubstitution,
  notifyEventConflict,
};

