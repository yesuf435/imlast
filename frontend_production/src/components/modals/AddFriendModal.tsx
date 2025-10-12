import { Search, UserPlus } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import Modal from './Modal';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const response = await api.searchUsers(searchQuery);
      setSearchResults(response.users || []);
    } catch (error: any) {
      toast.error('搜索失败: ' + (error.message || '未知错误'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await api.sendFriendRequest(userId);
      toast.success('好友请求已发送');
    } catch (error: any) {
      toast.error('发送失败: ' + (error.message || '未知错误'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="添加好友">
      <div className="space-y-4">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索用户名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isSearching ? '搜索中...' : '搜索'}
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {searchResults.length === 0 ? (
            <p className="text-gray-500 text-center py-4">暂无搜索结果</p>
          ) : (
            searchResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user.username[0]}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{user.username}</p>
                    {user.email && (
                      <p className="text-sm text-gray-500">{user.email}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleSendRequest(user.id)}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  title="发送好友请求"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AddFriendModal;
