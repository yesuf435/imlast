# Git工作流和部署脚本 (PowerShell)
param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "help",
    [Parameter(Mandatory=$false)]
    [string]$Message = "Update code"
)

function Show-Help {
    Write-Host "IM系统 Git工作流脚本" -ForegroundColor Green
    Write-Host ""
    Write-Host "用法: .\scripts\git-workflow.ps1 -Action <action> [-Message <message>]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "可用操作:" -ForegroundColor Cyan
    Write-Host "  init     - 初始化Git仓库并创建GitHub仓库" -ForegroundColor White
    Write-Host "  commit   - 提交当前更改" -ForegroundColor White
    Write-Host "  push     - 推送到GitHub" -ForegroundColor White
    Write-Host "  deploy   - 部署到服务器" -ForegroundColor White
    Write-Host "  status   - 查看Git状态" -ForegroundColor White
    Write-Host "  test     - 运行测试" -ForegroundColor White
    Write-Host "  help     - 显示帮助信息" -ForegroundColor White
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Cyan
    Write-Host "  .\scripts\git-workflow.ps1 -Action commit -Message '修复前后端连接问题'" -ForegroundColor White
    Write-Host "  .\scripts\git-workflow.ps1 -Action push" -ForegroundColor White
    Write-Host "  .\scripts\git-workflow.ps1 -Action deploy" -ForegroundColor White
}

function Initialize-GitRepo {
    Write-Host "初始化Git仓库..." -ForegroundColor Yellow
    
    # 检查是否已经是Git仓库
    if (Test-Path ".git") {
        Write-Host "Git仓库已存在" -ForegroundColor Green
        return
    }
    
    # 初始化Git仓库
    git init
    git add .
    git commit -m "Initial commit: IM系统前后端联通完成"
    
    Write-Host "Git仓库初始化完成" -ForegroundColor Green
    Write-Host "请手动创建GitHub仓库并添加远程地址:" -ForegroundColor Yellow
    Write-Host "git remote add origin https://github.com/yourusername/im-system.git" -ForegroundColor Cyan
}

function Commit-Changes {
    param([string]$Message)
    
    Write-Host "提交更改..." -ForegroundColor Yellow
    
    # 添加所有更改
    git add .
    
    # 检查是否有更改
    $status = git status --porcelain
    if (-not $status) {
        Write-Host "没有更改需要提交" -ForegroundColor Yellow
        return
    }
    
    # 提交更改
    git commit -m $Message
    
    Write-Host "更改已提交: $Message" -ForegroundColor Green
}

function Push-ToGitHub {
    Write-Host "推送到GitHub..." -ForegroundColor Yellow
    
    # 检查远程仓库
    $remote = git remote get-url origin 2>$null
    if (-not $remote) {
        Write-Host "未设置远程仓库，请先运行: git remote add origin <your-repo-url>" -ForegroundColor Red
        return
    }
    
    # 推送到GitHub
    git push -u origin main
    
    Write-Host "代码已推送到GitHub" -ForegroundColor Green
}

function Deploy-ToServer {
    Write-Host "部署到服务器..." -ForegroundColor Yellow
    
    # 检查Docker是否可用
    try {
        docker --version | Out-Null
        Write-Host "Docker可用" -ForegroundColor Green
    } catch {
        Write-Host "Docker不可用，请先安装Docker" -ForegroundColor Red
        return
    }
    
    # 停止现有容器
    Write-Host "停止现有容器..." -ForegroundColor Yellow
    docker-compose down 2>$null
    
    # 构建并启动服务
    Write-Host "构建并启动服务..." -ForegroundColor Yellow
    docker-compose up --build -d
    
    # 等待服务启动
    Write-Host "等待服务启动..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    # 检查服务状态
    Write-Host "检查服务状态..." -ForegroundColor Yellow
    docker-compose ps
    
    Write-Host "部署完成！" -ForegroundColor Green
    Write-Host "前端: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "后端: http://localhost:3001" -ForegroundColor Cyan
}

function Show-GitStatus {
    Write-Host "Git状态:" -ForegroundColor Yellow
    git status
    
    Write-Host "`n最近的提交:" -ForegroundColor Yellow
    git log --oneline -5
}

function Run-Tests {
    Write-Host "运行测试..." -ForegroundColor Yellow
    
    # 测试后端连接
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5
        Write-Host "✅ 后端服务正常" -ForegroundColor Green
    } catch {
        Write-Host "❌ 后端服务异常" -ForegroundColor Red
    }
    
    # 测试前端连接
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
        Write-Host "✅ 前端服务正常" -ForegroundColor Green
    } catch {
        Write-Host "❌ 前端服务异常" -ForegroundColor Red
    }
}

# 主逻辑
switch ($Action.ToLower()) {
    "init" { Initialize-GitRepo }
    "commit" { Commit-Changes -Message $Message }
    "push" { Push-ToGitHub }
    "deploy" { Deploy-ToServer }
    "status" { Show-GitStatus }
    "test" { Run-Tests }
    "help" { Show-Help }
    default { 
        Write-Host "未知操作: $Action" -ForegroundColor Red
        Show-Help 
    }
}
