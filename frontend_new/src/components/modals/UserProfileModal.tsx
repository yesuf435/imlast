import React from 'react';
import Modal from './Modal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="个人资料">
      <div className="p-4">
        <p className="text-gray-500">个人资料功能开发中</p>
      </div>
    </Modal>
  );
};

export default UserProfileModal;

