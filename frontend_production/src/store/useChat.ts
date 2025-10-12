import { create } from 'zustand';

interface Chat {
  id: string;
  name: string;
  type: 'private' | 'group';
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  message_type: 'text' | 'image' | 'file';
  content: string;
  created_at: string;
}

interface Friend {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  status: 'online' | 'offline';
  lastSeen?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  members: string[];
  created_at: string;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  sender_username: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface ChatState {
  // 当前聊天
  currentChat: Chat;
  
  // 消息列表
  messages: Record<string, Message[]>;
  
  // 好友列表
  friends: Friend[];
  
  // 群组列表
  groups: Group[];
  
  // 好友请求
  friendRequests: {
    received: FriendRequest[];
    sent: FriendRequest[];
  };
  
  // 在线用户
  onlineUsers: string[];
  
  // Actions
  setCurrentChat: (chat: Chat) => void;
  addMessage: (chatId: string, message: Message) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  setFriends: (friends: Friend[]) => void;
  setGroups: (groups: Group[]) => void;
  setFriendRequests: (requests: { received: FriendRequest[]; sent: FriendRequest[] }) => void;
  setOnlineUsers: (users: string[]) => void;
  updateFriendStatus: (friendId: string, status: 'online' | 'offline') => void;
}

export const useChat = create<ChatState>((set) => ({
  // 初始状态
  currentChat: { id: '', name: '', type: 'private' },
  messages: {},
  friends: [],
  groups: [],
  friendRequests: { received: [], sent: [] },
  onlineUsers: [],

  // Actions
  setCurrentChat: (chat) => set({ currentChat: chat }),
  
  addMessage: (chatId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: [...(state.messages[chatId] || []), message]
    }
  })),
  
  setMessages: (chatId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: messages
    }
  })),
  
  setFriends: (friends) => set({ friends }),
  setGroups: (groups) => set({ groups }),
  setFriendRequests: (friendRequests) => set({ friendRequests }),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  
  updateFriendStatus: (friendId, status) => set((state) => ({
    friends: state.friends.map(friend => 
      friend.id === friendId ? { ...friend, status } : friend
    )
  })),
}));
