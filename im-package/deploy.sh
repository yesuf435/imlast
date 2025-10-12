#!/bin/bash

# IM 系统一键部署脚本
# 适用于 Linux 服务器

echo "🚀 开始部署 IM 系统..."

# 检查系统环境
echo "📋 检查系统环境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 16+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB 未安装，请先安装 MongoDB"
    echo "   安装命令: sudo apt-get install mongodb"
fi

# 检查端口占用
echo "🔍 检查端口占用..."
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 3001 已被占用，请先停止相关服务"
    echo "   停止命令: sudo kill -9 \$(lsof -t -i:3001)"
fi

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 后端依赖安装失败"
        exit 1
    fi
fi

# 启动 MongoDB（如果未运行）
echo "🗄️  启动 MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    sudo systemctl start mongod || sudo service mongodb start
    sleep 3
fi

# 启动后端服务
echo "🔧 启动后端服务..."
npm start &
BACKEND_PID=$!
echo "后端服务 PID: $BACKEND_PID"

# 等待后端启动
sleep 5

# 检查后端是否启动成功
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ 后端服务启动失败"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ 后端服务启动成功"

# 配置 Nginx（可选）
echo "🌐 配置 Nginx..."
if command -v nginx &> /dev/null; then
    sudo cp ../config/nginx.production.conf /etc/nginx/sites-available/im-system
    sudo ln -sf /etc/nginx/sites-available/im-system /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ Nginx 配置完成"
else
    echo "⚠️  Nginx 未安装，跳过 Web 服务器配置"
fi

echo ""
echo "🎉 IM 系统部署完成！"
echo ""
echo "📊 服务状态:"
echo "   后端服务: http://localhost:3001"
echo "   前端文件: ./frontend/"
echo "   数据库: MongoDB (localhost:27017)"
echo ""
echo "🔧 管理命令:"
echo "   停止服务: kill $BACKEND_PID"
echo "   查看日志: tail -f logs/app.log"
echo "   重启服务: ./deploy.sh"
echo ""
echo "📱 访问地址:"
echo "   本地访问: http://localhost"
echo "   外网访问: http://你的服务器IP"

