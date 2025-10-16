import { Eye, EyeOff, Lock, User } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../store/useAuth';

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error('请填写所有字段');
      return;
    }

    try {
      await login(formData.username, formData.password);
      toast.success('登录成功');
    } catch (error: any) {
      toast.error(error.message || '登录失败');
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
            欢迎回来
          </h2>
          <p className="mt-2 text-sm text-indigo-200">
            登录您的账户开始聊天
          </p>
        </div>
        
        <form className="mt-8 space-y-6 bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white">
                用户名
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
              <label htmlFor="password" className="block text-sm font-medium text-white">
                密码
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
                  placeholder="请输入密码"
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
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-indigo-100">
              还没有账户？{' '}
              <a href="/register" className="font-medium text-white hover:text-indigo-200 transition-colors">
                立即注册
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
