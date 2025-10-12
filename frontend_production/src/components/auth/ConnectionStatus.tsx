import { Circle, Wifi, WifiOff } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../store/useAuth";

interface ConnectionStatusProps {
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className = "",
}) => {
  const { user, updateActivity } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updateActivity();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateActivity();
      }
    };

    // 监听网络状态
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 定期更新活动时间
    const activityInterval = setInterval(() => {
      updateActivity();
    }, 5 * 60 * 1000); // 每5分钟更新一次

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(activityInterval);
    };
  }, [updateActivity]);

  useEffect(() => {
    if (user?.status === "offline") {
      setLastSeen(new Date());
    }
  }, [user?.status]);

  const getStatusColor = () => {
    if (!isOnline) return "text-red-500";
    if (user?.status === "online") return "text-green-500";
    return "text-gray-400";
  };

  const getStatusText = () => {
    if (!isOnline) return "离线";
    if (user?.status === "online") return "在线";
    return "离开";
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-3 w-3" />;
    if (user?.status === "online") return <Wifi className="h-3 w-3" />;
    return <Circle className="h-3 w-3" />;
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-xs font-medium">{getStatusText()}</span>
      </div>

      {lastSeen && user?.status === "offline" && (
        <span className="text-xs text-gray-400">
          {lastSeen.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default ConnectionStatus;
