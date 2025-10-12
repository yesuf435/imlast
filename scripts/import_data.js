#!/usr/bin/env node

const axios = require('axios');

// 配置
const API_BASE = 'http://localhost:3001';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZWEyOWY1ZWIyMDM1YThkMDYzY2Q4MiIsInVzZXJuYW1lIjoiYWxpY2UiLCJpYXQiOjE3NjAxNzY2MzcsImV4cCI6MTc2MDc4MTQzN30.U2IW9lk68SnxYu92UkqvhlxSz0dLBX5jt_Uz8uWd3FI';

// 示例数据
const sampleUsers = [
  { username: '张三', password: '123456', avatar: 'https://ui-avatars.com/api/?background=FF6B6B&color=fff&name=张三' },
  { username: '李四', password: '123456', avatar: 'https://ui-avatars.com/api/?background=4ECDC4&color=fff&name=李四' },
  { username: '王五', password: '123456', avatar: 'https://ui-avatars.com/api/?background=45B7D1&color=fff&name=王五' },
  { username: '赵六', password: '123456', avatar: 'https://ui-avatars.com/api/?background=96CEB4&color=fff&name=赵六' },
  { username: '钱七', password: '123456', avatar: 'https://ui-avatars.com/api/?background=FECA57&color=fff&name=钱七' }
];

const sampleMessages = [
  { sender: '68ea2b329bb41cac8d08f73d', receiver: '68ea2b339bb41cac8d08f740', content: '你好！', type: 'text' },
  { sender: '68ea2b339bb41cac8d08f740', receiver: '68ea2b329bb41cac8d08f73d', content: '你好，很高兴认识你！', type: 'text' },
  { sender: '68ea2b329bb41cac8d08f73d', receiver: '68ea2b339bb41cac8d08f740', content: '今天天气不错', type: 'text' },
  { sender: '68ea2b339bb41cac8d08f740', receiver: '68ea2b329bb41cac8d08f73d', content: '是的，很适合出去走走', type: 'text' }
];

async function importData() {
  try {
    console.log('🚀 开始导入数据...');
    
    // 1. 批量创建用户
    console.log('📝 创建用户...');
    const userResponse = await axios.post(`${API_BASE}/api/admin/users/batch`, {
      users: sampleUsers
    }, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    console.log(`✅ 创建了 ${userResponse.data.count} 个用户`);
    
    // 2. 批量创建消息
    console.log('💬 创建消息...');
    const messageResponse = await axios.post(`${API_BASE}/api/admin/messages/batch`, {
      messages: sampleMessages
    }, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    console.log(`✅ 创建了 ${messageResponse.data.count} 条消息`);
    
    // 3. 获取统计信息
    console.log('📊 获取系统统计...');
    const statsResponse = await axios.get(`${API_BASE}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    console.log('📈 系统统计:', JSON.stringify(statsResponse.data, null, 2));
    
    console.log('🎉 数据导入完成！');
    
  } catch (error) {
    console.error('❌ 导入失败:', error.response?.data || error.message);
  }
}

// 运行导入
importData();
