import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('API Request:', config.method?.toUpperCase(), config.url, 'Token:', token ? 'present' : 'missing');
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.config.url, response.status);
        return response;
    },
    (error) => {
        console.log('API Error:', error.config?.url, error.response?.status);
        if (error.response?.status === 401) {
            const isAuthRoute = error.config?.url?.includes('/auth/');
            if (!isAuthRoute) {
                localStorage.removeItem('token');
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (username, password) =>
        api.post('/auth/register', { username, password }),

    login: (username, password) =>
        api.post('/auth/login', { username, password }),

    verifyOTP: (username, otp) =>
        api.post('/auth/verify-otp', { username, otp }),

    getMe: () =>
        api.get('/auth/me'),
};

// Vault API
export const vaultAPI = {
    // Passwords
    storePassword: (name, website, username, password) =>
        api.post('/vault/passwords', { name, website, username, password }),

    getPasswords: () =>
        api.get('/vault/passwords'),

    getPassword: (id) =>
        api.get(`/vault/passwords/${id}`),

    deletePassword: (id) =>
        api.delete(`/vault/passwords/${id}`),

    // Files
    uploadFile: (name, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/vault/files?name=${encodeURIComponent(name)}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    getFiles: () =>
        api.get('/vault/files'),

    downloadFile: (id) =>
        api.get(`/vault/files/${id}/download`, {
            responseType: 'blob',
        }),

    verifyFile: (id) =>
        api.get(`/vault/files/${id}/verify`),

    // All items
    getAllItems: () =>
        api.get('/vault/items'),
};

export default api;
