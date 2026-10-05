import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// -----------------------------------------
// REQUEST INTERCEPTOR
// -----------------------------------------

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// -----------------------------------------
// RESPONSE INTERCEPTOR
// -----------------------------------------

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      const isClientPortal =
        window.location.pathname.startsWith('/client');

      if (isClientPortal) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        if (
          window.location.pathname !== '/client/login'
        ) {
          window.location.href = '/client/login';
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        if (
          window.location.pathname !== '/login'
        ) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;