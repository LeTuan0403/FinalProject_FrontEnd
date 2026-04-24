import axios from 'axios';

export const BASE_URL = ((import.meta as unknown as { env: { VITE_API_URL: string } }).env.VITE_API_URL || 'http://localhost:5000/api').trim().replace(/\/api\/?$/, '');

const axiosClient = axios.create({
  baseURL: ((import.meta as unknown as { env: { VITE_API_URL: string } }).env.VITE_API_URL || 'http://localhost:5000/api').trim(),
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('hoTen');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;