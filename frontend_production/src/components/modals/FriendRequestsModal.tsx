import React from 'react';
import Modal from './Modal';

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({ isOpen, onClose }) => {
  // 这里应该从store获取好友请求
  const friendRequests = [
    { id: '1', sender_username: '张三', created_at: '2024-01-01' },
    { id: '2', sender_username: '李四', created_at: '2024-01-02' },
  ];

  const handleAccept = (requestId: string) => {
    console.log('Accept friend request:', requestId);
  };

  const handleReject = (requestId: string) => {
    console.log('Reject friend request:', requestId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="好友请求">
      <div className="space-y-3">
        {friendRequests.length === 0 ? (
          <p className="text-gray-500 text-center py-4">暂无好友请求</p>
        ) : (
          friendRequests.map((request) => (
            <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{request.sender_username}</p>
                <p className="text-sm text-gray-500">{request.created_at}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAccept(request.id)}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                >
                  接受
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  拒绝
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

export default FriendRequestsModal;
