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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">好友列表</h3>
        <button 
          className="p-2 text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all duration-200"
          title="添加好友"
        >
          <UserPlus className="h-5 w-5" />
        </button>
      </div>
      
      {filteredFriends.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-slate-400 py-8">
          <Users className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-slate-600" />
          <p>没有找到好友</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFriends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-sm"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                  {friend.username[0]}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 shadow-sm ${
                  friend.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                }`} />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white">{friend.username}</p>
                  {friend.role === 'agent' && (
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded-full font-medium">
                      经纪人
                    </span>
                  )}
                  {friend.role === 'admin' && (
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded-full font-medium">
                      管理员
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400">
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
