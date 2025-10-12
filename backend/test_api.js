const axios = require('axios');

const API_BASE = 'http://localhost:3001';

console.log('🚀 开始后端API测试...');
console.log('API基础URL:', API_BASE);

async function testAPI() {
  try {
    // 1. 测试基础API
    console.log('\n1️⃣ 测试基础API...');
    const testResponse = await axios.get(`${API_BASE}/api/test`);
    console.log('✅ 基础API测试成功:', testResponse.data);

    // 2. 测试用户注册
    console.log('\n2️⃣ 测试用户注册...');
    const registerData = {
      username: 'testuser_' + Date.now(),
      password: '123456'
    };
    
    const registerResponse = await axios.post(`${API_BASE}/api/register`, registerData);
    console.log('✅ 用户注册成功:', registerResponse.data.message);
    const token = registerResponse.data.token;
    const userId = registerResponse.data.user.id;

    // 3. 测试用户登录
    console.log('\n3️⃣ 测试用户登录...');
    const loginResponse = await axios.post(`${API_BASE}/api/login`, registerData);
    console.log('✅ 用户登录成功:', loginResponse.data.message);

    // 4. 测试获取用户列表
    console.log('\n4️⃣ 测试获取用户列表...');
    const usersResponse = await axios.get(`${API_BASE}/api/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ 获取用户列表成功，用户数量:', usersResponse.data.length);

    // 5. 测试获取好友列表
    console.log('\n5️⃣ 测试获取好友列表...');
    const friendsResponse = await axios.get(`${API_BASE}/api/friends`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ 获取好友列表成功，好友数量:', friendsResponse.data.length);

    // 6. 测试获取聊天列表
    console.log('\n6️⃣ 测试获取聊天列表...');
    const chatsResponse = await axios.get(`${API_BASE}/api/chats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ 获取聊天列表成功，聊天数量:', chatsResponse.data.length);

    // 7. 测试发送消息
    console.log('\n7️⃣ 测试发送消息...');
    if (usersResponse.data.length > 0) {
      const otherUserId = usersResponse.data[0]._id;
      const messageData = {
        receiver: otherUserId,
        content: '这是一条测试消息',
        type: 'text'
      };
      
      const messageResponse = await axios.post(`${API_BASE}/api/messages`, messageData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ 发送消息成功:', messageResponse.data.content);
    }

    console.log('\n🎉 所有API测试完成！');

  } catch (error) {
    console.error('❌ API测试失败:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 提示: 后端服务可能未启动，请先运行: node server.js');
    }
  }
}

testAPI();

