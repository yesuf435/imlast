# IM 系统 Docker 自动部署脚本 (PowerShell)
Write-Host "🚀 开始自动部署 IM 系统..." -ForegroundColor Green

# 服务器信息
$server = "root@47.121.27.165"
$password = "MyNew@2025Safe"
$projectPath = "/www/wwwroot/wmiw.ebnnw.cn/im-package"

# 创建 SSH 命令
$commands = @"
echo "📋 停止现有服务..."
pkill -f "python.*3000" 2>/dev/null || true
pkill -f "node.*3001" 2>/dev/null || true
echo "✅ 现有服务已停止"

echo "📁 进入项目目录..."
cd $projectPath

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
"@

# 执行 SSH 连接
Write-Host "🔐 连接到服务器..." -ForegroundColor Yellow
ssh $server $commands

Write-Host "✅ 自动部署完成！" -ForegroundColor Green
