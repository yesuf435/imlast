import { Calendar, Mail, User } from 'lucide-react';
import React from 'react';
import Modal from './Modal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user }) => {
  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="个人资料">
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-2xl mx-auto mb-4">
            {user.username[0].toUpperCase()}
          </div>
          <h3 className="text-xl font-semibold text-gray-900">{user.username}</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <User className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">用户名</p>
              <p className="font-medium text-gray-900">{user.username}</p>
            </div>
          </div>

          {user.email && (
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">邮箱</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
            </div>
          )}

          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">状态</p>
              <p className="font-medium text-gray-900">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                {user.status === 'online' ? '在线' : '离线'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            关闭
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UserProfileModal;
