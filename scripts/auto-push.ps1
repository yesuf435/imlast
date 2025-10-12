# 全自动GitHub推送脚本
Write-Host "🚀 全自动GitHub推送开始..." -ForegroundColor Green

# 检查Git状态
Write-Host "📋 检查Git状态..." -ForegroundColor Yellow
git status

# 添加所有更改
Write-Host "📁 添加所有更改..." -ForegroundColor Yellow
git add .

# 检查是否有更改需要提交
$status = git status --porcelain
if ($status) {
    Write-Host "💾 提交更改..." -ForegroundColor Yellow
    git commit -m "feat: 自动更新 - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
} else {
    Write-Host "ℹ️ 没有更改需要提交" -ForegroundColor Cyan
}

# 检查是否已有远程仓库
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host "🔗 需要添加GitHub远程仓库" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "请按以下步骤操作:" -ForegroundColor Cyan
    Write-Host "1. 访问 https://github.com/new" -ForegroundColor White
    Write-Host "2. 仓库名: im-system" -ForegroundColor White
    Write-Host "3. 设置为公开或私有" -ForegroundColor White
    Write-Host "4. 不要初始化README（已有代码）" -ForegroundColor White
    Write-Host "5. 创建仓库后复制仓库地址" -ForegroundColor White
    Write-Host ""
    Write-Host "然后运行:" -ForegroundColor Yellow
    Write-Host "git remote add origin <你的仓库地址>" -ForegroundColor Cyan
    Write-Host "git push -u origin main" -ForegroundColor Cyan
} else {
    Write-Host "✅ 远程仓库已配置: $remote" -ForegroundColor Green
    
    # 尝试推送
    Write-Host "📤 推送到GitHub..." -ForegroundColor Yellow
    try {
        git push -u origin main
        Write-Host "🎉 推送成功！" -ForegroundColor Green
        Write-Host "🌐 仓库地址: $remote" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ 推送失败，可能需要手动处理" -ForegroundColor Red
        Write-Host "请检查网络连接和GitHub权限" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📋 下一步操作:" -ForegroundColor Green
Write-Host "1. 如果推送成功，复制仓库地址用于服务器部署" -ForegroundColor White
Write-Host "2. 在服务器上运行:" -ForegroundColor White
Write-Host "   git clone <仓库地址>" -ForegroundColor Cyan
Write-Host "   cd im-system" -ForegroundColor Cyan
Write-Host "   docker-compose up --build -d" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 部署完成后访问:" -ForegroundColor Green
Write-Host "前端: http://your-server:3000" -ForegroundColor Cyan
Write-Host "后端: http://your-server:3001" -ForegroundColor Cyan
