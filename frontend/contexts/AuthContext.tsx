'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, User } from '../lib/api';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, confirmPassword: string, displayName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication on app load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // Check if Firebase user is signed in and refresh token if needed
          if (auth.currentUser) {
            try {
              const idToken = await auth.currentUser.getIdToken(true); // Force refresh
              localStorage.setItem('authToken', idToken);
              console.log('Token refreshed successfully');
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              // If refresh fails, clear the token
              localStorage.removeItem('authToken');
              setUser(null);
              setLoading(false);
              return;
            }
          } else {
            // No current user, clear the token
            console.log('No current user found, clearing token');
            localStorage.removeItem('authToken');
            setUser(null);
            setLoading(false);
            return;
          }
          
          // Get user data from API
          const response = await authAPI.getCurrentUser();
          setUser(response.user);
          console.log('User data loaded:', response.user);
        } catch (error) {
          console.error('Failed to get current user:', error);
          localStorage.removeItem('authToken');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Periodic token refresh to prevent expiration
  useEffect(() => {
    const refreshTokenPeriodically = async () => {
      if (auth.currentUser) {
        try {
          const idToken = await auth.currentUser.getIdToken(true);
          localStorage.setItem('authToken', idToken);
          console.log('Token refreshed periodically');
        } catch (error) {
          console.error('Periodic token refresh failed:', error);
        }
      }
    };

    // Refresh token every 45 minutes (tokens expire after 1 hour)
    const interval = setInterval(refreshTokenPeriodically, 45 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);


  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      
      // Exchange custom token for ID token
      const userCredential = await signInWithCustomToken(auth, response.token);
      const idToken = await userCredential.user.getIdToken();
      
      localStorage.setItem('authToken', idToken);
      setUser(response.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (email: string, password: string, confirmPassword: string, displayName?: string) => {
    try {
      console.log('Attempting registration with:', { email, displayName });
      const response = await authAPI.register({ email, password, confirmPassword, displayName });
      console.log('Registration successful:', response);
      
      // Exchange custom token for ID token
      const userCredential = await signInWithCustomToken(auth, response.token);
      const idToken = await userCredential.user.getIdToken();
      
      localStorage.setItem('authToken', idToken);
      setUser(response.user);
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(error.response?.data?.error || error.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
