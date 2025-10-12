@echo off
chcp 65001 >nul

echo 开始自动部署 IM 系统...

REM 连接到服务器并执行部署命令
ssh root@47.121.27.165 "cd /www/wwwroot/wmiw.ebnnw.cn/im-package && pkill -f 'python.*3000' && pkill -f 'node.*3001' && docker-compose -f docker-compose.prod.yml up -d && echo 'Docker deployment completed'"

echo 自动部署完成！
pause
