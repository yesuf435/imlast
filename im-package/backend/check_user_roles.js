const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUserRoles() {
  try {
    await mongoose.connect('mongodb://localhost:27017/im-system');
    console.log('Connected to MongoDB');

    const users = await User.find({}, 'username role');
    console.log('\n📋 所有用户角色:');
    users.forEach(user => {
      console.log(`- ${user.username}: ${user.role || 'undefined'}`);
    });

  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 数据库连接已关闭');
  }
}

checkUserRoles();
