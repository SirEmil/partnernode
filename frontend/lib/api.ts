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

// Handle auth errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Try to refresh the token
      const { auth } = await import('../lib/firebase');
      if (auth.currentUser) {
        try {
          const idToken = await auth.currentUser.getIdToken(true); // Force refresh
          localStorage.setItem('authToken', idToken);
          originalRequest.headers.Authorization = `Bearer ${idToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem('authToken');
          window.location.href = '/';
        }
      } else {
        localStorage.removeItem('authToken');
        window.location.href = '/';
      }
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
  callingNumber: string;
}

export interface UpdateSmsSettingsData {
  senderNumber: string;
  callingNumber: string;
}

// Pipeline interfaces
export interface Pipeline {
  id: string;
  name: string;
  description: string;
  assignedRepId: string;
  assignedRepEmail: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  items: PipelineItem[];
  stages: PipelineStage[];
}

export interface PipelineItem {
  id: string;
  name: string;
  description: string;
  order: number;
  type: string;
  config: any;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
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

// Pipelines API functions
export const pipelinesAPI = {
  getAll: async (): Promise<{ success: boolean; pipelines: Pipeline[] }> => {
    try {
      const response = await api.get('/api/pipelines');
      return response.data;
    } catch (error: any) {
      console.error('Pipelines API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  getById: async (id: string): Promise<{ success: boolean; pipeline: Pipeline }> => {
    const response = await api.get(`/api/pipelines/${id}`);
    return response.data;
  },

  create: async (data: { name: string; description: string; assignedRepId: string }): Promise<{ success: boolean; message: string; pipelineId: string }> => {
    const response = await api.post('/api/pipelines', data);
    return response.data;
  },

  update: async (id: string, data: { name?: string; description?: string; assignedRepId?: string; isActive?: boolean }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/api/pipelines/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/pipelines/${id}`);
    return response.data;
  },
};

export default api;
