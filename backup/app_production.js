const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const server = http.createServer(app);

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: false, // 允许Socket.io连接
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// CORS配置
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 登录速率限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制每个IP 15分钟内最多5次登录尝试
  message: '登录尝试过于频繁，请15分钟后再试'
});
app.use('/api/login', loginLimiter);

// MongoDB连接配置
const mongoConfig = {
  url: process.env.MONGO_URL || 'mongodb://localhost:27017',
  dbName: process.env.DB_NAME || 'im_production'
};

// Socket.io服务器配置
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 全局变量
let client;
let db;
const onlineUsers = new Map(); // 存储在线用户

// 初始化MongoDB连接
async function initDb() {
  try {
    client = new MongoClient(mongoConfig.url, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    await client.connect();
    db = client.db(mongoConfig.dbName);
    console.log('✅ MongoDB连接成功');
    await createIndexes();
    console.log('✅ 数据库索引创建完成');
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error.message);
    process.exit(1);
  }
}

// 创建数据库索引
async function createIndexes() {
  try {
    const collections = [
      { name: 'users', indexes: [{ username: 1 }, { email: 1 }] },
      { name: 'friend_requests', indexes: [{ sender_id: 1, receiver_id: 1 }] },
      { name: 'friendships', indexes: [{ user_id: 1, friend_id: 1 }] },
      { name: 'groups', indexes: [{ name: 1 }, { creator_id: 1 }] },
      { name: 'group_members', indexes: [{ group_id: 1, user_id: 1 }] },
      { name: 'group_messages', indexes: [{ group_id: 1, created_at: -1 }] },
      { name: 'private_messages', indexes: [{ sender_id: 1, receiver_id: 1, created_at: -1 }] }
    ];

    for (const collection of collections) {
      for (const index of collection.indexes) {
        try {
          await db.collection(collection.name).createIndex(index, { unique: index.username || index.email });
        } catch (err) {
          // 忽略重复索引错误
        }
      }
    }
  } catch (error) {
    console.log('索引创建警告:', error.message);
  }
}

// 认证中间件
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: '无效的认证令牌' });
  }
};

// 用户注册API
app.post('/api/register', async (req, res) => {
  const { username, password, email } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }

  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ message: '用户名长度必须在3-20个字符之间' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: '密码长度至少6个字符' });
  }
  
  try {
    // 检查用户是否已存在
    const existingUser = await db.collection('users').findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }
    
    // 加密密码
    const hashedPassword = await bcryptjs.hash(password, 12);
    
    // 创建新用户
    const result = await db.collection('users').insertOne({
      username,
      email: email || null,
      password: hashedPassword,
      avatar: null,
      status: 'offline',
      last_seen: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    });
    
    res.status(201).json({ 
      message: '注册成功',
      userId: result.insertedId
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 用户登录API
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }
  
  try {
    // 查询用户
    const user = await db.collection('users').findOne({ username });
    
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    // 验证密码
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { id: user._id.toString(), username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // 更新用户状态
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          status: 'online',
          last_seen: new Date(),
          updated_at: new Date()
        } 
      }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user._id.toString(), 
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: 'online'
      } 
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户信息API
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 搜索用户API
app.get('/api/users/search', authMiddleware, async (req, res) => {
  const { username } = req.query;
  
  if (!username || username.length < 2) {
    return res.status(400).json({ message: '请输入至少2个字符进行搜索' });
  }
  
  try {
    const users = await db.collection('users').find({
      username: { $regex: username, $options: 'i' },
      _id: { $ne: new ObjectId(req.user.id) }
    }, { 
      projection: { password: 0 },
      limit: 20
    }).toArray();
    
    const userList = users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      avatar: user.avatar,
      status: user.status
    }));
    
    res.json({ users: userList });
  } catch (error) {
    console.error('搜索用户失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 发送好友请求API
app.post('/api/friend-requests', authMiddleware, async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user.id;
  
  if (!receiverId) {
    return res.status(400).json({ message: '接收者ID不能为空' });
  }
  
  try {
    // 检查用户是否存在
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(receiverId) 
    });
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 检查是否已经是好友
    const friendship = await db.collection('friendships').findOne({
      $or: [
        { user_id: new ObjectId(senderId), friend_id: new ObjectId(receiverId) },
        { user_id: new ObjectId(receiverId), friend_id: new ObjectId(senderId) }
      ]
    });
    
    if (friendship) {
      return res.status(400).json({ message: '你们已经是好友了' });
    }
    
    // 检查是否已经发送过请求
    const existingRequest = await db.collection('friend_requests').findOne({
      sender_id: new ObjectId(senderId),
      receiver_id: new ObjectId(receiverId)
    });
    
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ message: '你已经发送过好友请求，等待对方接受' });
      } else if (existingRequest.status === 'rejected') {
        // 重新发送请求
        await db.collection('friend_requests').updateOne(
          { _id: existingRequest._id },
          { 
            $set: { 
              status: 'pending', 
              updated_at: new Date() 
            } 
          }
        );
        return res.status(200).json({ message: '好友请求已重新发送' });
      }
    }
    
    // 发送好友请求
    await db.collection('friend_requests').insertOne({
      sender_id: new ObjectId(senderId),
      receiver_id: new ObjectId(receiverId),
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // 通知接收者
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit('friend_request', {
        sender_id: senderId,
        sender_username: req.user.username
      });
    }
    
    res.status(201).json({ message: '好友请求已发送' });
  } catch (error) {
    console.error('发送好友请求失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取好友请求API
app.get('/api/friend-requests', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  
  try {
    // 获取收到的好友请求
    const receivedRequests = await db.collection('friend_requests').aggregate([
      {
        $match: {
          receiver_id: new ObjectId(userId),
          status: 'pending'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sender_id',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $unwind: '$sender'
      },
      {
        $project: {
          id: '$_id',
          sender_id: 1,
          sender_username: '$sender.username',
          sender_avatar: '$sender.avatar',
          status: 1,
          created_at: 1
        }
      },
      { $sort: { created_at: -1 } }
    ]).toArray();
    
    // 获取发送的好友请求
    const sentRequests = await db.collection('friend_requests').aggregate([
      {
        $match: {
          sender_id: new ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'receiver_id',
          foreignField: '_id',
          as: 'receiver'
        }
      },
      {
        $unwind: '$receiver'
      },
      {
        $project: {
          id: '$_id',
          receiver_id: 1,
          receiver_username: '$receiver.username',
          receiver_avatar: '$receiver.avatar',
          status: 1,
          created_at: 1
        }
      },
      { $sort: { created_at: -1 } }
    ]).toArray();
    
    res.json({
      received: receivedRequests,
      sent: sentRequests
    });
  } catch (error) {
    console.error('获取好友请求失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 处理好友请求API
app.put('/api/friend-requests/:requestId', authMiddleware, async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  
  if (!status || !['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: '状态无效，必须是 accepted 或 rejected' });
  }
  
  try {
    // 检查请求是否存在
    const request = await db.collection('friend_requests').findOne({
      _id: new ObjectId(requestId),
      receiver_id: new ObjectId(userId),
      status: 'pending'
    });
    
    if (!request) {
      return res.status(404).json({ message: '好友请求不存在或已处理' });
    }
    
    // 更新请求状态
    await db.collection('friend_requests').updateOne(
      { _id: new ObjectId(requestId) },
      { 
        $set: { 
          status, 
          updated_at: new Date() 
        } 
      }
    );
    
    // 如果接受请求，添加好友关系
    if (status === 'accepted') {
      // 检查是否已经是好友
      const existingFriendship = await db.collection('friendships').findOne({
        $or: [
          { user_id: new ObjectId(userId), friend_id: request.sender_id },
          { user_id: request.sender_id, friend_id: new ObjectId(userId) }
        ]
      });
      
      if (!existingFriendship) {
        // 添加双向好友关系
        await db.collection('friendships').insertMany([
          {
            user_id: new ObjectId(userId),
            friend_id: request.sender_id,
            created_at: new Date()
          },
          {
            user_id: request.sender_id,
            friend_id: new ObjectId(userId),
            created_at: new Date()
          }
        ]);
      }
      
      // 通知发送者
      const senderSocket = onlineUsers.get(request.sender_id.toString());
      if (senderSocket) {
        io.to(senderSocket).emit('friend_accepted', {
          friend_id: userId,
          friend_username: req.user.username
        });
      }
    }
    
    res.json({ message: status === 'accepted' ? '已接受好友请求' : '已拒绝好友请求' });
  } catch (error) {
    console.error('处理好友请求失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取好友列表API
app.get('/api/friends', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const friends = await db.collection('friendships').aggregate([
      {
        $match: {
          user_id: new ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'friend_id',
          foreignField: '_id',
          as: 'friend'
        }
      },
      {
        $unwind: '$friend'
      },
      {
        $project: {
          id: '$friend._id',
          username: '$friend.username',
          avatar: '$friend.avatar',
          status: '$friend.status',
          last_seen: '$friend.last_seen'
        }
      },
      { $sort: { username: 1 } }
    ]).toArray();
    
    res.json({ friends });
  } catch (error) {
    console.error('获取好友列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除好友API
app.delete('/api/friends/:friendId', authMiddleware, async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user.id;
  
  try {
    // 检查是否是好友
    const friendship = await db.collection('friendships').findOne({
      user_id: new ObjectId(userId),
      friend_id: new ObjectId(friendId)
    });
    
    if (!friendship) {
      return res.status(404).json({ message: '好友关系不存在' });
    }
    
    // 删除双向好友关系
    await db.collection('friendships').deleteMany({
      $or: [
        { user_id: new ObjectId(userId), friend_id: new ObjectId(friendId) },
        { user_id: new ObjectId(friendId), friend_id: new ObjectId(userId) }
      ]
    });
    
    res.json({ message: '好友已删除' });
  } catch (error) {
    console.error('删除好友失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建群组API
app.post('/api/groups/create', authMiddleware, async (req, res) => {
  const { name, description } = req.body;
  const creatorId = req.user.id;
  
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ message: '群组名称不能为空' });
  }
  
  if (name.length > 50) {
    return res.status(400).json({ message: '群组名称不能超过50个字符' });
  }
  
  try {
    // 创建群组
    const groupResult = await db.collection('groups').insertOne({
      name: name.trim(),
      description: description ? description.trim() : '',
      creator_id: new ObjectId(creatorId),
      avatar: null,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    const groupId = groupResult.insertedId;
    
    // 添加创建者为群成员（管理员角色）
    await db.collection('group_members').insertOne({
      group_id: groupId,
      user_id: new ObjectId(creatorId),
      role: 'admin',
      joined_at: new Date()
    });
    
    res.status(201).json({ 
      message: '群组创建成功',
      group: {
        id: groupId.toString(),
        name: name.trim(),
        description: description ? description.trim() : '',
        creator_id: creatorId
      }
    });
  } catch (error) {
    console.error('创建群组失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取我的群聊列表
app.get('/api/groups/my', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const groups = await db.collection('group_members').aggregate([
      {
        $match: {
          user_id: new ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: 'groups',
          localField: 'group_id',
          foreignField: '_id',
          as: 'group'
        }
      },
      {
        $unwind: '$group'
      },
      {
        $lookup: {
          from: 'group_members',
          localField: 'group_id',
          foreignField: 'group_id',
          as: 'members'
        }
      },
      {
        $project: {
          id: '$group._id',
          name: '$group.name',
          description: '$group.description',
          avatar: '$group.avatar',
          creator_id: '$group.creator_id',
          created_at: '$group.created_at',
          updated_at: '$group.updated_at',
          role: '$role',
          member_count: { $size: '$members' }
        }
      },
      { $sort: { updated_at: -1 } }
    ]).toArray();
    
    res.json({ groups });
  } catch (error) {
    console.error('获取群组列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取群聊详情
app.get('/api/groups/:groupId', authMiddleware, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;
  
  try {
    // 检查群组是否存在
    const group = await db.collection('groups').findOne({
      _id: new ObjectId(groupId)
    });
    
    if (!group) {
      return res.status(404).json({ message: '群组不存在' });
    }
    
    // 检查用户是否是群成员
    const membership = await db.collection('group_members').findOne({
      group_id: new ObjectId(groupId),
      user_id: new ObjectId(userId)
    });
    
    if (!membership) {
      return res.status(403).json({ message: '你不是该群成员' });
    }
    
    // 获取群成员列表
    const members = await db.collection('group_members').aggregate([
      {
        $match: {
          group_id: new ObjectId(groupId)
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user_id: 1,
          username: '$user.username',
          avatar: '$user.avatar',
          status: '$user.status',
          role: 1,
          joined_at: 1
        }
      },
      {
        $sort: {
          role: 1, // admin 优先
          joined_at: 1
        }
      }
    ]).toArray();
    
    // 获取成员数量
    const memberCount = await db.collection('group_members').countDocuments({
      group_id: new ObjectId(groupId)
    });
    
    const groupInfo = {
      id: group._id.toString(),
      name: group.name,
      description: group.description,
      avatar: group.avatar,
      creator_id: group.creator_id.toString(),
      created_at: group.created_at,
      updated_at: group.updated_at,
      member_count: memberCount
    };
    
    res.json({
      group: groupInfo,
      members,
      userRole: membership.role
    });
  } catch (error) {
    console.error('获取群组详情失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 邀请好友加入群聊
app.post('/api/groups/:groupId/invite', authMiddleware, async (req, res) => {
  const { groupId } = req.params;
  const { friendIds } = req.body;
  const userId = req.user.id;
  
  if (!friendIds || !Array.isArray(friendIds) || friendIds.length === 0) {
    return res.status(400).json({ message: '好友ID列表不能为空' });
  }
  
  try {
    // 检查群组是否存在
    const group = await db.collection('groups').findOne({
      _id: new ObjectId(groupId)
    });
    
    if (!group) {
      return res.status(404).json({ message: '群组不存在' });
    }
    
    // 检查用户是否是群成员
    const membership = await db.collection('group_members').findOne({
      group_id: new ObjectId(groupId),
      user_id: new ObjectId(userId)
    });
    
    if (!membership) {
      return res.status(403).json({ message: '你不是该群成员，无法邀请好友' });
    }
    
    const addedFriends = [];
    const errors = [];
    
    for (const friendId of friendIds) {
      try {
        // 检查是否是好友
        const friendship = await db.collection('friendships').findOne({
          user_id: new ObjectId(userId),
          friend_id: new ObjectId(friendId)
        });
        
        if (!friendship) {
          errors.push(`ID为${friendId}的用户不是你的好友`);
          continue;
        }
        
        // 检查是否已经是群成员
        const existingMember = await db.collection('group_members').findOne({
          group_id: new ObjectId(groupId),
          user_id: new ObjectId(friendId)
        });
        
        if (existingMember) {
          errors.push(`ID为${friendId}的用户已经是群成员`);
          continue;
        }
        
        // 添加为群成员
        await db.collection('group_members').insertOne({
          group_id: new ObjectId(groupId),
          user_id: new ObjectId(friendId),
          role: 'member',
          joined_at: new Date()
        });
        
        addedFriends.push(friendId);
        
        // 通知被邀请者
        const friendSocket = onlineUsers.get(friendId);
        if (friendSocket) {
          io.to(friendSocket).emit('group_invitation', {
            group_id: groupId,
            group_name: group.name,
            inviter_id: userId,
            inviter_name: req.user.username
          });
        }
      } catch (err) {
        errors.push(`处理用户${friendId}时出错: ${err.message}`);
      }
    }
    
    res.status(200).json({
      message: `已成功邀请${addedFriends.length}位好友加入群聊`,
      addedFriends,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('邀请好友加入群聊失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取群聊消息
app.get('/api/groups/:groupId/messages', authMiddleware, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;
  const { limit = 50, before } = req.query;
  
  try {
    // 检查用户是否是群成员
    const membership = await db.collection('group_members').findOne({
      group_id: new ObjectId(groupId),
      user_id: new ObjectId(userId)
    });
    
    if (!membership) {
      return res.status(403).json({ message: '你不是该群成员，无法查看消息' });
    }
    
    // 构建查询条件
    let query = { group_id: new ObjectId(groupId) };
    
    if (before) {
      query._id = { $lt: new ObjectId(before) };
    }
    
    // 获取消息
    const messages = await db.collection('group_messages').aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'sender_id',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $unwind: '$sender'
      },
      {
        $project: {
          id: '$_id',
          sender_id: 1,
          sender_name: '$sender.username',
          sender_avatar: '$sender.avatar',
          content: 1,
          message_type: { $ifNull: ['$message_type', 'text'] },
          created_at: 1
        }
      },
      { $sort: { _id: -1 } },
      { $limit: parseInt(limit) }
    ]).toArray();
    
    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('获取群聊消息失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 发送群聊消息
app.post('/api/groups/:groupId/messages', authMiddleware, async (req, res) => {
  const { groupId } = req.params;
  const { content, messageType = 'text' } = req.body;
  const senderId = req.user.id;
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ message: '消息内容不能为空' });
  }
  
  try {
    // 检查用户是否是群成员
    const membership = await db.collection('group_members').findOne({
      group_id: new ObjectId(groupId),
      user_id: new ObjectId(senderId)
    });
    
    if (!membership) {
      return res.status(403).json({ message: '你不是该群成员，无法发送消息' });
    }
    
    // 发送消息
    const messageResult = await db.collection('group_messages').insertOne({
      group_id: new ObjectId(groupId),
      sender_id: new ObjectId(senderId),
      content: content.trim(),
      message_type: messageType,
      created_at: new Date()
    });
    
    // 更新群组最后活动时间
    await db.collection('groups').updateOne(
      { _id: new ObjectId(groupId) },
      { $set: { updated_at: new Date() } }
    );
    
    // 获取发送者信息
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(senderId) 
    });
    
    const message = {
      id: messageResult.insertedId.toString(),
      group_id: groupId,
      sender_id: senderId,
      sender_name: user.username,
      sender_avatar: user.avatar,
      content: content.trim(),
      message_type: messageType,
      created_at: new Date()
    };
    
    // 通过Socket.io广播消息到群组
    io.emit('group_message', message);
    
    res.status(201).json({
      message: '消息已发送',
      messageId: messageResult.insertedId.toString()
    });
  } catch (error) {
    console.error('发送群聊消息失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 文件上传配置
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // 允许图片、音频、视频和文档
  const allowedTypes = /jpeg|jpg|png|gif|mp3|wav|mp4|avi|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 限制50MB
  }
});

// 文件上传API
app.post('/api/upload/file', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件或文件类型不支持' });
    }
    
    const filePath = `/uploads/${req.file.filename}`;
    
    res.status(201).json({ 
      message: '文件上传成功',
      filePath: filePath,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 静态文件服务
app.use('/uploads', express.static(uploadDir));

// Socket.io连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 用户登录
  socket.on('login', async (data) => {
    try {
      const { token } = data;
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // 存储用户连接信息
      onlineUsers.set(decoded.id, socket.id);
      socket.userId = decoded.id;
      socket.username = decoded.username;
      
      // 更新用户状态
      await db.collection('users').updateOne(
        { _id: new ObjectId(decoded.id) },
        { $set: { status: 'online', last_seen: new Date() } }
      );
      
      socket.emit('login_success', { username: decoded.username });
      
      // 通知好友用户上线
      const friends = await db.collection('friendships').find({
        user_id: new ObjectId(decoded.id)
      }).toArray();
      
      friends.forEach(async (friendship) => {
        const friendSocket = onlineUsers.get(friendship.friend_id.toString());
        if (friendSocket) {
          io.to(friendSocket).emit('friend_online', {
            friend_id: decoded.id,
            friend_username: decoded.username
          });
        }
      });
      
    } catch (error) {
      socket.emit('login_error', { message: '认证失败' });
    }
  });

  // 加入群组房间
  socket.on('join_group', (groupId) => {
    socket.join(`group_${groupId}`);
  });

  // 离开群组房间
  socket.on('leave_group', (groupId) => {
    socket.leave(`group_${groupId}`);
  });

  // 断开连接
  socket.on('disconnect', async () => {
    if (socket.userId) {
      // 移除在线用户
      onlineUsers.delete(socket.userId);
      
      // 更新用户状态
      await db.collection('users').updateOne(
        { _id: new ObjectId(socket.userId) },
        { $set: { status: 'offline', last_seen: new Date() } }
      );
      
      // 通知好友用户下线
      const friends = await db.collection('friendships').find({
        user_id: new ObjectId(socket.userId)
      }).toArray();
      
      friends.forEach(async (friendship) => {
        const friendSocket = onlineUsers.get(friendship.friend_id.toString());
        if (friendSocket) {
          io.to(friendSocket).emit('friend_offline', {
            friend_id: socket.userId,
            friend_username: socket.username
          });
        }
      });
    }
    
    console.log('用户断开连接:', socket.id);
  });
});

// 健康检查API
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ message: '服务器内部错误' });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 IM服务器启动成功，监听端口 ${PORT}`);
  console.log(`📱 前端地址: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔗 API地址: http://localhost:${PORT}`);
  await initDb();
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('正在关闭服务器...');
  if (client) {
    await client.close();
    console.log('MongoDB连接已关闭');
  }
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  if (client) {
    await client.close();
    console.log('MongoDB连接已关闭');
  }
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
