import api from './api.js';

// ── SIGN IN ────────────────────────────────────────────────────────────────
window.loginUser = async () => {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    alert('Please enter email and password');
    return;
  }

  const res = await api.post('/login', { email, password });

  if (res.success) {
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('userName', res.name);
    localStorage.setItem('userRole', res.role);

    // If first login → force change password
    if (res.isFirstLogin) {
      window.location.href = 'changepassword.html';
      return;
    }

    // Role-based redirect
    if (res.role === 'student')  window.location.href = 'dashboard.html';
    if (res.role === 'teacher')  window.location.href = 'dashboard.html';
    if (res.role === 'admin')    window.location.href = 'dashboard.html';

  } else {
    alert(res.message || 'Login failed');
  }
};

// ── SIGN UP ────────────────────────────────────────────────────────────────
window.registerUser = async () => {
  const name       = document.getElementById('name').value.trim();
  const email      = document.getElementById('email').value.trim();
  const password   = document.getElementById('signupPassword').value.trim();
  const role       = document.getElementById('role').value;
  const department = document.getElementById('department').value.trim();

  if (!name || !email || !password || !role) {
    alert('Please fill all required fields');
    return;
  }

  const body = { name, email, password, role, department };

  // Role-specific extra fields
  if (role === 'student') {
    body.section_id  = 1; // default — update with real section picker later
    body.enrollment  = document.getElementById('enrollment')?.value.trim() || '';
  }
  if (role === 'teacher') {
    body.designation = document.getElementById('designation')?.value.trim() || '';
  }
  if (role === 'admin') {
    body.role_type = 'general_admin';
  }

  const res = await api.post('/register', body);

  if (res.success) {
    alert('Account created successfully! Please sign in.');
    window.location.href = 'signin.html';
  } else {
    alert(res.message || 'Registration failed');
  }
};

// ── TOGGLE PASSWORD ────────────────────────────────────────────────────────
window.togglePassword = () => {
  const input = document.getElementById('password');
  input.type  = input.type === 'password' ? 'text' : 'password';
};

// ── LOGOUT ─────────────────────────────────────────────────────────────────
window.logoutUser = async () => {
  await api.post('/logout', {});
  localStorage.clear();
  window.location.href = 'signin.html';
};