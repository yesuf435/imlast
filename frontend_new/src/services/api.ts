import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { useAuth } from '../store/useAuth';

// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.api.interceptors.request.use(
      (config) => {
        const token = useAuth.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token过期，清除认证信息
          useAuth.getState().clearAuth();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // 用户认证相关
  async login(username: string, password: string) {
    const response: AxiosResponse = await this.api.post('/api/login', {
      username,
      password,
    });
    return response.data;
  }

  async register(username: string, password: string, email?: string) {
    const response: AxiosResponse = await this.api.post('/api/register', {
      username,
      password,
      email,
    });
    return response.data;
  }

  async getUserProfile() {
    const response: AxiosResponse = await this.api.get('/api/user/profile');
    return response.data;
  }

  // 用户相关
  async searchUsers(username: string) {
    const response: AxiosResponse = await this.api.get('/api/users/search', {
      params: { username },
    });
    return response.data;
  }

  // 好友相关
  async getFriends() {
    const response: AxiosResponse = await this.api.get('/api/friends');
    return response.data;
  }

  async sendFriendRequest(receiverId: string) {
    const response: AxiosResponse = await this.api.post('/api/friend-requests', {
      receiverId,
    });
    return response.data;
  }

  async getFriendRequests() {
    const response: AxiosResponse = await this.api.get('/api/friend-requests');
    return response.data;
  }

  async handleFriendRequest(requestId: string, status: 'accepted' | 'rejected') {
    const response: AxiosResponse = await this.api.put(`/api/friend-requests/${requestId}`, {
      status,
    });
    return response.data;
  }

  async deleteFriend(friendId: string) {
    const response: AxiosResponse = await this.api.delete(`/api/friends/${friendId}`);
    return response.data;
  }

  // 群组相关
  async createGroup(name: string, description?: string) {
    const response: AxiosResponse = await this.api.post('/api/groups/create', {
      name,
      description,
    });
    return response.data;
  }

  async getMyGroups() {
    const response: AxiosResponse = await this.api.get('/api/groups/my');
    return response.data;
  }

  async getGroupDetails(groupId: string) {
    const response: AxiosResponse = await this.api.get(`/api/groups/${groupId}`);
    return response.data;
  }

  async inviteToGroup(groupId: string, friendIds: string[]) {
    const response: AxiosResponse = await this.api.post(`/api/groups/${groupId}/invite`, {
      friendIds,
    });
    return response.data;
  }

  // 消息相关
  async getGroupMessages(groupId: string, limit = 50, before?: string) {
    const response: AxiosResponse = await this.api.get(`/api/groups/${groupId}/messages`, {
      params: { limit, before },
    });
    return response.data;
  }

  async sendGroupMessage(groupId: string, content: string, messageType = 'text') {
    const response: AxiosResponse = await this.api.post(`/api/groups/${groupId}/messages`, {
      content,
      messageType,
    });
    return response.data;
  }

  async sendPrivateMessage(receiverId: string, content: string, messageType = 'text') {
    const response: AxiosResponse = await this.api.post('/api/private-messages', {
      receiverId,
      content,
      messageType,
    });
    return response.data;
  }

  async getPrivateMessages(userId: string, limit = 50, before?: string) {
    const response: AxiosResponse = await this.api.get(`/api/private-messages/${userId}`, {
      params: { limit, before },
    });
    return response.data;
  }

  // 文件上传
  async uploadFile(file: FormData) {
    const response: AxiosResponse = await this.api.post('/api/upload/file', file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // 健康检查
  async healthCheck() {
    const response: AxiosResponse = await this.api.get('/health');
    return response.data;
  }
}

export const api = new ApiService();
