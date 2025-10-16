import { MoreVertical, Phone, Send, Video } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import { useAuth } from "../../store/useAuth";
import { useChat } from "../../store/useChat";
import LoadingSpinner from "../ui/LoadingSpinner";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

type Message = {
  id: string;
  sender_id: string;
  sender_name: string;
  message_type: "text" | "image" | "file";
  content: string;
  created_at: string;
};

const ChatArea: React.FC = () => {
  const { currentChat, messages } = useChat();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number>();

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || !currentChat.id || !user) return;

    setIsLoading(true);

    try {
      if (currentChat.type === "group") {
        await api.sendGroupMessage(currentChat.id, messageContent);
      } else {
        await api.sendPrivateMessage(currentChat.id, messageContent);
      }
    } catch (error: any) {
      console.error("发送消息失败:", error);
      toast.error("发送消息失败: " + (error.message || "未知错误"));
    } finally {
      setIsLoading(false);
    }
  };

  // 文件上传
  const handleFileUpload = async (file: File) => {
    // 检查文件大小（50MB限制）
    if (file.size > 50 * 1024 * 1024) {
      toast.error("文件大小不能超过50MB");
      return;
    }

    try {
      setIsLoading(true);

      // 上传文件
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await api.uploadFile(formData);

      // 发送文件消息
      if (currentChat.type === "group") {
        await api.sendGroupMessage(
          currentChat.id,
          uploadResponse.filePath,
          "file"
        );
      } else {
        await api.sendPrivateMessage(
          currentChat.id,
          uploadResponse.filePath,
          "file"
        );
      }

      toast.success("文件发送成功");
    } catch (error: any) {
      console.error("文件上传失败:", error);
      toast.error("文件上传失败: " + (error.message || "未知错误"));
    } finally {
      setIsLoading(false);
    }
  };

  // 如果没有选择聊天
  if (!currentChat.id) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white/95 backdrop-blur-sm">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Send className="h-12 w-12 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            欢迎使用IM聊天
          </h3>
          <p className="text-gray-600">选择一个聊天开始对话</p>
        </div>
      </div>
    );
  }

  const currentMessages = messages[currentChat.id] || [];

  return (
    <div className="flex-1 flex flex-col bg-white/95 backdrop-blur-sm shadow-lg">
      {/* 聊天头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white/90">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {currentChat.name[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{currentChat.name}</h3>
            <p className="text-sm text-gray-500">
              {currentChat.type === "group" ? "群聊" : "私聊"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="语音通话"
          >
            <Phone className="h-5 w-5" />
          </button>
          <button
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="视频通话"
          >
            <Video className="h-5 w-5" />
          </button>
          <button
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="更多"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-blue-50/30 to-white/50">
        {currentMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>还没有消息，开始对话吧！</p>
          </div>
        ) : (
          currentMessages.map((message: Message, index: number) => {
            const prevMessage =
              index > 0 ? currentMessages[index - 1] : undefined;
            const isOwn = message.sender_id === user?.id;
            const showAvatar =
              !prevMessage || prevMessage.sender_id !== message.sender_id;

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                prevMessage={prevMessage}
              />
            );
          })
        )}

        {isLoading && (
          <div className="flex justify-center">
            <LoadingSpinner size="sm" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onFileUpload={handleFileUpload}
        isLoading={isLoading}
        disabled={!currentChat.id}
        placeholder="输入消息..."
      />
    </div>
  );
};

export default ChatArea;
