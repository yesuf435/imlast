const http = require('http');

const API_BASE = 'http://localhost:3001';

console.log('🚀 开始后端API测试...');
console.log('API基础URL:', API_BASE);

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPI() {
  try {
    // 1. 测试基础API
    console.log('\n1️⃣ 测试基础API...');
    const testOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/test',
      method: 'GET'
    };
    
    const testResult = await makeRequest(testOptions);
    if (testResult.status === 200) {
      console.log('✅ 基础API测试成功:', testResult.data);
    } else {
      console.log('❌ 基础API测试失败，状态码:', testResult.status);
      return;
    }

    // 2. 测试用户注册
    console.log('\n2️⃣ 测试用户注册...');
    const registerData = {
      username: 'testuser_' + Date.now(),
      password: '123456'
    };
    
    const registerOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const registerResult = await makeRequest(registerOptions, registerData);
    if (registerResult.status === 201) {
      console.log('✅ 用户注册成功:', registerResult.data.message);
      const token = registerResult.data.token;
      const userId = registerResult.data.user.id;

      // 3. 测试获取用户列表
      console.log('\n3️⃣ 测试获取用户列表...');
      const usersOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/users',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const usersResult = await makeRequest(usersOptions);
      if (usersResult.status === 200) {
        console.log('✅ 获取用户列表成功，用户数量:', usersResult.data.length);
      } else {
        console.log('❌ 获取用户列表失败，状态码:', usersResult.status);
      }

      // 4. 测试获取好友列表
      console.log('\n4️⃣ 测试获取好友列表...');
      const friendsOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/friends',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const friendsResult = await makeRequest(friendsOptions);
      if (friendsResult.status === 200) {
        console.log('✅ 获取好友列表成功，好友数量:', friendsResult.data.length);
      } else {
        console.log('❌ 获取好友列表失败，状态码:', friendsResult.status);
      }

      // 5. 测试获取聊天列表
      console.log('\n5️⃣ 测试获取聊天列表...');
      const chatsOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/chats',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const chatsResult = await makeRequest(chatsOptions);
      if (chatsResult.status === 200) {
        console.log('✅ 获取聊天列表成功，聊天数量:', chatsResult.data.length);
      } else {
        console.log('❌ 获取聊天列表失败，状态码:', chatsResult.status);
      }

    } else {
      console.log('❌ 用户注册失败，状态码:', registerResult.status);
      console.log('错误信息:', registerResult.data);
    }

    console.log('\n🎉 API测试完成！');

  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 提示: 后端服务可能未启动，请先运行: node server.js');
    }
  }
}

testAPI();

