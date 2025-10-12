# 即时通讯系统 (IM System)

类微信风格的即时通讯系统，支持用户注册/登录、好友私聊、群组聊天、在线状态、消息已读、图片发送等功能。

## 技术栈

- **前端**: React 18 + Vite + Tailwind CSS + Socket.io-client
- **后端**: Node.js (Express) + Socket.io + MongoDB
- **部署**: Docker Compose

## 功能特性

✅ 用户注册 / 登录  
✅ 好友添加 / 私聊  
✅ 群组创建 / 群聊  
✅ 在线状态显示  
✅ 消息已读状态  
✅ 实时消息推送 (WebSocket)  
✅ 图片消息发送 (Base64)  
✅ 输入状态提示  
✅ 聊天列表（按最新消息排序）  
✅ 未读消息提醒  
✅ 类微信界面设计

## 目录结构

```
im-app/
├── backend/
│   ├── models/
│   │   ├── User.js          # 用户模型
│   │   ├── Message.js       # 消息模型
│   │   └── Group.js         # 群组模型
│   ├── server.js            # 后端主程序
│   ├── package.json         # 后端依赖
│   ├── Dockerfile           # 后端 Docker 配置
│   └── .env.example         # 环境变量示例
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx    # 登录页
│   │   │   ├── Register.jsx # 注册页
│   │   │   ├── ChatList.jsx # 聊天列表
│   │   │   └── ChatWindow.jsx # 聊天窗口
│   │   ├── context/
│   │   │   └── AuthContext.jsx # 认证上下文
│   │   ├── App.jsx          # 主应用
│   │   ├── main.jsx         # 入口文件
│   │   └── index.css        # 全局样式
│   ├── package.json         # 前端依赖
│   ├── vite.config.js       # Vite 配置
│   ├── tailwind.config.js   # Tailwind 配置
│   ├── Dockerfile           # 前端 Docker 配置
│   └── nginx.conf           # Nginx 配置
├── docker-compose.yml       # Docker Compose 配置
├── start.sh                 # 本地启动脚本
└── README_IM.md            # 项目文档
```

## 快速开始

### 方式 1: Docker Compose (推荐)

```bash
# 一键启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

访问: http://localhost:3000

### 方式 2: 本地开发

#### 前置要求
- Node.js 18+
- MongoDB 7.0+

#### 启动步骤

1. **启动 MongoDB**
```bash
# 使用 Docker 启动 MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# 或本地安装的 MongoDB
mongod
```

2. **启动后端**
```bash
cd backend
npm install
npm start
# 后端运行在 http://localhost:3001
```

3. **启动前端**
```bash
cd frontend
npm install
npm run dev
# 前端运行在 http://localhost:3000
```

### 方式 3: 使用启动脚本

```bash
chmod +x start.sh
./start.sh
```

## API 接口

### 认证接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/register` | POST | 用户注册 |
| `/api/login` | POST | 用户登录 |

### 用户接口

| 接口 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/users` | GET | 获取所有用户 | ✓ |
| `/api/friends` | GET | 获取好友列表 | ✓ |
| `/api/friends/add` | POST | 添加好友 | ✓ |

### 消息接口

| 接口 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/messages/:userId` | GET | 获取私聊消息 | ✓ |
| `/api/messages/group/:groupId` | GET | 获取群聊消息 | ✓ |
| `/api/chats` | GET | 获取聊天列表 | ✓ |
| `/api/upload` | POST | 上传图片 | ✓ |

### 群组接口

| 接口 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/groups` | GET | 获取用户群组 | ✓ |
| `/api/groups/create` | POST | 创建群组 | ✓ |

## Socket.io 事件

### 客户端发送

| 事件 | 说明 | 数据 |
|------|------|------|
| `join` | 加入房间 | `{ roomId }` |
| `message` | 发送私聊消息 | `{ receiverId, content, type }` |
| `group_message` | 发送群聊消息 | `{ groupId, content, type }` |
| `typing` | 输入状态 | `{ receiverId, isTyping }` |
| `mark_read` | 标记已读 | `{ messageId }` |

### 服务端推送

| 事件 | 说明 | 数据 |
|------|------|------|
| `message` | 接收私聊消息 | Message 对象 |
| `group_message` | 接收群聊消息 | Message 对象 + groupId |
| `typing` | 对方输入状态 | `{ userId, username, isTyping }` |
| `user_online` | 用户在线状态 | `{ userId, username, online }` |
| `message_read` | 消息已读通知 | `{ messageId }` |

## 测试接口

```bash
# 注册用户
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"123456"}'

# 登录
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"123456"}'

# 健康检查
curl http://localhost:3001/health
```

## 环境变量

在 `backend` 目录创建 `.env` 文件:

```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/im-system
JWT_SECRET=your-secret-key-change-in-production
```

## 部署验证

```bash
# 检查所有服务状态
docker-compose ps

# 测试后端健康
curl http://localhost:3001/health

# 测试前端
curl http://localhost:3000

# 查看 MongoDB 连接
docker exec -it im-mongodb mongosh im-system
```

## 使用说明

1. **注册/登录**: 首次使用需注册账户，输入用户名和密码（至少6位）
2. **添加好友**: 点击右上角"+"图标，选择用户添加为好友
3. **创建群组**: 点击群组图标，输入群组名称并选择成员
4. **发送消息**: 点击聊天列表进入聊天窗口，输入文字或发送图片
5. **在线状态**: 绿色圆点表示在线，灰色表示离线
6. **已读状态**: 消息下方显示"已读"表示对方已查看

## 截图

- 登录页面：蓝绿渐变背景 + 圆角卡片
- 聊天列表：头像 + 最后消息 + 未读数
- 聊天窗口：类微信气泡样式，绿色发送、白色接收
- 群聊：显示发送者昵称

## 技术亮点

- WebSocket 实时双向通信
- JWT 令牌认证
- MongoDB 数据持久化
- React Context 状态管理
- Tailwind CSS 响应式设计
- Docker 容器化部署
- Nginx 反向代理
- Base64 图片传输

## 故障排查

### 前端无法连接后端
- 检查后端是否启动: `curl http://localhost:3001/health`
- 检查防火墙设置
- 查看浏览器控制台错误

### Socket 连接失败
- 确认 Socket.io 版本一致
- 检查 CORS 配置
- 查看后端日志

### MongoDB 连接失败
- 确认 MongoDB 服务运行: `docker ps | grep mongodb`
- 检查连接字符串是否正确
- 查看 MongoDB 日志: `docker logs im-mongodb`

## 开发团队

技术栈: MERN (MongoDB + Express + React + Node.js)

## 许可证

MIT License

