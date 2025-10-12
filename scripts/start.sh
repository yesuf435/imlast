#!/bin/bash

echo "==================================="
echo "   即时通讯系统 - 启动脚本"
echo "==================================="

# 检查 MongoDB 是否运行
if ! command -v mongod &> /dev/null; then
    echo "MongoDB 未安装，请先安装 MongoDB"
    echo "或使用 Docker Compose 启动：docker-compose up -d"
    exit 1
fi

# 启动后端
echo "正在启动后端服务..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "安装后端依赖..."
    npm install
fi
npm start &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端
echo "正在启动前端服务..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "==================================="
echo "   启动完成！"
echo "==================================="
echo "前端: http://localhost:3000"
echo "后端: http://localhost:3001"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo "==================================="

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

