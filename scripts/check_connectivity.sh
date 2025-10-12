#!/bin/bash

echo "=========================================="
echo "     IM系统 - 端口连通性检查报告"
echo "=========================================="
echo "检查时间: $(date)"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_port() {
    local port=$1
    local service=$2
    local protocol=${3:-tcp}
    
    if timeout 3 bash -c "</dev/$protocol/localhost/$port" 2>/dev/null; then
        echo -e "${GREEN}✅ $service (端口 $port) - 连通${NC}"
        return 0
    else
        echo -e "${RED}❌ $service (端口 $port) - 不通${NC}"
        return 1
    fi
}

check_http() {
    local url=$1
    local service=$2
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url")
    if [ "$status" -eq 200 ]; then
        echo -e "${GREEN}✅ $service - HTTP响应正常 ($status)${NC}"
        return 0
    else
        echo -e "${RED}❌ $service - HTTP响应异常 ($status)${NC}"
        return 1
    fi
}

echo "1. 端口连通性检查"
echo "===================="
check_port 3000 "前端服务(Nginx)"
check_port 3001 "后端服务(Node.js)"
check_port 27017 "数据库服务(MongoDB)"

echo ""
echo "2. HTTP服务检查"
echo "================"
check_http "http://localhost:3000" "前端页面"
check_http "http://localhost:3001" "后端API"

echo ""
echo "3. Docker容器状态"
echo "================="
docker-compose ps

echo ""
echo "4. 服务进程检查"
echo "==============="
echo "前端容器进程:"
docker exec im-frontend ps aux | grep -E "(nginx|node)" | head -3

echo "后端容器进程:"
docker exec im-backend ps aux | grep node

echo "MongoDB容器进程:"
docker exec im-mongodb ps aux | grep mongod | head -1

echo ""
echo "5. 数据库连接测试"
echo "================"
echo "MongoDB连接状态:"
docker exec im-mongodb mongosh --quiet --eval "
try {
    db.adminCommand('ping');
    print('✅ MongoDB连接正常');
    print('数据库版本: ' + db.version());
    print('用户数量: ' + db.users.countDocuments());
} catch(e) {
    print('❌ MongoDB连接失败: ' + e);
}
"

echo ""
echo "6. API功能测试"
echo "=============="
echo "测试用户注册API:"
response=$(curl -s -X POST http://localhost:3001/api/register \
    -H "Content-Type: application/json" \
    -d '{"username":"testcheck","password":"123456"}' \
    --connect-timeout 5)

if echo "$response" | grep -q "successfully\|already exists"; then
    echo -e "${GREEN}✅ 注册API正常${NC}"
else
    echo -e "${RED}❌ 注册API异常${NC}"
    echo "响应: $response"
fi

echo ""
echo "7. 系统资源使用"
echo "=============="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "8. 网络连接统计"
echo "=============="
echo "监听端口:"
netstat -tlnp | grep -E ":(3000|3001|27017)" | awk '{print $1, $4, $7}' | column -t

echo ""
echo "=========================================="
echo "              检查完成"
echo "=========================================="

# 外部访问提示
echo ""
echo -e "${YELLOW}📝 访问信息:${NC}"
echo "前端访问: http://localhost:3000"
echo "后端API: http://localhost:3001"
echo "如需外部访问，请确保防火墙已开放相应端口"
echo ""
