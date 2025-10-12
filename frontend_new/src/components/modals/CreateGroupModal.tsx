import React from 'react';
import Modal from './Modal';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="创建群组">
      <div className="p-4">
        <p className="text-gray-500">创建群组功能开发中</p>
      </div>
    </Modal>
  );
};

export default CreateGroupModal;

