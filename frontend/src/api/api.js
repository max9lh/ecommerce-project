// frontend/src/api/api.js
import axios from 'axios';

const isLocal = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:3000/api' : '/_/backend/api'),
  withCredentials: true, // Enviar cookies automáticamente (refresh token HttpOnly)
});

// Bandera para evitar refresh loops infinitos
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  isRefreshing = false;
  failedQueue = [];
};

// Request Interceptor: Agregar access token a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Manejar token expirado
api.interceptors.response.use(
  response => response,
  error => {
    const originalRequest = error.config;

    // Si es error 401, no es la ruta de refresh/login y no hemos intentado refresh todavía
    const isAuthRoute = originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isAuthRoute && !originalRequest._retry) {
      if (isRefreshing) {
        // Si ya estamos refrescando, encolar la request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // La cookie HttpOnly se envía automáticamente con withCredentials
      return api.post('/auth/refresh')
        .then(res => {
          const { accessToken } = res.data.data;
          localStorage.setItem('accessToken', accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          processQueue(null, accessToken);

          return api(originalRequest);
        })
        .catch(err => {
          // Si el refresh falla, logout
          localStorage.removeItem('accessToken');
          processQueue(err, null);
          window.location.href = '/login';
          return Promise.reject(err);
        });
    }

    return Promise.reject(error);
  }
);

export default api;
