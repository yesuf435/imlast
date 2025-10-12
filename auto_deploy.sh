#!/bin/bash

# IM 系统 Docker 自动部署脚本
echo "🚀 开始自动部署 IM 系统..."

# 服务器信息
SERVER="root@47.121.27.165"
PASSWORD="MyNew@2025Safe"
PROJECT_PATH="/www/wwwroot/wmiw.ebnnw.cn/im-package"

# 使用 sshpass 自动登录并执行命令
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" << 'EOF'
echo "📋 停止现有服务..."
pkill -f "python.*3000" 2>/dev/null || true
pkill -f "node.*3001" 2>/dev/null || true
echo "✅ 现有服务已停止"

echo "📁 进入项目目录..."
cd /www/wwwroot/wmiw.ebnnw.cn/im-package

echo "🐳 检查 Docker 环境..."
docker --version
docker-compose --version

echo "🔧 启动 Docker 服务..."
docker-compose -f docker-compose.prod.yml up -d

echo "📊 检查服务状态..."
docker ps

echo "🌐 检查端口占用..."
netstat -tlnp | grep -E ':(3000|3001)' || echo "端口检查完成"

echo "🎉 Docker 部署完成！"
echo "访问地址:"
echo "  前端: http://47.121.27.165:3000"
echo "  后端: http://47.121.27.165:3001"
EOF

echo "✅ 自动部署脚本执行完成！"
