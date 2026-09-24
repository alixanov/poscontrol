import axios from 'axios';

export const getApiBaseUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    if (typeof window !== 'undefined') {
      return '/api';
    }
    return 'http://localhost:4000/api';
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  if (!url.endsWith('/api')) {
    url = `${url.replace(/\/+$/, '')}/api`;
  }
  return url;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle token expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const res = await axios.post(
              `${getApiBaseUrl()}/auth/refresh`,
              { refreshToken },
            );
            localStorage.setItem('accessToken', res.data.accessToken);
            localStorage.setItem('refreshToken', res.data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return api(originalRequest);
          } catch (refreshErr) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('authUser');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('authUser');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
