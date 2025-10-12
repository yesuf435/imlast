@echo off
chcp 65001 >nul

REM IM 系统一键部署脚本 (Windows)
echo 🚀 开始部署 IM 系统...

REM 检查系统环境
echo 📋 检查系统环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装，请先安装 Node.js 16+
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm 未安装，请先安装 npm
    pause
    exit /b 1
)

REM 检查端口占用
echo 🔍 检查端口占用...
netstat -ano | findstr :3001 >nul
if %errorlevel% equ 0 (
    echo ⚠️  端口 3001 已被占用，请先停止相关服务
    echo    停止命令: taskkill /f /im node.exe
    pause
)

REM 安装后端依赖
echo 📦 安装后端依赖...
cd backend
if not exist "node_modules" (
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 后端依赖安装失败
        pause
        exit /b 1
    )
)

REM 启动后端服务
echo 🔧 启动后端服务...
start "IM Backend" npm start

REM 等待后端启动
timeout /t 5 /nobreak >nul

REM 检查后端是否启动成功
curl -s http://localhost:3001/api/health >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 后端服务启动失败，请检查日志
    pause
    exit /b 1
)

echo ✅ 后端服务启动成功

echo.
echo 🎉 IM 系统部署完成！
echo.
echo 📊 服务状态:
echo    后端服务: http://localhost:3001
echo    前端文件: ./frontend/
echo.
echo 📱 访问地址:
echo    本地访问: http://localhost:3001
echo    前端页面: 打开 frontend/index.html
echo.
echo 🔧 管理命令:
echo    停止服务: 关闭命令行窗口
echo    重启服务: 重新运行此脚本
echo.
pause

