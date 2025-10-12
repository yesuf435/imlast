import React, { useEffect, useState } from "react";
import { useAuth } from "../store/useAuth";
import LoadingSpinner from "./ui/LoadingSpinner";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback = (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">正在验证身份...</p>
      </div>
    </div>
  ),
}) => {
  const { isAuthenticated, initializeAuth, checkTokenExpiry } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 检查token是否过期
        if (!checkTokenExpiry()) {
          setIsInitializing(false);
          return;
        }

        // 初始化认证状态
        await initializeAuth();
      } catch (error) {
        console.error("认证初始化失败:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [initializeAuth, checkTokenExpiry]);

  // 如果正在初始化，显示加载状态
  if (isInitializing) {
    return <>{fallback}</>;
  }

  // 如果未认证，重定向到登录页
  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  // 如果已认证，渲染子组件
  return <>{children}</>;
};

export default AuthGuard;
