@echo off
chcp 65001 >nul

REM IM 系统快速启动脚本
echo 🚀 启动 IM 系统...

cd backend
echo 📦 启动后端服务...
start "IM Backend" npm start

echo ✅ IM 系统已启动
echo 📱 访问地址: http://localhost:3001
echo.
pause

