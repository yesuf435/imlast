import React, { useState } from 'react';
import { User, Mail, Camera, Save, X } from 'lucide-react';
import { useAuth } from '../../store/useAuth';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../ui/LoadingSpinner';

interface UserProfileEditProps {
  onClose: () => void;
}

const UserProfileEdit: React.FC<UserProfileEditProps> = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    avatar: user?.avatar || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 检查文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.uploadFile(formData);
      
      setFormData(prev => ({
        ...prev,
        avatar: response.filePath
      }));
      
      toast.success('头像上传成功');
    } catch (error: any) {
      console.error('头像上传失败:', error);
      toast.error('头像上传失败: ' + (error.message || '未知错误'));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      toast.error('用户名不能为空');
      return;
    }

    try {
      setIsLoading(true);
      
      // 这里应该调用更新用户资料的API
      // const response = await api.updateUserProfile(formData);
      
      // 暂时直接更新本地状态
      updateUser(formData);
      
      toast.success('资料更新成功');
      onClose();
    } catch (error: any) {
      console.error('更新资料失败:', error);
      toast.error('更新资料失败: ' + (error.message || '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">编辑资料</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 头像 */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                {formData.avatar ? (
                  <img 
                    src={formData.avatar} 
                    alt="头像" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  formData.username[0]?.toUpperCase() || 'U'
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 cursor-pointer hover:bg-blue-600 transition-colors">
                <Camera className="h-3 w-3" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploadingAvatar}
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">头像</p>
              <p className="text-xs text-gray-500">点击相机图标更换头像</p>
            </div>
          </div>

          {/* 用户名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="h-4 w-4 inline mr-1" />
              用户名
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
              placeholder="请输入用户名"
              required
            />
          </div>

          {/* 邮箱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="h-4 w-4 inline mr-1" />
              邮箱
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
              placeholder="请输入邮箱"
            />
          </div>

          {/* 按钮 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploadingAvatar}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  保存
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileEdit;
