import { UserPlus, Users } from 'lucide-react';
import React from 'react';

interface FriendsListProps {
  searchQuery: string;
}

const FriendsList: React.FC<FriendsListProps> = ({ searchQuery }) => {
  // 这里应该从store获取好友列表
  const friends = [
    { id: '1', username: '张三', status: 'online' as const },
    { id: '2', username: '李四', status: 'offline' as const },
    { id: '3', username: '王五', status: 'online' as const },
  ];

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">好友列表</h3>
        <button 
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="添加好友"
        >
          <UserPlus className="h-5 w-5" />
        </button>
      </div>
      
      {filteredFriends.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>没有找到好友</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFriends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {friend.username[0]}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                  friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium text-gray-900">{friend.username}</p>
                <p className="text-sm text-gray-500">
                  {friend.status === 'online' ? '在线' : '离线'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsList;
