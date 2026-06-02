import axios from 'axios';

const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:3000/api' : '/_/backend/api'), 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Si da 401 No autorizado y no hemos reintentado todavía...
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;
      const refresh_token = localStorage.getItem('refresh_token');
      
      if (refresh_token) {
        try {
          // Llamar al endpoint de refresh
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token });
          const new_token = res.data.data.token;
          const new_refresh_token = res.data.data.refresh_token;
          
          localStorage.setItem('token', new_token);
          localStorage.setItem('refresh_token', new_refresh_token);
          
          // Actualizar la cabecera original y reintentar
          originalRequest.headers.Authorization = `Bearer ${new_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Si falla el refresh, forzamos cierre de sesión
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/';
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.removeItem('token');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
