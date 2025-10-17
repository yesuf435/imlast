import { MessageSquare, User, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import { useAuth } from "../../store/useAuth";
import { useChat } from "../../store/useChat";

interface ChatItem {
  id: string;
  name: string;
  type: "private" | "group";
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  avatar?: string;
  isOnline?: boolean;
}

const RecentChats: React.FC = () => {
  const { currentChat, setCurrentChat, friends, groups, setMessages } =
    useChat();
  const { user } = useAuth();
  const [recentChats, setRecentChats] = useState<ChatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecentChats();
  }, [friends, groups]);

  const loadRecentChats = async () => {
    try {
      setIsLoading(true);
      const chats: ChatItem[] = [];

      // 添加好友聊天
      friends.forEach((friend) => {
        chats.push({
          id: friend.id,
          name: friend.username,
          type: "private",
          unreadCount: 0,
          isOnline: friend.isOnline || false,
          avatar: friend.avatar,
        });
      });

      // 添加群组聊天
      groups.forEach((group) => {
        chats.push({
          id: group.id,
          name: group.name,
          type: "group",
          unreadCount: 0,
          avatar: group.avatar,
        });
      });

      // 按最后消息时间排序（这里简化处理）
      chats.sort((a, b) => {
        if (a.lastMessageTime && b.lastMessageTime) {
          return (
            new Date(b.lastMessageTime).getTime() -
            new Date(a.lastMessageTime).getTime()
          );
        }
        return 0;
      });

      setRecentChats(chats);
    } catch (error) {
      console.error("加载最近聊天失败:", error);
      toast.error("加载聊天列表失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSelect = async (chat: ChatItem) => {
    try {
      // 设置当前聊天
      setCurrentChat({
        id: chat.id,
        name: chat.name,
        type: chat.type,
        avatar: chat.avatar,
      });

      // 加载聊天历史
      if (chat.type === "private") {
        const response = await api.getPrivateMessages(chat.id);
        setMessages(chat.id, response.messages || []);
      } else {
        const response = await api.getGroupMessages(chat.id);
        setMessages(chat.id, response.messages || []);
      }
    } catch (error) {
      console.error("加载聊天失败:", error);
      toast.error("加载聊天失败");
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recentChats.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>还没有聊天记录</p>
        <p className="text-sm">添加好友或创建群组开始聊天</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
        最近聊天
      </h3>
      <div className="space-y-1">
        {recentChats.map((chat) => (
          <button
            key={`${chat.type}_${chat.id}`}
            onClick={() => handleChatSelect(chat)}
            className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
              currentChat.id === chat.id && currentChat.type === chat.type
                ? "bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 shadow-md"
                : "hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:shadow-sm"
            }`}
          >
            {/* 头像 */}
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {chat.avatar ? (
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  chat.name[0].toUpperCase()
                )}
              </div>
              {/* 在线状态指示器 */}
              {chat.type === "private" && chat.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-slate-800 rounded-full shadow-sm"></div>
              )}
            </div>

            {/* 聊天信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {chat.name}
                </h4>
                {chat.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                    {chat.unreadCount}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                  {chat.lastMessage || "还没有消息"}
                </p>
                {chat.lastMessageTime && (
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    {new Date(chat.lastMessageTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* 聊天类型图标 */}
            <div className="flex-shrink-0">
              {chat.type === "group" ? (
                <Users className="h-4 w-4 text-gray-400 dark:text-slate-500" />
              ) : (
                <User className="h-4 w-4 text-gray-400 dark:text-slate-500" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentChats;
