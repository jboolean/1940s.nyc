import axios from 'axios';
import { API_BASE } from './apiConstants';

import useAuthStore from 'shared/stores/AuthStore';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const { jwt } = useAuthStore.getState();
  if (jwt) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    config.headers['Authorization'] = `Bearer ${jwt}`;
  }
  return config;
});

export default api;
