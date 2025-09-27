import axios from 'axios';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to mask sensitive data in logs
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Mask password in request data for logging (doesn't affect actual request)
  if (config.data && config.data.password) {
    const maskedData = { ...config.data, password: '***MASKED***' };
    console.log('API Request:', config.url, maskedData);
  }
  
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: string;
  authLevel?: number; // 0 = no settings access, 1 = full access
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  smsTemplate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  currency: string;
  smsTemplate: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  smsTemplate?: string;
}

export interface Terms {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreateTermsData {
  name: string;
  url: string;
}

export interface UpdateTermsData {
  name?: string;
  url?: string;
}

// SMS Settings interfaces
export interface SmsSettings {
  senderNumber: string;
}

export interface UpdateSmsSettingsData {
  senderNumber: string;
}

// Auth API functions
export const authAPI = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    console.log('Sending registration request to:', `${API_BASE_URL}/api/auth/register`);
    console.log('Registration data:', { email: data.email, displayName: data.displayName });
    const response = await api.post('/api/auth/register', data);
    console.log('Registration response:', response.data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Products API functions
export const productsAPI = {
  getAll: async (): Promise<{ success: boolean; data: Product[] }> => {
    try {
      const response = await api.get('/api/products');
      return response.data;
    } catch (error: any) {
      console.error('Products API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  getById: async (id: string): Promise<{ success: boolean; data: Product }> => {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  },

  create: async (data: CreateProductData): Promise<{ success: boolean; message: string; data: Product }> => {
    const response = await api.post('/api/products', data);
    return response.data;
  },

  update: async (id: string, data: UpdateProductData): Promise<{ success: boolean; message: string; data: Product }> => {
    const response = await api.put(`/api/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/products/${id}`);
    return response.data;
  },
};

// Terms API functions
export const termsAPI = {
  getAll: async (): Promise<{ success: boolean; data: Terms[] }> => {
    try {
      const response = await api.get('/api/terms');
      return response.data;
    } catch (error: any) {
      console.error('Terms API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  getById: async (id: string): Promise<{ success: boolean; data: Terms }> => {
    const response = await api.get(`/api/terms/${id}`);
    return response.data;
  },

  create: async (data: CreateTermsData): Promise<{ success: boolean; message: string; data: Terms }> => {
    const response = await api.post('/api/terms', data);
    return response.data;
  },

  update: async (id: string, data: UpdateTermsData): Promise<{ success: boolean; message: string; data: Terms }> => {
    const response = await api.put(`/api/terms/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/terms/${id}`);
    return response.data;
  },
};

// SMS Settings API functions
export const smsSettingsAPI = {
  get: async (): Promise<{ success: boolean; data: SmsSettings }> => {
    try {
      const response = await api.get('/api/sms-settings');
      return response.data;
    } catch (error: any) {
      console.error('SMS Settings API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  update: async (data: UpdateSmsSettingsData): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.put('/api/sms-settings', data);
      return response.data;
    } catch (error: any) {
      console.error('SMS Settings API Error:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default api;
