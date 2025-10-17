const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require('./models/User');
const Message = require('./models/Message');
const Group = require('./models/Group');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://47.121.27.165:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/im-system';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Upload directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// MongoDB Connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// REST API Routes

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const user = new User({ 
      username, 
      password,
      avatar: `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${username}`
    });
    await user.save();

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        online: user.online
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    user.online = true;
    user.lastSeen = new Date();
    await user.save();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        online: user.online
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Get all users (for adding friends)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select('username avatar online lastSeen')
      .limit(50);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user's friends
app.get('/api/friends', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('friends', 'username avatar online lastSeen');
    res.json(user.friends || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Add friend
app.post("/api/friends/add", authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.body;
    const user = await User.findById(req.user.id);
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.friends.includes(friendId)) {
      user.friends.push(friendId);
      await user.save();
    }

    if (!friend.friends.includes(req.user.id)) {
      friend.friends.push(req.user.id);
      await friend.save();
    }

    // 发送Socket.IO通知给被添加的好友
    const friendSocketId = userSockets.get(friendId);
    if (friendSocketId) {
      io.to(friendSocketId).emit("friend_request", {
        type: "friend_added",
        from: {
          id: user._id,
          username: user.username,
          avatar: user.avatar
        },
        message: `${user.username} 已添加您为好友`,
        timestamp: new Date()
      });
    }

    // 发送通知给添加者
    const userSocketId = userSockets.get(req.user.id);
    if (userSocketId) {
      io.to(userSocketId).emit("friend_request", {
        type: "friend_added_success",
        to: {
          id: friend._id,
          username: friend.username,
          avatar: friend.avatar
        },
        message: `已成功添加 ${friend.username} 为好友`,
        timestamp: new Date()
      });
    }

    res.json({ message: "Friend added successfully", friend });
  } catch (error) {
    res.status(500).json({ error: "Failed to add friend" });
  }
});
// Get messages between two users
app.get('/api/messages/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id }
      ]
    })
    .populate('sender', 'username avatar')
    .populate('receiver', 'username avatar')
    .sort({ timestamp: 1 })
    .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get group messages
app.get('/api/messages/group/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await Message.find({ group: groupId })
      .populate('sender', 'username avatar')
      .sort({ timestamp: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch group messages' });
  }
});

// Get user's groups
app.get('/api/groups', authenticateToken, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate('members', 'username avatar online')
      .populate('admin', 'username');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Create group
app.post('/api/groups/create', authenticateToken, async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    
    const group = new Group({
      name,
      admin: req.user.id,
      members: [req.user.id, ...memberIds],
      avatar: `https://ui-avatars.com/api/?background=random&name=${name}`
    });

    await group.save();
    await group.populate('members', 'username avatar online');
    await group.populate('admin', 'username');

    res.status(201).json({ message: 'Group created successfully', group });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Upload image
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get chat list with last messages
app.get('/api/chats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get friends
    const user = await User.findById(userId).populate('friends', 'username avatar online lastSeen');
    
    // Get groups
    const groups = await Group.find({ members: userId })
      .populate('members', 'username avatar')
      .populate('admin', 'username');

    // Get last message for each friend
    const friendsWithMessages = await Promise.all(
      (user.friends || []).map(async (friend) => {
        const lastMessage = await Message.findOne({
          $or: [
            { sender: userId, receiver: friend._id },
            { sender: friend._id, receiver: userId }
          ]
        }).sort({ timestamp: -1 });

        const unreadCount = await Message.countDocuments({
          sender: friend._id,
          receiver: userId,
          read: false
        });

        return {
          type: 'private',
          id: friend._id,
          name: friend.username,
          avatar: friend.avatar,
          online: friend.online,
          lastSeen: friend.lastSeen,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            timestamp: lastMessage.timestamp,
            type: lastMessage.type
          } : null,
          unreadCount
        };
      })
    );

    // Get last message for each group
    const groupsWithMessages = await Promise.all(
      groups.map(async (group) => {
        const lastMessage = await Message.findOne({ group: group._id })
          .sort({ timestamp: -1 })
          .populate('sender', 'username');

        const unreadCount = await Message.countDocuments({
          group: group._id,
          sender: { $ne: userId },
          readBy: { $nin: [userId] }
        });

        return {
          type: 'group',
          id: group._id,
          name: group.name,
          avatar: group.avatar,
          members: group.members,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            timestamp: lastMessage.timestamp,
            sender: lastMessage.sender?.username,
            type: lastMessage.type
          } : null,
          unreadCount
        };
      })
    );

    const allChats = [...friendsWithMessages, ...groupsWithMessages]
      .sort((a, b) => {
        const aTime = a.lastMessage?.timestamp || 0;
        const bTime = b.lastMessage?.timestamp || 0;
        return new Date(bTime) - new Date(aTime);
      });

    res.json(allChats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chats', details: error.message });
  }
});

// Socket.IO
const userSockets = new Map(); // userId -> socketId

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.userId = decoded.id;
    socket.username = decoded.username;
    next();
  });
});

io.on('connection', async (socket) => {
  console.log(`User connected: ${socket.username} (${socket.userId})`);
  
  userSockets.set(socket.userId, socket.id);

  // Update user online status
  try {
    await User.findByIdAndUpdate(socket.userId, { 
      online: true,
      lastSeen: new Date()
    });
    
    // Notify friends about online status
    const user = await User.findById(socket.userId).populate('friends');
    user.friends.forEach(friend => {
      const friendSocketId = userSockets.get(friend._id.toString());
      if (friendSocketId) {
        io.to(friendSocketId).emit('user_online', {
          userId: socket.userId,
          username: socket.username,
          online: true
        });
      }
    });
  } catch (error) {
    console.error('Error updating online status:', error);
  }

  // Join private room
  socket.on('join', (data) => {
    const { roomId } = data;
    socket.join(roomId);
    console.log(`${socket.username} joined room: ${roomId}`);
  });

  // Send private message
  socket.on('message', async (data) => {
    try {
      const { receiverId, content, type = 'text' } = data;

      const message = new Message({
        sender: socket.userId,
        receiver: receiverId,
        content,
        type,
        timestamp: new Date()
      });

      await message.save();
      await message.populate('sender', 'username avatar');
      await message.populate('receiver', 'username avatar');

      // Send to receiver
      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('message', message);
      }

      // Send back to sender
      socket.emit('message', message);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Send group message
  socket.on('group_message', async (data) => {
    try {
      const { groupId, content, type = 'text' } = data;

      const group = await Group.findById(groupId);
      if (!group || !group.members.includes(socket.userId)) {
        return socket.emit('error', { message: 'Not a member of this group' });
      }

      const message = new Message({
        sender: socket.userId,
        group: groupId,
        content,
        type,
        timestamp: new Date()
      });

      await message.save();
      await message.populate('sender', 'username avatar');

      // Send to all group members
      group.members.forEach(memberId => {
        const memberSocketId = userSockets.get(memberId.toString());
        if (memberSocketId) {
          io.to(memberSocketId).emit('group_message', {
            ...message.toObject(),
            groupId
          });
        }
      });
    } catch (error) {
      console.error('Error sending group message:', error);
      socket.emit('error', { message: 'Failed to send group message' });
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { receiverId, isTyping } = data;
    const receiverSocketId = userSockets.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping
      });
    }
  });

  // Mark message as read
  socket.on('mark_read', async (data) => {
    try {
      const { messageId } = data;
      await Message.findByIdAndUpdate(messageId, { read: true });
      
      const message = await Message.findById(messageId);
      if (message && message.sender) {
        const senderSocketId = userSockets.get(message.sender.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit('message_read', { messageId });
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.username}`);
    userSockets.delete(socket.userId);

    try {
      await User.findByIdAndUpdate(socket.userId, { 
        online: false,
        lastSeen: new Date()
      });

      // Notify friends about offline status
      const user = await User.findById(socket.userId).populate('friends');
      user.friends.forEach(friend => {
        const friendSocketId = userSockets.get(friend._id.toString());
        if (friendSocketId) {
          io.to(friendSocketId).emit('user_online', {
            userId: socket.userId,
            username: socket.username,
            online: false,
            lastSeen: new Date()
          });
        }
      });
    } catch (error) {
      console.error('Error updating offline status:', error);
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



// 聊天记录管理API
app.get('/api/admin/chat-records', async (req, res) => {
  try {
    const { search, date, type } = req.query;
    let query = {};
    
    if (search) {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { 'sender.username': { $regex: search, $options: 'i' } },
        { 'receiver.username': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    const messages = await Message.find(query)
      .populate('sender', 'username avatar role')
      .populate('receiver', 'username avatar role')
      .populate('groupId', 'name')
      .sort({ createdAt: -1 })
      .limit(100);
    
    const chatRecords = messages.map(msg => ({
      id: msg._id,
      timestamp: msg.createdAt,
      sender: {
        name: msg.sender?.username || '系统',
        role: msg.sender?.role || 'system'
      },
      receiver: {
        name: msg.groupId?.name || msg.receiver?.username || '未知',
        role: msg.receiver?.role || 'user'
      },
      messageType: msg.type || 'text',
      chatType: msg.groupId ? '群聊' : '私聊',
      content: msg.content
    }));
    
    res.json(chatRecords);
  } catch (error) {
    console.error('Error fetching chat records:', error);
    res.status(500).json({ error: 'Failed to fetch chat records' });
  }
});

// 部门管理API
app.get('/api/admin/departments', async (req, res) => {
  try {
    const departments = [
      {
        id: 1,
        name: '现代艺术部',
        description: '现代艺术拍卖与咨询',
        icon: '🎨',
        onlineStaff: 3,
        totalStaff: 8,
        todayServices: 15
      },
      {
        id: 2,
        name: '古典艺术部',
        description: '古典艺术鉴定与拍卖',
        icon: '🏛️',
        onlineStaff: 2,
        totalStaff: 6,
        todayServices: 12
      },
      {
        id: 3,
        name: '珠宝部',
        description: '珠宝鉴定与拍卖',
        icon: '💎',
        onlineStaff: 4,
        totalStaff: 10,
        todayServices: 18
      },
      {
        id: 4,
        name: '客户服务部',
        description: '客户关系维护',
        icon: '👥',
        onlineStaff: 5,
        totalStaff: 12,
        todayServices: 25
      }
    ];
    
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// 客服人员API
app.get('/api/admin/staff', async (req, res) => {
  try {
    const staff = [
      {
        id: 1,
        name: '李俊',
        email: 'lijun@christies.com',
        department: '现代艺术部',
        position: '经纪人',
        status: 'online',
        todayServices: 8
      },
      {
        id: 2,
        name: '王雅',
        email: 'wangya@christies.com',
        department: '古典艺术部',
        position: '专家',
        status: 'online',
        todayServices: 6
      },
      {
        id: 3,
        name: '张明',
        email: 'zhangming@christies.com',
        department: '珠宝部',
        position: '鉴定师',
        status: 'offline',
        todayServices: 4
      },
      {
        id: 4,
        name: '刘芳',
        email: 'liufang@christies.com',
        department: '客户服务部',
        position: '客服经理',
        status: 'online',
        todayServices: 12
      }
    ];
    
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// 服务请求API
app.get('/api/admin/service-requests', async (req, res) => {
  try {
    const serviceRequests = [
      {
        id: 1,
        staff: {
          name: '李俊',
          position: '经纪人'
        },
        customer: {
          name: '张三'
        },
        message: '希望为客户提供专业的现代艺术咨询服务',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
        status: 'pending'
      },
      {
        id: 2,
        staff: {
          name: '王雅',
          position: '专家'
        },
        customer: {
          name: '李四'
        },
        message: '客户需要古典艺术鉴定服务',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1小时前
        status: 'pending'
      }
    ];
    
    res.json(serviceRequests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ error: 'Failed to fetch service requests' });
  }
});

// 处理服务请求API
app.post('/api/admin/service-requests/:requestId/:action', async (req, res) => {
  try {
    const { requestId, action } = req.params;
    
    // 这里应该更新数据库中的服务请求状态
    // 为了演示，我们直接返回成功
    
    if (action === 'approve') {
      // 发送通知给客户
      io.emit('service_request_approved', {
        requestId,
        message: '您的服务请求已被接受'
      });
    } else if (action === 'reject') {
      // 发送通知给客户
      io.emit('service_request_rejected', {
        requestId,
        message: '您的服务请求已被拒绝'
      });
    }
    
    res.json({ success: true, message: `Service request ${action}d successfully` });
  } catch (error) {
    console.error('Error processing service request:', error);
    res.status(500).json({ error: 'Failed to process service request' });
  }
});
