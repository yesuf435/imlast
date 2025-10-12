const mongoose = require('mongoose');

// 用户模型
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  avatar: String,
  role: {
    type: String,
    enum: ['user', 'admin', 'agent'],
    default: 'user'
  }
});

const User = mongoose.model('User', userSchema);

async function updateUserRole() {
  try {
    // 连接数据库
    await mongoose.connect('mongodb://localhost:27017/im-system');
    console.log('Connected to MongoDB');

    // 更新李俊的角色为 agent
    const result = await User.findByIdAndUpdate(
      '68eb91f8d3d97dc5cfb370d6',
      { role: 'agent' },
      { new: true }
    );

    if (result) {
      console.log('✅ 李俊角色更新成功:', {
        username: result.username,
        role: result.role
      });
    } else {
      console.log('❌ 用户未找到');
    }

    // 查看所有用户角色
    const users = await User.find({}, 'username role');
    console.log('\n📋 所有用户角色:');
    users.forEach(user => {
      console.log(`- ${user.username}: ${user.role}`);
    });

  } catch (error) {
    console.error('❌ 更新失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 数据库连接已关闭');
  }
}

updateUserRole();
