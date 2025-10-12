# 本地开发环境启动脚本 (PowerShell)
Write-Host "启动本地开发环境..." -ForegroundColor Green

# 检查Node.js是否安装
try {
  $nodeVersion = node --version
  Write-Host "Node.js版本: $nodeVersion" -ForegroundColor Green
}
catch {
  Write-Host "Node.js未安装，请先安装Node.js" -ForegroundColor Red
  exit 1
}

# 检查npm是否安装
try {
  $npmVersion = npm --version
  Write-Host "npm版本: $npmVersion" -ForegroundColor Green
}
catch {
  Write-Host "npm未安装" -ForegroundColor Red
  exit 1
}

# 启动后端
Write-Host "启动后端服务..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd backend; npm install; npm start" -WindowStyle Minimized

# 等待后端启动
Write-Host "等待后端启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 启动前端
Write-Host "启动前端服务..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd frontend_production; npm install; npm run dev" -WindowStyle Minimized

Write-Host "服务启动完成！" -ForegroundColor Green
Write-Host "前端地址: http://localhost:3000" -ForegroundColor Cyan
Write-Host "后端地址: http://localhost:3001" -ForegroundColor Cyan
Write-Host "健康检查: http://localhost:3001/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
