import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred.';
    if (error.response && error.response.data && error.response.data.detail) {
      message = error.response.data.detail;
    } else if (error.message) {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);

export const endpointsApi = {
  list: (params) => api.get('/endpoints', { params }),
  create: (data) => api.post('/endpoints', data),
  get: (id) => api.get(`/endpoints/${id}`),
  update: (id, data) => api.put(`/endpoints/${id}`, data),
  delete: (id) => api.delete(`/endpoints/${id}`),
  scan: (id) => api.post(`/endpoints/${id}/scan`),
};

export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

export const alertsApi = {
  list: (params) => api.get('/alerts', { params }),
  resolve: (id) => api.patch(`/alerts/${id}/resolve`),
};

export const reportsApi = {
  summary: () => api.get('/reports/summary'),
  exportCsvUrl: '/api/reports/export/csv',
  exportJsonUrl: '/api/reports/export/json',
};

export const demoApi = {
  getState: () => api.get('/demo/state'),
  reset: () => api.post('/demo/reset'),
  expiring: (days = 5) => api.post(`/demo/expiring?days=${days}`),
  legacyTls: (tlsVersion = 'TLS 1.0') => api.post(`/demo/legacy-tls?tls_version=${encodeURIComponent(tlsVersion)}`),
  weakCipher: (cipher = 'DES-CBC3-SHA') => api.post(`/demo/weak-cipher?cipher=${encodeURIComponent(cipher)}`),
  expired: (daysAgo = -5) => api.post(`/demo/expired?days_ago=${daysAgo}`),
};

export default api;
