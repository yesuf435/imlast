import React from 'react';
import Modal from './Modal';

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="好友请求">
      <div className="p-4">
        <p className="text-gray-500">暂无好友请求</p>
      </div>
    </Modal>
  );
};

export default FriendRequestsModal;

