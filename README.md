# IM系统 - 即时通讯应用

## 项目简介
现代化的即时通讯系统，支持私聊、群聊、文件传输等功能。

## 技术栈
- **前端**: React + TypeScript + Vite + Tailwind CSS
- **后端**: Node.js + Express + Socket.IO
- **数据库**: MongoDB
- **部署**: Docker + Docker Compose

## 快速开始

### 本地开发
```bash
# 启动后端
cd backend
npm install
node server-simple.js

# 启动前端（新终端）
cd frontend_production
npm install
npm run dev
```

### Docker部署
```bash
docker-compose up --build -d
```

## 服务地址
- 前端: http://localhost:3000
- 后端: http://localhost:3001
- 测试页面: http://localhost:8080/test_connection.html

## 功能特性
- ✅ 用户注册/登录
- ✅ 私聊消息
- ✅ 群组聊天
- ✅ 好友管理
- ✅ 实时消息推送
- ✅ 文件上传
- ✅ 在线状态显示

## 部署状态
- ✅ 前后端联通完成
- ✅ API接口测试通过
- ✅ Socket.IO连接正常
- ✅ Docker配置完成
