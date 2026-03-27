import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  me: () => api.get('/auth/me').then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  getStravaAuthUrl: () => `${BASE_URL}/auth/strava`,
};

// ── Activities ────────────────────────────────────────────────────────────────

export const activitiesApi = {
  list: (params) => api.get('/activities', { params }).then((r) => r.data),
  get: (id) => api.get(`/activities/${id}`).then((r) => r.data),
  stats: () => api.get('/activities/stats').then((r) => r.data),
  types: () => api.get('/activities/types').then((r) => r.data),
  syncStatus: () => api.get('/activities/sync-status').then((r) => r.data),
  startSync: () => api.post('/activities/sync').then((r) => r.data),
};

// ── Compare ───────────────────────────────────────────────────────────────────

export const compareApi = {
  compare: ({ sportTypes, ...rest }) => {
    const p = { ...rest };
    if (sportTypes?.length) p.sportTypes = sportTypes.join(',');
    return api.get('/compare', { params: p }).then((r) => r.data);
  },
};

export default api;
