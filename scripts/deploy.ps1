# 部署前后端联通脚本 (PowerShell)
Write-Host "开始部署前后端联通..." -ForegroundColor Green

# 检查Docker是否运行
try {
  docker info | Out-Null
  Write-Host "Docker正在运行" -ForegroundColor Green
}
catch {
  Write-Host "Docker未运行，请先启动Docker" -ForegroundColor Red
  exit 1
}

# 停止现有容器
Write-Host "停止现有容器..." -ForegroundColor Yellow
docker-compose down

# 构建并启动服务
Write-Host "构建并启动服务..." -ForegroundColor Yellow
docker-compose up --build -d

# 等待服务启动
Write-Host "等待服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 检查服务状态
Write-Host "检查服务状态..." -ForegroundColor Yellow
docker-compose ps

# 测试后端连接
Write-Host "测试后端连接..." -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5
  if ($response.StatusCode -eq 200) {
    Write-Host "后端服务正常" -ForegroundColor Green
  }
  else {
    Write-Host "后端服务异常" -ForegroundColor Red
  }
}
catch {
  Write-Host "后端服务异常" -ForegroundColor Red
}

# 测试前端连接
Write-Host "测试前端连接..." -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
  if ($response.StatusCode -eq 200) {
    Write-Host "前端服务正常" -ForegroundColor Green
  }
  else {
    Write-Host "前端服务异常" -ForegroundColor Red
  }
}
catch {
  Write-Host "前端服务异常" -ForegroundColor Red
}

Write-Host "部署完成！" -ForegroundColor Green
Write-Host "前端地址: http://localhost:3000" -ForegroundColor Cyan
Write-Host "后端地址: http://localhost:3001" -ForegroundColor Cyan
Write-Host "健康检查: http://localhost:3001/health" -ForegroundColor Cyan