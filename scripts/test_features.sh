#!/bin/bash

echo "=========================================="
echo "     IM系统功能完整性测试"
echo "=========================================="

# 登录获取token
echo "🔐 正在登录..."
login_response=$(curl -s -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test123","password":"123456"}')

token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
user_id=$(echo "$login_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$token" ]; then
    echo "❌ 登录失败"
    exit 1
fi

echo "✅ 登录成功 - 用户ID: $user_id"
echo ""

# 1. 测试好友功能
echo "👥 1. 好友功能测试"
echo "==================="
echo "获取好友列表:"
friends_response=$(curl -s -H "Authorization: Bearer $token" http://localhost:3001/api/friends)
echo "$friends_response"

echo ""
echo "获取所有用户:"
users_response=$(curl -s -H "Authorization: Bearer $token" http://localhost:3001/api/users)
echo "$users_response" | head -200

# 2. 测试私信功能
echo ""
echo "💬 2. 私信功能测试"
echo "=================="
other_user_id="68ea2e179bb41cac8d08f785"
echo "获取与用户 $other_user_id 的私信:"
messages_response=$(curl -s -H "Authorization: Bearer $token" "http://localhost:3001/api/messages/$other_user_id")
echo "$messages_response"

# 3. 测试群组功能
echo ""
echo "👨‍👩‍👧‍👦 3. 群组功能测试"
echo "=================="
echo "获取用户群组:"
groups_response=$(curl -s -H "Authorization: Bearer $token" http://localhost:3001/api/groups)
echo "$groups_response"

# 4. 测试聊天列表
echo ""
echo "📋 4. 聊天列表测试"
echo "=================="
echo "获取聊天列表:"
chats_response=$(curl -s -H "Authorization: Bearer $token" http://localhost:3001/api/chats)
echo "$chats_response"

# 5. 测试文件上传
echo ""
echo "📁 5. 文件上传测试"
echo "=================="
echo "测试文件上传接口:"
upload_response=$(curl -s -X POST -H "Authorization: Bearer $token" http://localhost:3001/api/upload)
echo "$upload_response"

# 6. Socket.io连接测试
echo ""
echo "🔌 6. Socket.io连接测试"
echo "======================"
echo "测试Socket.io连接:"
socket_response=$(curl -s "http://localhost:3001/socket.io/?EIO=4&transport=polling")
echo "${socket_response:0:100}..."

echo ""
echo "=========================================="
echo "              测试完成"
echo "=========================================="
