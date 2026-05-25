const BASE_URL = 'https://backened-production-b558.up.railway.app/api/auth';

const api = {

  post: async (endpoint, body) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // sends httpOnly cookie for refresh token
      body: JSON.stringify(body),
    });
    return res.json();
  },

  get: async (endpoint) => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });
    return res.json();
  },

};

export default api;