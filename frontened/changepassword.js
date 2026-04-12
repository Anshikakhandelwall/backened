import api from './api.js';

window.changePassword = async () => {
  const currentPassword = document.getElementById('currentPassword').value.trim();
  const newPassword = document.getElementById('newPassword').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    alert('Please fill all fields');
    return;
  }

  if (newPassword !== confirmPassword) {
    alert('New passwords do not match');
    return;
  }

  if (newPassword.length < 8) {
    alert('Password must be at least 8 characters');
    return;
  }

  // Use the reset endpoint — verify current via login first
  const email = localStorage.getItem('userEmail');
  const token = localStorage.getItem('accessToken');

  const res = await fetch('http://localhost:5000/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await res.json();

  if (data.success) {
    alert('Password changed successfully!');
    window.location.href = 'dashboard.html';
  } else {
    alert(data.message || 'Password change failed');
  }
};