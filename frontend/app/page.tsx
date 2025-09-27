'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Phone, MessageSquare, BarChart3, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      if (isLogin) {
        await login(data.email as string, data.password as string);
        toast.success('Login successful!');
      } else {
        await register(
          data.email as string, 
          data.password as string, 
          data.confirmPassword as string,
          data.displayName as string || undefined
        );
        toast.success('Registration successful!');
      }
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold mb-8 leading-tight text-white drop-shadow-lg">
              Accelerate Your Sales Pipeline
            </h1>
            <p className="text-xl mb-10 text-white/95 leading-relaxed font-medium drop-shadow-md">
              Seamlessly integrate your CRM with enterprise-grade SMS automation. 
              Transform leads into contracts with unprecedented efficiency and precision.
            </p>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-white drop-shadow-md">Instant Contract Delivery</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-white drop-shadow-md">Enterprise-Grade Simplicity</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-white drop-shadow-md">Seamless CRM Integration</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 right-10 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 bg-white">
        <div className="mx-auto w-full max-w-md">
          {/* Logo/Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-6 shadow-lg">
              <Phone className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              {isLogin 
                ? 'Sign in to your account to continue' 
                : 'Create your account to get started'
              }
            </p>
          </div>

          {/* Auth Form */}
          <div className="card shadow-xl border-0">
            <div className="card-content">
              <form onSubmit={handleSubmit} className="space-y-7 pt-6">
                <div>
                  <label htmlFor="email" className="block text-base font-semibold text-gray-800 mb-3">
                    Email Address
                  </label>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="input flex-1 h-12 text-base border-2 border-gray-200 focus:border-blue-500"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-base font-semibold text-gray-800 mb-3">
                    Password
                  </label>
                  <div className="flex items-center space-x-3">
                    <Lock className="w-5 h-5 text-gray-500" />
                    <div className="relative flex-1">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="input w-full h-12 pr-12 text-base border-2 border-gray-200 focus:border-blue-500"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-base font-semibold text-gray-800 mb-3">
                      Confirm Password
                    </label>
                    <div className="flex items-center space-x-3">
                      <Lock className="w-5 h-5 text-gray-500" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required={!isLogin}
                        className="input flex-1 h-12 text-base border-2 border-gray-200 focus:border-blue-500"
                        placeholder="Confirm your password"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-lg rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-base transition-colors"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Features for mobile */}
          <div className="mt-10 lg:hidden">
            <div className="grid grid-cols-1 gap-5">
              <div className="flex items-center space-x-4 p-5 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Instant Contract Delivery</h3>
                  <p className="text-gray-600">Enterprise SMS automation</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-5 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Enterprise-Grade Simplicity</h3>
                  <p className="text-gray-600">Professional user experience</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-5 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Seamless CRM Integration</h3>
                  <p className="text-gray-600">Advanced connectivity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
