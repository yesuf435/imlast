# 🚀 IM系统快速部署指南

## 当前状态
✅ 前后端联通完成  
✅ 代码已提交到Git  
✅ 部署脚本就绪  
✅ 文档完善  

## 🎯 下一步操作

### 方案一：使用一键部署脚本（推荐）

```powershell
# 1. 查看部署指南
.\scripts\quick-deploy.ps1

# 2. 一键部署（需要替换为你的信息）
.\scripts\quick-deploy.ps1 -GitHubRepo "https://github.com/yourusername/im-system.git" -ServerHost "your-server.com" -ServerUser "root"
```

### 方案二：手动部署

#### 1. 创建GitHub仓库
- 访问 https://github.com/new
- 仓库名：`im-system`
- 设置为公开或私有
- 不要初始化README（已有代码）

#### 2. 推送代码到GitHub
```bash
# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/yourusername/im-system.git

# 推送代码
git push -u origin main
```

#### 3. 服务器部署
```bash
# SSH连接到服务器
ssh username@your-server.com

# 克隆仓库
git clone https://github.com/yourusername/im-system.git
cd im-system

# 使用Docker部署
docker-compose up --build -d
```

## 🔧 服务器要求

### 最低配置
- **CPU**: 1核心
- **内存**: 2GB RAM
- **存储**: 10GB可用空间
- **网络**: 公网IP，开放3000和3001端口

### 必需软件
- Docker
- Docker Compose
- Git

## 📋 部署检查清单

### 服务器环境
- [ ] Docker已安装 (`docker --version`)
- [ ] Docker Compose已安装 (`docker-compose --version`)
- [ ] 端口3000和3001已开放
- [ ] 防火墙配置正确

### 部署验证
- [ ] 后端健康检查: `curl http://your-server:3001/health`
- [ ] 前端访问: `http://your-server:3000`
- [ ] Docker容器运行: `docker-compose ps`

## 🚨 常见问题

### 1. 端口被占用
```bash
# 检查端口占用
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# 停止占用进程
sudo kill -9 <PID>
```

### 2. Docker权限问题
```bash
# 添加用户到docker组
sudo usermod -aG docker $USER
# 重新登录或执行
newgrp docker
```

### 3. 内存不足
```bash
# 增加swap空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 📞 技术支持

如果遇到问题，可以：
1. 查看部署日志: `docker-compose logs -f`
2. 检查服务状态: `docker-compose ps`
3. 重启服务: `docker-compose restart`

## 🎉 部署成功后

访问以下地址验证部署：
- **前端**: http://your-server:3000
- **后端**: http://your-server:3001
- **健康检查**: http://your-server:3001/health
- **测试页面**: http://your-server:8080/test_connection.html
