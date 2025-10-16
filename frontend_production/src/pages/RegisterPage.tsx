import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../store/useAuth';

const RegisterPage: React.FC = () => {
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password || !formData.confirmPassword) {
      toast.error('请填写所有必填字段');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('密码长度至少6位');
      return;
    }

    try {
      await register(formData.username, formData.password, formData.email);
      toast.success('注册成功，请登录');
      window.location.href = '/login';
    } catch (error: any) {
      toast.error(error.message || '注册失败');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg-primary">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            IMCHAT
          </h1>
          <h2 className="text-2xl font-semibold text-indigo-100">
            创建账户
          </h2>
          <p className="mt-2 text-sm text-indigo-200">
            加入 IMCHAT，开始您的聊天之旅
          </p>
        </div>
        
        <form className="mt-8 space-y-6 bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white">
                用户名 *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-indigo-300" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 bg-white/20 border border-white/30 placeholder-indigo-200 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:z-10 sm:text-sm backdrop-blur-sm"
                  placeholder="请输入用户名"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white">
                邮箱
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-indigo-300" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 bg-white/20 border border-white/30 placeholder-indigo-200 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:z-10 sm:text-sm backdrop-blur-sm"
                  placeholder="请输入邮箱（可选）"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">
                密码 *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-indigo-300" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-10 py-3 bg-white/20 border border-white/30 placeholder-indigo-200 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:z-10 sm:text-sm backdrop-blur-sm"
                  placeholder="请输入密码（至少6位）"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-indigo-200 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">
                确认密码 *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-indigo-300" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-10 py-3 bg-white/20 border border-white/30 placeholder-indigo-200 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:z-10 sm:text-sm backdrop-blur-sm"
                  placeholder="请再次输入密码"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-indigo-200 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? '注册中...' : '注册'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-indigo-100">
              已有账户？{' '}
              <a href="/login" className="font-medium text-white hover:text-indigo-200 transition-colors">
                立即登录
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
