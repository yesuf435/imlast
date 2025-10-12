# 🚀 GitHub Actions 部署指南

## 📋 设置步骤

### 1. 配置GitHub Secrets

在GitHub仓库中设置以下Secrets：

**访问路径**: `Settings` → `Secrets and variables` → `Actions`

#### 必需的Secrets：
```
API_URL=https://your-domain.com/api
SOCKET_URL=https://your-domain.com
SERVER_HOST=your-server-ip
SERVER_USER=root
SERVER_SSH_KEY=your-private-ssh-key
```

#### 可选的Secrets：
```
MONGO_URL=mongodb://localhost:27017/im-system
JWT_SECRET=your-jwt-secret
```

### 2. 服务器准备

#### 安装Docker和Docker Compose：
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 创建部署目录：
```bash
mkdir -p /opt/im-system
cd /opt/im-system
```

#### 克隆仓库：
```bash
git clone https://github.com/Gymmmm/imlast.git .
```

### 3. 配置SSH密钥

#### 生成SSH密钥对（如果还没有）：
```bash
ssh-keygen -t ed25519 -C "github-actions"
```

#### 将公钥添加到服务器：
```bash
# 复制公钥到服务器
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@your-server
```

#### 将私钥添加到GitHub Secrets：
```bash
# 复制私钥内容
cat ~/.ssh/id_ed25519
# 将内容添加到 SERVER_SSH_KEY secret
```

### 4. 配置域名和SSL（可选）

#### 使用Nginx反向代理：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### 使用Let's Encrypt SSL：
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🔄 工作流说明

### CI/CD Pipeline：

1. **代码检查** (`nodejs.yml`)
   - 安装依赖
   - 运行测试
   - 代码质量检查
   - 构建项目

2. **Docker构建** (`docker-build.yml`)
   - 构建Docker镜像
   - 测试Docker Compose配置
   - 缓存优化

3. **完整部署** (`ci-cd.yml`)
   - 后端测试（含MongoDB）
   - 前端构建
   - Docker镜像构建和推送
   - 自动部署到服务器
   - 安全扫描

### 触发条件：
- **Push到main分支**: 完整CI/CD流程
- **Pull Request**: 仅运行测试和构建
- **手动触发**: 可在Actions页面手动运行

## 🛠️ 故障排除

### 常见问题：

1. **SSH连接失败**
   ```bash
   # 测试SSH连接
   ssh -T user@your-server
   
   # 检查SSH密钥权限
   chmod 600 ~/.ssh/id_ed25519
   ```

2. **Docker构建失败**
   ```bash
   # 检查Dockerfile语法
   docker build -t test ./backend
   
   # 检查Docker Compose配置
   docker-compose config
   ```

3. **部署后服务无法访问**
   ```bash
   # 检查容器状态
   docker-compose ps
   
   # 查看日志
   docker-compose logs -f
   
   # 检查端口占用
   netstat -tulpn | grep :3000
   ```

### 监控和日志：

```bash
# 查看GitHub Actions日志
# 访问: https://github.com/Gymmmm/imlast/actions

# 服务器监控
docker stats
docker-compose logs -f

# 健康检查
curl http://localhost:3001/health
curl http://localhost:3000
```

## 📊 性能优化

### Docker优化：
- 使用多阶段构建
- 启用BuildKit缓存
- 优化镜像层

### 部署优化：
- 使用健康检查
- 配置资源限制
- 启用日志轮转

## 🔒 安全建议

1. **定期更新依赖**
2. **使用安全扫描**
3. **限制SSH访问**
4. **配置防火墙**
5. **定期备份数据**

## 📈 扩展功能

### 可以添加的Actions：
- 自动生成API文档
- 性能测试
- 数据库迁移
- 通知集成（Slack、邮件）
- 多环境部署（staging、production）
