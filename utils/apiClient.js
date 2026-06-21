import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios/dist/axios.min.js';
import { API_URL } from '../config';

const client = {
  request: async (method, path, data = null, config = {}) => {
    let token = await AsyncStorage.getItem('@accessToken');
    const headers = Object.assign({}, config.headers || {}, token ? { Authorization: `Bearer ${token}` } : {});

    try {
      const res = await axios({ method, url: `${API_URL}${path}`, data, ...config, headers });
      return res;
    } catch (err) {
      // try refresh flow on 401
      if (err.response && err.response.status === 401) {
        const refreshToken = await AsyncStorage.getItem('@refreshToken');
        if (refreshToken) {
          try {
            const refreshRes = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
            if (refreshRes.data && refreshRes.data.success) {
              const newAccess = refreshRes.data.data.accessToken;
              await AsyncStorage.setItem('@accessToken', newAccess);
              headers.Authorization = `Bearer ${newAccess}`;
              const retry = await axios({ method, url: `${API_URL}${path}`, data, ...config, headers });
              return retry;
            }
          } catch (e) {
            // refresh failed, fall through to throw original error
          }
        }
      }
      throw err;
    }
  },

  uploadAvatar: async (formData, onProgress) => {
    let token = await AsyncStorage.getItem('@accessToken');
    const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'multipart/form-data' };

    try {
      const res = await axios.post(`${API_URL}/api/users/me/avatar`, formData, {
        headers,
        onUploadProgress: (ev) => {
          if (onProgress && ev && ev.total) {
            const pct = Math.round((ev.loaded * 100) / ev.total);
            onProgress(pct);
          }
        }
      });
      return res;
    } catch (err) {
      // try refresh similar to request
      if (err.response && err.response.status === 401) {
        const refreshToken = await AsyncStorage.getItem('@refreshToken');
        if (refreshToken) {
          try {
            const refreshRes = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
            if (refreshRes.data && refreshRes.data.success) {
              const newAccess = refreshRes.data.data.accessToken;
              await AsyncStorage.setItem('@accessToken', newAccess);
              const retry = await axios.post(`${API_URL}/api/users/me/avatar`, formData, { headers: { Authorization: `Bearer ${newAccess}`, 'Content-Type': 'multipart/form-data' } });
              return retry;
            }
          } catch (e) {
            // fallthrough
          }
        }
      }
      throw err;
    }
  }
,
  uploadPortfolio: async (formData, onProgress) => {
    let token = await AsyncStorage.getItem('@accessToken');
    const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'multipart/form-data' };
    try {
      const res = await axios.post(`${API_URL}/api/users/me/portfolio`, formData, {
        headers,
        onUploadProgress: (ev) => {
          if (onProgress && ev && ev.total) {
            const pct = Math.round((ev.loaded * 100) / ev.total);
            onProgress(pct);
          }
        }
      });
      return res;
    } catch (err) {
      throw err;
    }
  },

  deletePortfolio: async (url) => {
    return client.request('delete', '/api/users/me/portfolio', { url });
  },

  submitVerification: async (formData, onProgress) => {
    let token = await AsyncStorage.getItem('@accessToken');
    const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'multipart/form-data' };
    try {
      const res = await axios.post(`${API_URL}/api/users/me/verify`, formData, {
        headers,
        onUploadProgress: (ev) => {
          if (onProgress && ev && ev.total) {
            const pct = Math.round((ev.loaded * 100) / ev.total);
            onProgress(pct);
          }
        }
      });
      return res;
    } catch (err) {
      throw err;
    }
  },

  switchMode: async (mode) => {
    return client.request('post', '/api/users/me/switch-mode', { mode });
  },

  // Convenience methods for common HTTP verbs
  get: async (path, config = {}) => {
    return client.request('get', path, null, config);
  },

  post: async (path, data, config = {}) => {
    return client.request('post', path, data, config);
  },

  put: async (path, data, config = {}) => {
    return client.request('put', path, data, config);
  },

  patch: async (path, data, config = {}) => {
    return client.request('patch', path, data, config);
  },

  delete: async (path, config = {}) => {
    return client.request('delete', path, null, config);
  }
};

export default client;
