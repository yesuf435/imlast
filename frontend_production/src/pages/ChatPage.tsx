import {
  Bell,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { socketService } from "../services/socket";
import { useAuth } from "../store/useAuth";
import { useChat } from "../store/useChat";

// 组件
import ConnectionStatus from "../components/auth/ConnectionStatus";
import UserProfileEdit from "../components/auth/UserProfileEdit";
import ChatArea from "../components/chat/ChatArea";
import FriendsList from "../components/chat/FriendsList";
import GroupsList from "../components/chat/GroupsList";
import RecentChats from "../components/chat/RecentChats";
import AddFriendModal from "../components/modals/AddFriendModal";
import CreateGroupModal from "../components/modals/CreateGroupModal";
import FriendRequestsModal from "../components/modals/FriendRequestsModal";
import UserProfileModal from "../components/modals/UserProfileModal";
import LoadingSpinner from "../components/ui/LoadingSpinner";

type ActiveTab = "chats" | "friends" | "groups" | "settings";

const ChatPage: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    currentChat,
    setFriends,
    setGroups,
    setFriendRequests,
    setOnlineUsers,
    addMessage,
  } = useChat();

  const [activeTab, setActiveTab] = useState<ActiveTab>("chats");
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showUserProfileEdit, setShowUserProfileEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // 初始化数据
  useEffect(() => {
    if (!user) return;

    loadInitialData();
    setupSocketListeners();

    return () => {
      socketService.disconnect();
    };
  }, [user]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // 并行加载数据
      const [friendsRes, groupsRes, requestsRes] = await Promise.all([
        api.getFriends(),
        api.getMyGroups(),
        api.getFriendRequests(),
      ]);

      setFriends(friendsRes.friends || []);
      setGroups(groupsRes.groups || []);
      setFriendRequests(requestsRes || { received: [], sent: [] });

      // 连接Socket
      if (user?.token) {
        await socketService.connect(user.token);
      }
    } catch (error: any) {
      console.error("加载数据失败:", error);
      toast.error("加载数据失败: " + (error.message || "未知错误"));
    } finally {
      setIsLoading(false);
    }
  };

  const setupSocketListeners = () => {
    // 监听用户列表更新
    socketService.onUserListUpdate((users) => {
      setOnlineUsers(users);
    });

    // 监听群组消息
    socketService.onGroupMessage((message) => {
      addMessage(message.group_id, message);

      // 如果不在当前聊天中，显示通知
      if (currentChat.type !== "group" || currentChat.id !== message.group_id) {
        toast.success(`${message.sender_name}: ${message.content}`, {
          duration: 3000,
        });
      }
    });

    // 监听私聊消息
    socketService.onPrivateMessage((message) => {
      const chatId = `private_${message.sender_id}`;
      addMessage(chatId, message);

      // 如果不在当前聊天中，显示通知
      if (
        currentChat.type !== "private" ||
        currentChat.id !== message.sender_id
      ) {
        toast.success(`${message.sender_name}: ${message.content}`, {
          duration: 3000,
        });
      }
    });

    // 监听好友请求
    socketService.onFriendRequest((data) => {
      toast.success(`${data.sender_username} 发送了好友请求`, {
        duration: 5000,
      });
      loadInitialData(); // 重新加载好友请求
    });

    // 监听群组邀请
    socketService.onGroupInvitation((data) => {
      toast.success(`${data.inviter_name} 邀请您加入群组 ${data.group_name}`, {
        duration: 5000,
      });
      loadInitialData(); // 重新加载群组列表
    });
  };

  const handleLogout = async () => {
    try {
      socketService.disconnect();
      await logout();
      toast.success("已退出登录");
    } catch (error) {
      console.error("退出登录失败:", error);
      toast.error("退出登录失败");
    }
  };

  const tabItems = [
    {
      key: "chats" as ActiveTab,
      icon: MessageSquare,
      label: "聊天",
      badge: 0,
    },
    {
      key: "friends" as ActiveTab,
      icon: Users,
      label: "好友",
      badge: 0,
    },
    {
      key: "groups" as ActiveTab,
      icon: MessageSquare,
      label: "群组",
      badge: 0,
    },
  ];

  const renderSidebarContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      );
    }

    switch (activeTab) {
      case "friends":
        return <FriendsList searchQuery={searchQuery} />;
      case "groups":
        return <GroupsList searchQuery={searchQuery} />;
      case "chats":
      default:
        return <RecentChats />;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* 主侧边栏 */}
      <div className="w-16 bg-gradient-to-b from-blue-600 to-blue-700 flex flex-col items-center py-4 shadow-lg">
        {/* 用户头像 */}
        <div className="mb-8">
          <div
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-semibold cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setShowUserProfile(true)}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              user.username[0].toUpperCase()
            )}
          </div>
          <ConnectionStatus className="mt-2" />
        </div>

        {/* 导航标签 */}
        <div className="space-y-4 flex-1">
          {tabItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  activeTab === item.key
                    ? "bg-white text-blue-600 shadow-md"
                    : "text-white hover:text-blue-100 hover:bg-blue-500"
                }`}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 底部操作 */}
        <div className="space-y-4">
          {/* 好友请求 */}
          <button
            onClick={() => setShowFriendRequests(true)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white hover:text-blue-100 hover:bg-blue-500 transition-all duration-200"
            title="好友请求"
          >
            <Bell className="h-5 w-5" />
          </button>

          {/* 添加好友 */}
          <button
            onClick={() => setShowAddFriend(true)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white hover:text-blue-100 hover:bg-blue-500 transition-all duration-200"
            title="添加好友"
          >
            <UserPlus className="h-5 w-5" />
          </button>

          {/* 设置 */}
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
              activeTab === "settings"
                ? "bg-white text-blue-600 shadow-md"
                : "text-white hover:text-blue-100 hover:bg-blue-500"
            }`}
            title="设置"
          >
            <Settings className="h-5 w-5" />
          </button>

          {/* 退出登录 */}
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white hover:text-red-200 hover:bg-red-500 transition-all duration-200"
            title="退出登录"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 侧边栏内容 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* 搜索栏 */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto">{renderSidebarContent()}</div>
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 flex flex-col">
        <ChatArea />
      </div>

      {/* 模态框 */}
      <FriendRequestsModal
        isOpen={showFriendRequests}
        onClose={() => setShowFriendRequests(false)}
      />

      <AddFriendModal
        isOpen={showAddFriend}
        onClose={() => setShowAddFriend(false)}
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />

      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        user={user}
        onEdit={() => {
          setShowUserProfile(false);
          setShowUserProfileEdit(true);
        }}
      />

      <UserProfileEdit
        isOpen={showUserProfileEdit}
        onClose={() => setShowUserProfileEdit(false)}
      />
    </div>
  );
};

export default ChatPage;
