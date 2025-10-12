#!/usr/bin/env node

const axios = require("axios");

async function testConnection() {
  console.log("🧪 测试前后端连接...\n");

  const baseURL = "http://localhost:3001";

  try {
    // 测试健康检查
    console.log("1. 测试后端健康检查...");
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log("✅ 后端健康检查通过:", healthResponse.data);

    // 测试API端点
    console.log("\n2. 测试API端点...");
    const testResponse = await axios.get(`${baseURL}/api/test`);
    console.log("✅ API端点正常:", testResponse.data);

    // 测试用户注册
    console.log("\n3. 测试用户注册...");
    const registerData = {
      username: `testuser_${Date.now()}`,
      password: "testpass123",
    };

    try {
      const registerResponse = await axios.post(
        `${baseURL}/api/register`,
        registerData
      );
      console.log("✅ 用户注册成功:", registerResponse.data.message);

      // 测试用户登录
      console.log("\n4. 测试用户登录...");
      const loginResponse = await axios.post(`${baseURL}/api/login`, {
        username: registerData.username,
        password: registerData.password,
      });
      console.log("✅ 用户登录成功:", loginResponse.data.message);

      // 测试认证API
      console.log("\n5. 测试认证API...");
      const token = loginResponse.data.token;
      const profileResponse = await axios.get(`${baseURL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("✅ 认证API正常:", profileResponse.data.username);
    } catch (error) {
      if (
        error.response?.status === 400 &&
        error.response.data.error.includes("already exists")
      ) {
        console.log("⚠️ 测试用户已存在，跳过注册测试");
      } else {
        throw error;
      }
    }

    console.log("\n🎉 所有测试通过！前后端连接正常");
  } catch (error) {
    console.error("❌ 测试失败:", error.message);
    if (error.response) {
      console.error("响应数据:", error.response.data);
    }
    process.exit(1);
  }
}

testConnection();
