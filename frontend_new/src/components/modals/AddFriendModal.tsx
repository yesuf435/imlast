import React from 'react';
import Modal from './Modal';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="添加好友">
      <div className="p-4">
        <p className="text-gray-500">添加好友功能开发中</p>
      </div>
    </Modal>
  );
};

export default AddFriendModal;

