import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';

interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  status: 'online' | 'offline';
  token?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  lastActivity: number;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => void;
  initializeAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshToken: () => Promise<boolean>;
  updateActivity: () => void;
  checkTokenExpiry: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      lastActivity: Date.now(),

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.login(username, password);
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            lastActivity: Date.now(),
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message || '登录失败');
        }
      },

      register: async (username: string, password: string, email?: string) => {
        set({ isLoading: true });
        try {
          await api.register(username, password, email);
          set({ isLoading: false });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message || '注册失败');
        }
      },

      logout: async () => {
        try {
          // 这里可以调用后端的登出API
          // await api.logout();
        } catch (error) {
          console.error('登出API调用失败:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      initializeAuth: async () => {
        const { token, user } = get();
        if (token && user) {
          try {
            // 验证token是否有效
            const response = await api.getUserProfile();
            set({ 
              isAuthenticated: true,
              user: response.user,
              lastActivity: Date.now()
            });
          } catch (error) {
            // Token无效，清除认证信息
            get().clearAuth();
          }
        }
      },

      refreshToken: async () => {
        try {
          const response = await api.getUserProfile();
          set({
            user: response.user,
            lastActivity: Date.now()
          });
          return true;
        } catch (error) {
          get().clearAuth();
          return false;
        }
      },

      updateActivity: () => {
        set({ lastActivity: Date.now() });
      },

      checkTokenExpiry: () => {
        const { lastActivity } = get();
        const now = Date.now();
        const TOKEN_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24小时
        
        if (now - lastActivity > TOKEN_EXPIRY_TIME) {
          get().clearAuth();
          return false;
        }
        return true;
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...userData }
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity,
      }),
    }
  )
);
