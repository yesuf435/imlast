import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const socketUrl =
        import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

      this.socket = io(socketUrl, {
        auth: {
          token,
        },
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true,
      });

      this.socket.on("connect", () => {
        console.log("Socket连接成功");
        this.isConnected = true;
        this.socket?.emit("login", { token });
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("Socket连接失败:", error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on("disconnect", (reason) => {
        console.log("Socket断开连接:", reason);
        this.isConnected = false;
      });

      this.socket.on("login_success", (data) => {
        console.log("Socket登录成功:", data);
      });

      this.socket.on("login_error", (error) => {
        console.error("Socket登录失败:", error);
        this.disconnect();
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // 加入群组房间
  joinGroup(groupId: string) {
    if (this.socket) {
      this.socket.emit("join_group", groupId);
    }
  }

  // 离开群组房间
  leaveGroup(groupId: string) {
    if (this.socket) {
      this.socket.emit("leave_group", groupId);
    }
  }

  // 发送打字状态
  emitTyping(chatId: string, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit("typing", { chatId, isTyping });
    }
  }

  // 监听用户列表更新
  onUserListUpdate(callback: (users: string[]) => void) {
    if (this.socket) {
      this.socket.on("userList", callback);
    }
  }

  // 监听群组消息
  onGroupMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on("group_message", callback);
    }
  }

  // 监听私聊消息
  onPrivateMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on("private_message", callback);
    }
  }

  // 监听好友请求
  onFriendRequest(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("friend_request", callback);
    }
  }

  // 监听好友接受
  onFriendAccepted(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("friend_accepted", callback);
    }
  }

  // 监听群组邀请
  onGroupInvitation(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("group_invitation", callback);
    }
  }

  // 监听好友上线
  onFriendOnline(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("friend_online", callback);
    }
  }

  // 监听好友下线
  onFriendOffline(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("friend_offline", callback);
    }
  }

  // 监听打字状态
  onTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("typing", callback);
    }
  }

  // 移除所有事件监听器
  off(event: string) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  // 获取连接状态
  get connected() {
    return this.isConnected && this.socket?.connected;
  }

  // 获取socket实例
  get socketInstance() {
    return this.socket;
  }
}

export const socketService = new SocketService();
