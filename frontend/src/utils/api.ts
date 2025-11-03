import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors - disabled auto-redirect to prevent loops
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Just log 401 errors, don't auto-redirect
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - token may be invalid');
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Generation {
  id: number;
  user_id: number;
  prompt: string;
  style: string;
  image_url: string;
  status: string;
  created_at: string;
}

export interface ErrorResponse {
  message: string;
  errors?: unknown[];
}

export const authAPI = {
  signup: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/signup', { email, password });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },
};

export const generationsAPI = {
  create: async (
    image: File,
    prompt: string,
    style: string,
    signal?: AbortSignal
  ): Promise<Generation> => {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('prompt', prompt);
    formData.append('style', style);

    const response = await api.post<Generation>('/generations', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      signal,
    });
    return response.data;
  },

  getRecent: async (limit = 5): Promise<Generation[]> => {
    const response = await api.get<Generation[]>(`/generations?limit=${limit}`);
    return response.data;
  },
};

export default api;

