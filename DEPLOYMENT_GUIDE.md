# IM系统部署指南

## 🚀 部署策略建议

### 方案一：GitHub + 服务器部署（推荐）

#### 1. 本地开发 → GitHub
```powershell
# 初始化Git仓库
.\scripts\git-workflow.ps1 -Action init

# 提交更改
.\scripts\git-workflow.ps1 -Action commit -Message "修复前后端连接问题"

# 推送到GitHub
.\scripts\git-workflow.ps1 -Action push
```

#### 2. GitHub → 服务器部署
```bash
# 在服务器上克隆仓库
git clone https://github.com/yourusername/im-system.git
cd im-system

# 使用Docker部署
docker-compose up --build -d
```

### 方案二：直接服务器部署

#### 1. 上传文件到服务器
```bash
# 使用SCP上传
scp -r ./im-last username@server:/path/to/deploy/

# 或使用SFTP
sftp username@server
put -r ./im-last
```

#### 2. 在服务器上部署
```bash
cd /path/to/deploy/im-last
docker-compose up --build -d
```

## 🔧 服务器配置要求

### 最低配置
- **CPU**: 1核心
- **内存**: 2GB RAM
- **存储**: 10GB 可用空间
- **网络**: 公网IP，开放3000和3001端口

### 推荐配置
- **CPU**: 2核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间
- **网络**: 公网IP，配置域名和SSL证书

## 📋 部署检查清单

### 服务器环境
- [ ] Docker已安装
- [ ] Docker Compose已安装
- [ ] 端口3000和3001已开放
- [ ] 防火墙配置正确

### 应用配置
- [ ] 环境变量已设置
- [ ] MongoDB连接正常
- [ ] 文件上传目录权限正确
- [ ] SSL证书配置（生产环境）

### 监控和日志
- [ ] 日志收集配置
- [ ] 健康检查端点
- [ ] 错误监控
- [ ] 性能监控

## 🌐 域名和SSL配置

### Nginx反向代理配置
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
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

### SSL证书配置
```bash
# 使用Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 🔄 持续部署流程

### 1. 开发流程
```bash
# 本地开发
git checkout -b feature/new-feature
# 开发代码...
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
```

### 2. 部署流程
```bash
# 合并到主分支
git checkout main
git merge feature/new-feature
git push origin main

# 服务器自动部署（如果配置了CI/CD）
# 或手动部署
ssh username@server "cd /path/to/app && git pull && docker-compose up --build -d"
```

## 📊 监控和维护

### 健康检查
```bash
# 检查服务状态
curl http://yourdomain.com/api/health

# 检查Docker容器
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 备份策略
```bash
# 数据库备份
docker exec im-mongodb mongodump --out /backup/$(date +%Y%m%d)

# 文件备份
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/
```

## 🚨 故障排除

### 常见问题
1. **端口冲突**: 检查端口占用 `netstat -tulpn | grep :3000`
2. **Docker权限**: 确保用户有Docker权限
3. **内存不足**: 增加swap空间或升级服务器
4. **网络问题**: 检查防火墙和端口开放

### 日志查看
```bash
# 查看应用日志
docker-compose logs -f im-backend
docker-compose logs -f im-frontend

# 查看系统日志
journalctl -u docker
```

## 📈 性能优化

### 生产环境优化
- 启用Gzip压缩
- 配置CDN
- 使用Redis缓存
- 数据库索引优化
- 图片压缩和懒加载

### 监控指标
- 响应时间
- 并发连接数
- 内存使用率
- CPU使用率
- 磁盘空间