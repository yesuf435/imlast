import {
  FileText,
  Image as ImageIcon,
  Paperclip,
  Send,
  Smile,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import LoadingSpinner from "../ui/LoadingSpinner";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onFileUpload,
  isLoading = false,
  disabled = false,
  placeholder = "输入消息...",
}) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 自动调整高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      setShowFileMenu(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const emojis = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🤩",
    "🥳",
    "😏",
  ];

  return (
    <div className="relative bg-white border-t border-gray-200 p-4">
      {/* 文件菜单 */}
      {showFileMenu && (
        <div className="absolute bottom-full left-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20">
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

      {/* 表情选择器 */}
      {showEmojiPicker && (
        <div className="absolute bottom-full right-4 mb-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
          <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
            {emojis.map((emoji) => (
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

      <div className="flex items-end space-x-2">
        {/* 附件按钮 */}
        <button
          onClick={() => setShowFileMenu(!showFileMenu)}
          disabled={disabled}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="发送附件"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* 表情按钮 */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={disabled}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="选择表情"
        >
          <Smile className="h-5 w-5" />
        </button>

        {/* 输入框 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full resize-none border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed max-h-32"
            rows={1}
            style={{ minHeight: "40px" }}
          />
        </div>

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading || disabled}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="发送消息"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
        aria-label="选择文件上传"
      />
    </div>
  );
};

export default MessageInput;
