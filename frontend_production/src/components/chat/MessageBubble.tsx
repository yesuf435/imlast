import { Download, Eye, FileText } from "lucide-react";
import React from "react";

interface MessageProps {
  message: {
    id: string;
    sender_id: string;
    sender_name: string;
    message_type: "text" | "image" | "file";
    content: string;
    created_at: string;
  };
  isOwn: boolean;
  showAvatar?: boolean;
  prevMessage?: {
    sender_id: string;
    created_at: string;
  };
}

const MessageBubble: React.FC<MessageProps> = ({
  message,
  isOwn,
  showAvatar = true,
  prevMessage,
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const shouldShowTime =
    !prevMessage ||
    new Date(message.created_at).getTime() -
      new Date(prevMessage.created_at).getTime() >
      5 * 60 * 1000;

  const renderMessageContent = () => {
    switch (message.message_type) {
      case "text":
        return (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        );

      case "image":
        return (
          <div className="relative group">
            <img
              src={message.content}
              alt="图片"
              className="max-w-xs max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.content, "_blank")}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        );

      case "file":
        const fileName = message.content.split("/").pop() || "文件";
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {fileName}
              </p>
              <p className="text-xs text-gray-500">点击下载</p>
            </div>
            <button
              onClick={() => window.open(message.content, "_blank")}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="下载文件"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        );

      default:
        return <div>{message.content}</div>;
    }
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
          isOwn ? "flex-row-reverse space-x-reverse" : ""
        }`}
      >
        {/* 头像 */}
        {!isOwn && showAvatar && (
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-md">
            {message.sender_name[0].toUpperCase()}
          </div>
        )}

        {/* 消息气泡 */}
        <div className={`relative ${isOwn ? "ml-12" : "mr-12"}`}>
          {/* 发送者名称 */}
          {!isOwn && showAvatar && (
            <p className="text-xs font-semibold text-gray-600 mb-1 px-1">
              {message.sender_name}
            </p>
          )}

          {/* 消息内容 */}
          <div
            className={`px-4 py-2.5 rounded-2xl transition-all duration-200 ${
              isOwn
                ? "bg-indigo-600 text-white rounded-br-md shadow-md hover:shadow-lg"
                : "bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-md shadow-sm hover:shadow-md"
            }`}
          >
            {renderMessageContent()}
          </div>

          {/* 时间戳 */}
          {shouldShowTime && (
            <p
              className={`text-xs text-gray-500 mt-1 px-1 ${
                isOwn ? "text-right" : "text-left"
              }`}
            >
              {formatTime(message.created_at)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
