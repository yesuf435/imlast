const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/im-system';

console.log('🔍 测试MongoDB连接...');
console.log('连接字符串:', MONGO_URI);

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB连接成功!');
  console.log('数据库名称:', mongoose.connection.db.databaseName);
  
  // 测试基本操作
  return mongoose.connection.db.admin().ping();
})
.then(() => {
  console.log('✅ 数据库ping成功!');
  
  // 检查集合
  return mongoose.connection.db.listCollections().toArray();
})
.then((collections) => {
  console.log('📊 数据库集合:');
  collections.forEach(col => {
    console.log(`  - ${col.name}`);
  });
  
  // 测试用户集合
  const User = require('./models/User');
  return User.countDocuments();
})
.then((count) => {
  console.log(`👥 用户数量: ${count}`);
  process.exit(0);
})
.catch((error) => {
  console.error('❌ 数据库连接失败:', error.message);
  process.exit(1);
});

