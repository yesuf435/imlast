@echo off
chcp 65001 >nul

echo 🚀 开始部署IM系统到生产服务器...

REM 服务器信息
set SERVER_IP=47.121.27.165
set SERVER_USER=root
set PROJECT_NAME=im-system
set DEPLOY_DIR=/opt/im-system

echo 📋 部署信息:
echo   服务器: %SERVER_IP%
echo   项目名: %PROJECT_NAME%
echo   部署目录: %DEPLOY_DIR%

echo.
echo 📁 创建部署目录...
ssh %SERVER_USER%@%SERVER_IP% "mkdir -p %DEPLOY_DIR%"

echo.
echo 📤 上传项目文件...
REM 使用scp上传文件
scp -r backend %SERVER_USER%@%SERVER_IP%:%DEPLOY_DIR%/
scp -r frontend_production %SERVER_USER%@%SERVER_IP%:%DEPLOY_DIR%/
scp docker-compose.prod.yml %SERVER_USER%@%SERVER_IP%:%DEPLOY_DIR%/
scp Dockerfile %SERVER_USER%@%SERVER_IP%:%DEPLOY_DIR%/backend/
scp Dockerfile.prod %SERVER_USER%@%SERVER_IP%:%DEPLOY_DIR%/frontend_production/
scp nginx.conf %SERVER_USER%@%SERVER_IP%:%DEPLOY_DIR%/frontend_production/

echo.
echo 🔧 在服务器上执行部署...
ssh %SERVER_USER%@%SERVER_IP% << 'EOF'
cd /opt/im-system

echo "📦 检查Docker和Docker Compose..."
if ! command -v docker &> /dev/null; then
    echo "安装Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
fi

if ! command -v docker-compose &> /dev/null; then
    echo "安装Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

echo "🛑 停止现有容器..."
docker-compose -f docker-compose.prod.yml down || true

echo "🗑️ 清理旧镜像..."
docker system prune -f

echo "🏗️ 构建并启动服务..."
docker-compose -f docker-compose.prod.yml up -d --build

echo "⏳ 等待服务启动..."
sleep 30

echo "🔍 检查服务状态..."
docker-compose -f docker-compose.prod.yml ps

echo "📊 检查服务健康状态..."
curl -f http://localhost:3001/health || echo "后端服务可能还在启动中..."
curl -f http://localhost:3003 || echo "前端服务可能还在启动中..."

echo "✅ 部署完成！"
echo "🌐 服务地址:"
echo "  前端: http://47.121.27.165:3003"
echo "  后端: http://47.121.27.165:3001"
echo "  MongoDB: mongodb://47.121.27.165:27017/im-system"

EOF

echo.
echo 🎉 部署完成！
echo 📱 访问地址: http://47.121.27.165:3003
pause
