# 现代化IM即时通讯系统

一个功能完善、可直接上线的现代化即时通讯系统，支持私聊、群聊、文件传输、实时消息推送等功能。

## 🚀 功能特性

### 核心功能
- ✅ **用户认证**: 注册、登录、JWT认证
- ✅ **好友系统**: 搜索用户、发送好友请求、好友管理
- ✅ **群组功能**: 创建群组、邀请好友、群成员管理
- ✅ **实时消息**: 文本、图片、文件、语音消息
- ✅ **在线状态**: 实时显示用户在线/离线状态
- ✅ **消息推送**: Socket.io实时消息推送
- ✅ **文件上传**: 支持图片、文档等多种文件类型

### 技术特性
- 🔒 **安全防护**: Helmet安全头、速率限制、输入验证
- 📱 **响应式设计**: 现代化UI，支持移动端
- ⚡ **高性能**: 数据库索引优化、连接池管理
- 🐳 **容器化**: Docker支持，一键部署
- 📊 **监控**: 健康检查、日志记录
- 🔄 **负载均衡**: Nginx反向代理、集群部署

## 🛠 技术栈

### 后端
- **Node.js** + **Express.js** - 服务器框架
- **Socket.io** - 实时通信
- **MongoDB** - 数据库
- **JWT** - 身份认证
- **Multer** - 文件上传
- **Helmet** - 安全防护
- **PM2** - 进程管理

### 前端
- **React 18** + **TypeScript** - 前端框架
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Zustand** - 状态管理
- **React Router** - 路由管理
- **Socket.io Client** - 实时通信
- **Axios** - HTTP客户端

### 部署
- **Docker** + **Docker Compose** - 容器化部署
- **Nginx** - 反向代理
- **PM2** - 进程管理
- **MongoDB** - 数据库
- **Redis** - 缓存（可选）

## 📦 快速开始

### 环境要求
- Node.js >= 16.0.0
- MongoDB >= 4.4
- Docker & Docker Compose（可选）

### 1. 克隆项目
```bash
git clone <repository-url>
cd im-backend
```

### 2. 安装依赖
```bash
# 后端依赖
npm install

# 前端依赖
cd frontend_production
npm install
```

### 3. 环境配置
```bash
# 复制环境变量文件
cp env.example .env

# 编辑环境变量
nano .env
```

### 4. 启动服务

#### 方式一：直接启动
```bash
# 启动后端
npm run start

# 启动前端（新终端）
cd frontend_production
npm run dev
```

#### 方式二：Docker部署
```bash
# 使用Docker Compose一键部署
docker-compose up -d
```

### 5. 访问应用
- 前端地址: http://localhost:3000
- 后端API: http://localhost:3001
- 健康检查: http://localhost:3001/health

## 🔧 配置说明

### 环境变量
```env
# 服务器配置
NODE_ENV=production
PORT=3001

# 数据库配置
MONGO_URL=mongodb://localhost:27017
DB_NAME=im_production

# JWT配置
JWT_SECRET=your_super_secure_jwt_secret_key_2024
JWT_EXPIRES_IN=7d

# 前端地址
FRONTEND_URL=http://localhost:3000
```

### 数据库索引
系统会自动创建以下索引：
- 用户表：用户名、邮箱唯一索引
- 好友关系：用户ID、好友ID复合索引
- 消息表：时间倒序索引
- 群组表：群组名称索引

## 📱 API文档

### 认证接口
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `GET /api/user/profile` - 获取用户信息

### 好友接口
- `GET /api/users/search` - 搜索用户
- `POST /api/friend-requests` - 发送好友请求
- `GET /api/friend-requests` - 获取好友请求
- `PUT /api/friend-requests/:id` - 处理好友请求
- `GET /api/friends` - 获取好友列表
- `DELETE /api/friends/:id` - 删除好友

### 群组接口
- `POST /api/groups/create` - 创建群组
- `GET /api/groups/my` - 获取我的群组
- `GET /api/groups/:id` - 获取群组详情
- `POST /api/groups/:id/invite` - 邀请好友

### 消息接口
- `GET /api/groups/:id/messages` - 获取群组消息
- `POST /api/groups/:id/messages` - 发送群组消息
- `POST /api/upload/file` - 文件上传

## 🚀 生产部署

### 1. 服务器准备
```bash
# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
sudo apt-get install -y mongodb-org

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 2. 使用PM2部署
```bash
# 安装PM2
npm install -g pm2

# 启动应用
npm run pm2:start

# 查看状态
npm run pm2:logs
```

### 3. 使用Docker部署
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 4. Nginx配置
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 📊 监控和维护

### 健康检查
```bash
# 检查服务状态
curl http://localhost:3001/health

# 检查数据库连接
curl http://localhost:3001/api/health
```

### 日志查看
```bash
# PM2日志
pm2 logs

# Docker日志
docker-compose logs -f im-backend

# 应用日志
tail -f logs/combined.log
```

### 性能监控
```bash
# PM2监控
pm2 monit

# 系统资源
htop
```

## 🔒 安全建议

1. **更改默认密码**: 修改MongoDB、JWT密钥等默认配置
2. **启用HTTPS**: 配置SSL证书
3. **防火墙设置**: 只开放必要端口
4. **定期备份**: 设置数据库自动备份
5. **监控日志**: 定期检查异常日志
6. **更新依赖**: 定期更新npm包

## 🐛 故障排除

### 常见问题

1. **MongoDB连接失败**
   ```bash
   # 检查MongoDB服务
   sudo systemctl status mongod
   
   # 重启MongoDB
   sudo systemctl restart mongod
   ```

2. **Socket.io连接失败**
   ```bash
   # 检查防火墙
   sudo ufw status
   
   # 检查端口占用
   netstat -tlnp | grep 3001
   ```

3. **文件上传失败**
   ```bash
   # 检查上传目录权限
   chmod 755 uploads/
   
   # 检查磁盘空间
   df -h
   ```

## 📈 性能优化

1. **数据库优化**
   - 创建合适的索引
   - 使用连接池
   - 定期清理过期数据

2. **缓存策略**
   - 使用Redis缓存用户信息
   - 缓存好友列表
   - 缓存群组信息

3. **CDN加速**
   - 静态资源使用CDN
   - 图片压缩优化
   - 启用Gzip压缩

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 📄 许可证

MIT License

## 📞 支持

如有问题，请提交Issue或联系开发团队。

---

**注意**: 这是一个生产就绪的IM系统，请根据实际需求调整配置和安全设置。
