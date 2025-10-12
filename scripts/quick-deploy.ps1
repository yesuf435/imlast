# IM系统一键部署脚本 (PowerShell)
param(
    [Parameter(Mandatory=$false)]
    [string]$GitHubRepo = "",
    [Parameter(Mandatory=$false)]
    [string]$ServerHost = "",
    [Parameter(Mandatory=$false)]
    [string]$ServerUser = "",
    [Parameter(Mandatory=$false)]
    [string]$DeployPath = "/opt/im-system"
)

function Show-SetupGuide {
    Write-Host "🚀 IM系统一键部署脚本" -ForegroundColor Green
    Write-Host ""
    Write-Host "使用前请先配置以下信息:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. GitHub仓库地址 (例如: https://github.com/username/im-system.git)" -ForegroundColor Cyan
    Write-Host "2. 服务器信息:" -ForegroundColor Cyan
    Write-Host "   - 服务器IP或域名" -ForegroundColor White
    Write-Host "   - SSH用户名" -ForegroundColor White
    Write-Host "   - 部署路径 (默认: /opt/im-system)" -ForegroundColor White
    Write-Host ""
    Write-Host "配置示例:" -ForegroundColor Yellow
    Write-Host ".\scripts\quick-deploy.ps1 -GitHubRepo 'https://github.com/yourusername/im-system.git' -ServerHost 'your-server.com' -ServerUser 'root'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "或者手动执行以下步骤:" -ForegroundColor Yellow
    Write-Host "1. 创建GitHub仓库" -ForegroundColor White
    Write-Host "2. 添加远程仓库: git remote add origin <your-repo-url>" -ForegroundColor White
    Write-Host "3. 推送代码: git push -u origin main" -ForegroundColor White
    Write-Host "4. 服务器部署: ssh user@server 'git clone <repo-url> && cd im-system && docker-compose up --build -d'" -ForegroundColor White
}

function Setup-GitHub {
    param([string]$RepoUrl)
    
    if (-not $RepoUrl) {
        Write-Host "❌ 请提供GitHub仓库地址" -ForegroundColor Red
        return $false
    }
    
    Write-Host "🔗 配置GitHub仓库..." -ForegroundColor Yellow
    
    # 检查是否已有远程仓库
    $existingRemote = git remote get-url origin 2>$null
    if ($existingRemote) {
        Write-Host "已存在远程仓库: $existingRemote" -ForegroundColor Yellow
        $confirm = Read-Host "是否要更新为新的仓库地址? (y/N)"
        if ($confirm -eq 'y' -or $confirm -eq 'Y') {
            git remote set-url origin $RepoUrl
        }
    } else {
        git remote add origin $RepoUrl
    }
    
    # 重命名分支为main
    git branch -M main
    
    Write-Host "✅ GitHub仓库配置完成" -ForegroundColor Green
    return $true
}

function Push-ToGitHub {
    Write-Host "📤 推送到GitHub..." -ForegroundColor Yellow
    
    try {
        git push -u origin main
        Write-Host "✅ 代码已推送到GitHub" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ 推送失败: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Deploy-ToServer {
    param([string]$Host, [string]$User, [string]$Path)
    
    if (-not $Host -or -not $User) {
        Write-Host "❌ 请提供服务器信息" -ForegroundColor Red
        return $false
    }
    
    Write-Host "🚀 部署到服务器 $Host..." -ForegroundColor Yellow
    
    $RepoUrl = git remote get-url origin
    if (-not $RepoUrl) {
        Write-Host "❌ 未找到GitHub仓库地址" -ForegroundColor Red
        return $false
    }
    
    # 构建部署命令
    $deployCommand = @"
cd $Path && 
git clone $RepoUrl im-system-new && 
cd im-system-new && 
docker-compose down 2>/dev/null || true && 
docker-compose up --build -d && 
echo 'Deployment completed successfully'
"@
    
    try {
        Write-Host "执行部署命令..." -ForegroundColor Yellow
        ssh "$User@$Host" $deployCommand
        Write-Host "✅ 服务器部署完成" -ForegroundColor Green
        Write-Host "🌐 访问地址: http://$Host:3000" -ForegroundColor Cyan
        return $true
    } catch {
        Write-Host "❌ 服务器部署失败: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-Deployment {
    param([string]$Host)
    
    if (-not $Host) {
        Write-Host "❌ 请提供服务器地址" -ForegroundColor Red
        return
    }
    
    Write-Host "🧪 测试部署..." -ForegroundColor Yellow
    
    # 测试后端健康检查
    try {
        $response = Invoke-WebRequest -Uri "http://$Host:3001/health" -TimeoutSec 10
        Write-Host "✅ 后端服务正常" -ForegroundColor Green
    } catch {
        Write-Host "❌ 后端服务异常" -ForegroundColor Red
    }
    
    # 测试前端
    try {
        $response = Invoke-WebRequest -Uri "http://$Host:3000" -TimeoutSec 10
        Write-Host "✅ 前端服务正常" -ForegroundColor Green
    } catch {
        Write-Host "❌ 前端服务异常" -ForegroundColor Red
    }
}

# 主逻辑
if (-not $GitHubRepo -and -not $ServerHost) {
    Show-SetupGuide
    exit
}

# 步骤1: 配置GitHub
if ($GitHubRepo) {
    if (Setup-GitHub -RepoUrl $GitHubRepo) {
        if (Push-ToGitHub) {
            Write-Host "🎉 GitHub推送完成！" -ForegroundColor Green
        }
    }
}

# 步骤2: 服务器部署
if ($ServerHost -and $ServerUser) {
    if (Deploy-ToServer -Host $ServerHost -User $ServerUser -Path $DeployPath) {
        Write-Host "🎉 服务器部署完成！" -ForegroundColor Green
        
        # 测试部署
        Start-Sleep -Seconds 10
        Test-Deployment -Host $ServerHost
    }
}

Write-Host ""
Write-Host "📋 部署完成！访问地址:" -ForegroundColor Green
Write-Host "前端: http://$ServerHost:3000" -ForegroundColor Cyan
Write-Host "后端: http://$ServerHost:3001" -ForegroundColor Cyan
Write-Host "健康检查: http://$ServerHost:3001/health" -ForegroundColor Cyan
