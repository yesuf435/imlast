import {
    FileText,
    Image as ImageIcon,
    MoreVertical,
    Paperclip,
    Phone,
    Send,
    Smile,
    Video,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { useAuth } from '../../store/useAuth';
import { useChat } from '../../store/useChat';
import LoadingSpinner from '../ui/LoadingSpinner';

type Message = {
  id: string;
  sender_id: string;
  sender_name: string;
  message_type: 'text' | 'image' | 'file';
  content: string;
  created_at: string;
};

const ChatArea: React.FC = () => {
  const { currentChat, messages } = useChat();
  const { user } = useAuth();

  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number>();

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentChat.id || !user) return;

    const messageContent = messageText.trim();
    setMessageText('');
    setIsLoading(true);

    try {
      if (currentChat.type === 'group') {
        await api.sendGroupMessage(currentChat.id, messageContent);
      } else {
        await api.sendPrivateMessage(currentChat.id, messageContent);
      }
    } catch (error: any) {
      console.error('发送消息失败:', error);
      toast.error('发送消息失败: ' + (error.message || '未知错误'));
      setMessageText(messageContent); // 恢复消息内容
    } finally {
      setIsLoading(false);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 处理输入变化（打字状态）
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    
    // 清除之前的定时器
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // 设置打字状态
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      socketService.emitTyping(currentChat.id, true);
    }
    
    // 3秒后停止打字状态
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.emitTyping(currentChat.id, false);
    }, 3000);
  };

  // 文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件大小（50MB限制）
    if (file.size > 50 * 1024 * 1024) {
      toast.error('文件大小不能超过50MB');
      return;
    }

    try {
      setIsLoading(true);
      
      // 上传文件
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await api.uploadFile(formData);
      
      // 发送文件消息
      if (currentChat.type === 'group') {
        await api.sendGroupMessage(currentChat.id, uploadResponse.filePath, 'file');
      } else {
        await api.sendPrivateMessage(currentChat.id, uploadResponse.filePath, 'file');
      }
      
      toast.success('文件发送成功');
    } catch (error: any) {
      console.error('文件上传失败:', error);
      toast.error('文件上传失败: ' + (error.message || '未知错误'));
    } finally {
      setIsLoading(false);
      setShowFileMenu(false);
    }
  };

  // 表情选择
  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // 如果没有选择聊天
  if (!currentChat.id) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <Send className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">欢迎使用IM聊天</h3>
          <p className="text-gray-500">选择一个聊天开始对话</p>
        </div>
      </div>
    );
  }

  const currentMessages = messages[currentChat.id] || [];

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* 聊天头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {currentChat.name[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{currentChat.name}</h3>
            <p className="text-sm text-gray-500">
              {currentChat.type === 'group' ? '群聊' : '私聊'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="语音通话"
          >
            <Phone className="h-5 w-5" />
          </button>
          <button
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="视频通话"
          >
            <Video className="h-5 w-5" />
          </button>
          <button
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="更多"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>还没有消息，开始对话吧！</p>
          </div>
        ) : (
          currentMessages.map((message: Message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender_id === user?.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {message.sender_id !== user?.id && (
                  <p className="text-xs font-semibold mb-1 opacity-75">
                    {message.sender_name}
                  </p>
                )}

                {message.message_type === 'text' && (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}

                {message.message_type === 'image' && (
                  <img
                    src={message.content}
                    alt="图片"
                    className="max-w-full h-auto rounded"
                  />
                )}

                {message.message_type === 'file' && (
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">文件</span>
                  </div>
                )}

                <p className="text-xs opacity-75 mt-1">
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-center">
            <LoadingSpinner size="sm" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 */}
      <div className="flex items-end p-4 border-t border-gray-200 bg-white relative">
        {/* 附件按钮 */}
        <button
          onClick={() => setShowFileMenu(!showFileMenu)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="发送附件"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* 附件菜单 */}
        {showFileMenu && (
          <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              <ImageIcon className="h-4 w-4" />
              <span>图片</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              <FileText className="h-4 w-4" />
              <span>文件</span>
            </button>
          </div>
        )}

        {/* 表情按钮 */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="选择表情"
        >
          <Smile className="h-5 w-5" />
        </button>

        {/* 输入框 */}
        <div className="flex-1 mx-2">
          <textarea
            value={messageText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            rows={1}
            className="w-full resize-none border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="输入消息..."
            disabled={isLoading}
          />
        </div>

        {/* 发送按钮 */}
        <button
          onClick={handleSendMessage}
          disabled={!messageText.trim() || isLoading}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="发送消息"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>

        {/* 表情选择器 */}
        {showEmojiPicker && (
          <div className="absolute bottom-full right-0 mb-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <div className="grid grid-cols-8 gap-1">
              {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="p-2 hover:bg-gray-100 rounded text-lg"
                  type="button"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
        aria-label="选择文件上传"
        title="选择文件上传"
      />
    </div>
  );
};

export default ChatArea;