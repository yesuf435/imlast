import { MessageSquare, Plus } from 'lucide-react';
import React from 'react';

interface GroupsListProps {
  searchQuery: string;
}

const GroupsList: React.FC<GroupsListProps> = ({ searchQuery }) => {
  // 这里应该从store获取群组列表
  const groups = [
    { id: '1', name: '工作群', members: ['张三', '李四', '王五'] },
    { id: '2', name: '朋友群', members: ['张三', '李四'] },
    { id: '3', name: '家庭群', members: ['张三', '王五'] },
  ];

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">群组列表</h3>
        <button 
          className="p-2 text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all duration-200"
          title="创建群组"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      
      {filteredGroups.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-slate-400 py-8">
          <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-slate-600" />
          <p>没有找到群组</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="flex items-center p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-sm"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                {group.name[0]}
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{group.name}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {group.members.length} 名成员
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupsList;
