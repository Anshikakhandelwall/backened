import api from './api.js';

// ── SEND OTP ───────────────────────────────────────────────────────────────
window.sendOTP = async () => {
  const email = document.getElementById('email').value.trim();

  if (!email) {
    alert('Please enter your email');
    return;
  }

  const res = await api.post('/forgot', { email });

  if (res.success) {
    // Store email for next steps
    sessionStorage.setItem('resetEmail', email);
    alert('OTP sent to your email');
    window.location.href = 'otpverification.html';
  } else {
    alert(res.message || 'Could not send OTP');
  }
};

// ── VERIFY OTP ─────────────────────────────────────────────────────────────
window.verifyOTP = async () => {
  const email = sessionStorage.getItem('resetEmail');
  const otp   = document.getElementById('otp').value.trim();

  if (!otp) {
    alert('Please enter the OTP');
    return;
  }

  if (!email) {
    alert('Session expired. Please start again.');
    window.location.href = 'forgotpassword.html';
    return;
  }

  const res = await api.post('/verify-otp', { email, otp });

  if (res.success) {
    // Store OTP for reset step
    sessionStorage.setItem('resetOTP', otp);
    alert('OTP verified successfully');
    window.location.href = 'resetpassword.html';
  } else {
    alert(res.message || 'Invalid OTP');
  }
};

// ── RESET PASSWORD ─────────────────────────────────────────────────────────
window.resetPassword = async () => {
  const email       = sessionStorage.getItem('resetEmail');
  const otp         = sessionStorage.getItem('resetOTP');
  const newPassword = document.getElementById('newPassword').value.trim();
  const confirm     = document.getElementById('confirmPassword').value.trim();

  if (!newPassword || !confirm) {
    alert('Please fill all fields');
    return;
  }

  if (newPassword !== confirm) {
    alert('Passwords do not match');
    return;
  }

  if (newPassword.length < 8) {
    alert('Password must be at least 8 characters');
    return;
  }

  if (!email || !otp) {
    alert('Session expired. Please start again.');
    window.location.href = 'forgotpassword.html';
    return;
  }

  const res = await api.post('/reset', { email, otp, newPassword });

  if (res.success) {
    sessionStorage.clear();
    alert('Password reset successfully! Please sign in.');
    window.location.href = 'signin.html';
  } else {
    alert(res.message || 'Password reset failed');
  }
};