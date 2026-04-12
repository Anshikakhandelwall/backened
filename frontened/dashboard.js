// ── AUTH GUARD ─────────────────────────────────────────────────────────────
const token = localStorage.getItem('accessToken');
if (!token) window.location.href = 'signin.html';

// ── POPULATE USER INFO ─────────────────────────────────────────────────────
const userName = localStorage.getItem('userName') || 'Student';
const userRole = localStorage.getItem('userRole') || 'student';

const avatarEl = document.querySelector('.avatar');
const nameEl = document.querySelector('.profile h4');
const roleEl = document.querySelector('.role');

if (avatarEl) avatarEl.textContent = userName.charAt(0).toUpperCase();
if (nameEl) nameEl.textContent = userName;
if (roleEl) roleEl.textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);

// ── DATE & GREETING ────────────────────────────────────────────────────────
const now = new Date();
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

const dateEl = document.getElementById('date');
if (dateEl) dateEl.textContent = dateStr;

const todayDayEl = document.getElementById('todayDay');
if (todayDayEl) todayDayEl.textContent = days[now.getDay()].toUpperCase();

const hour = now.getHours();
const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

const greetEl = document.getElementById('greetingText');
if (greetEl) greetEl.textContent = `${greeting}, ${userName.split(' ')[0]}! 👋`;