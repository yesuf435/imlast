const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const User = require("./models/User");
const Message = require("./models/Message");
const Group = require("./models/Group");
const FriendRequest = require("./models/FriendRequest");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://8.148.77.51:3000",
      "http://im-frontend:3000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const MONGO_URI =
  process.env.MONGO_URL || "mongodb://localhost:27017/im-system";

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://8.148.77.51:3000",
      "http://im-frontend:3000",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Upload directory
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// MongoDB Connection
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// REST API Routes

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const user = new User({
      username,
      password,
      avatar: `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${username}`,
    });
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Registration failed", details: error.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    user.online = true;
    user.lastSeen = new Date();
    await user.save();

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        online: user.online,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed", details: error.message });
  }
});

// Get all users (for adding friends)
app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select("username avatar online lastSeen")
      .limit(50);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get user's friends
app.get("/api/friends", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "friends",
      "username avatar online lastSeen"
    );
    res.json(user.friends || []);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch friends" });
  }
});

// Search users
app.get("/api/users/search", authenticateToken, async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: "Username parameter required" });
    }

    const users = await User.find({
      username: { $regex: username, $options: "i" },
      _id: { $ne: req.user.id },
    })
      .select("username avatar online lastSeen")
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to search users" });
  }
});

// Get user profile
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "username avatar email online lastSeen"
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Send friend request
app.post("/api/friend-requests", authenticateToken, async (req, res) => {
  try {
    const { receiverId } = req.body;
    const user = await User.findById(req.user.id);
    const friend = await User.findById(receiverId);

    if (!friend) {
      return res.status(404).json({ error: "User not found" });
    }

    // 检查是否已经是好友
    if (user.friends.includes(receiverId)) {
      return res.status(400).json({ error: "Already friends" });
    }

    // 检查是否已经发送过申请
    const existingRequest = await FriendRequest.findOne({
      sender: req.user.id,
      receiver: receiverId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Friend request already sent" });
    }

    // 创建好友申请
    const friendRequest = new FriendRequest({
      sender: req.user.id,
      receiver: receiverId,
      status: "pending",
      createdAt: new Date(),
    });

    await friendRequest.save();

    // 发送Socket.IO通知给被申请的好友
    const friendSocketId = userSockets.get(receiverId);
    if (friendSocketId) {
      io.to(friendSocketId).emit("friend_request", {
        type: "friend_request_received",
        from: {
          id: user._id,
          username: user.username,
          avatar: user.avatar,
        },
        requestId: friendRequest._id,
        message: `${user.username} 想要添加您为好友`,
        timestamp: new Date(),
      });
    }

    res.json({
      message: "Friend request sent successfully",
      requestId: friendRequest._id,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to send friend request" });
  }
});

// Accept friend request
app.put(
  "/api/friend-requests/:requestId",
  authenticateToken,
  async (req, res) => {
    try {
      const { requestId } = req.body;
      const request = await FriendRequest.findById(requestId);

      if (!request) {
        return res.status(404).json({ error: "Friend request not found" });
      }

      if (request.receiver.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Not authorized to accept this request" });
      }

      if (request.status !== "pending") {
        return res.status(400).json({ error: "Request already processed" });
      }

      // 更新申请状态
      request.status = status;
      await request.save();

      // 添加好友关系
      const user = await User.findById(req.user.id);
      const friend = await User.findById(request.sender);

      if (!user.friends.includes(request.sender)) {
        user.friends.push(request.sender);
        await user.save();
      }

      if (!friend.friends.includes(req.user.id)) {
        friend.friends.push(req.user.id);
        await friend.save();
      }

      // 发送通知给申请者
      const senderSocketId = userSockets.get(request.sender.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("friend_request", {
          type: "friend_request_accepted",
          from: {
            id: user._id,
            username: user.username,
            avatar: user.avatar,
          },
          message: `${user.username} 已接受您的好友申请`,
          timestamp: new Date(),
        });
      }

      res.json({ message: "Friend request accepted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to accept friend request" });
    }
  }
);

// Reject friend request
app.post("/api/friends/reject", authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    if (request.receiver.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to reject this request" });
    }

    request.status = "rejected";
    await request.save();

    res.json({ message: "Friend request rejected successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject friend request" });
  }
});

// Get friend requests
app.get("/api/friend-requests", authenticateToken, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user.id,
      status: "pending",
    }).populate("sender", "username avatar");

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch friend requests" });
  }
});

// Add friend (legacy - for backward compatibility)
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
          avatar: user.avatar,
        },
        message: `${user.username} 已添加您为好友`,
        timestamp: new Date(),
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
          avatar: friend.avatar,
        },
        message: `已成功添加 ${friend.username} 为好友`,
        timestamp: new Date(),
      });
    }

    res.json({ message: "Friend added successfully", friend });
  } catch (error) {
    res.status(500).json({ error: "Failed to add friend" });
  }
});

// Get chat list with last messages
app.get("/api/chats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get friends
    const user = await User.findById(userId).populate(
      "friends",
      "username avatar online lastSeen"
    );

    // Get groups
    const groups = await Group.find({ members: userId })
      .populate("members", "username avatar")
      .populate("admin", "username");

    // Get last message for each friend
    const friendsWithMessages = await Promise.all(
      (user.friends || []).map(async (friend) => {
        const lastMessage = await Message.findOne({
          $or: [
            { sender: userId, receiver: friend._id },
            { sender: friend._id, receiver: userId },
          ],
        }).sort({ timestamp: -1 });

        const unreadCount = await Message.countDocuments({
          sender: friend._id,
          receiver: userId,
          read: false,
        });

        return {
          type: "private",
          id: friend._id,
          name: friend.username,
          avatar: friend.avatar,
          online: friend.online,
          lastSeen: friend.lastSeen,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                timestamp: lastMessage.timestamp,
                type: lastMessage.type,
              }
            : null,
          unreadCount,
        };
      })
    );

    // Get last message for each group
    const groupsWithMessages = await Promise.all(
      groups.map(async (group) => {
        const lastMessage = await Message.findOne({
          group: group._id,
        }).sort({ timestamp: -1 });

        const unreadCount = await Message.countDocuments({
          group: group._id,
          sender: { $ne: userId },
          read: false,
        });

        return {
          type: "group",
          id: group._id,
          name: group.name,
          avatar: group.avatar,
          online: true,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                timestamp: lastMessage.timestamp,
                type: lastMessage.type,
              }
            : null,
          unreadCount,
        };
      })
    );

    const allChats = [...friendsWithMessages, ...groupsWithMessages];
    allChats.sort((a, b) => {
      const aTime = a.lastMessage?.timestamp || 0;
      const bTime = b.lastMessage?.timestamp || 0;
      return bTime - aTime;
    });

    res.json(allChats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

// Get private messages between two users
app.get(
  "/api/private-messages/:userId",
  authenticateToken,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 50, before } = req.query;
      const currentUserId = req.user.id;

      let query = {
        $or: [
          { sender: currentUserId, receiver: userId },
          { sender: userId, receiver: currentUserId },
        ],
      };

      if (before) {
        query.timestamp = { $lt: new Date(before) };
      }

      const messages = await Message.find(query)
        .populate("sender", "username avatar")
        .sort({ timestamp: -1 })
        .limit(parseInt(limit));

      // Mark messages as read
      await Message.updateMany(
        { sender: userId, receiver: currentUserId, read: false },
        { read: true }
      );

      res.json(messages.reverse());
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  }
);

// Send private message
app.post("/api/private-messages", authenticateToken, async (req, res) => {
  try {
    const { receiverId, content, messageType = "text" } = req.body;
    const sender = req.user.id;

    const message = new Message({
      sender,
      receiver: receiverId,
      content,
      type: messageType,
      timestamp: new Date(),
    });

    await message.save();
    await message.populate("sender", "username avatar");

    // Emit to Socket.IO
    io.to(receiverId).emit("private_message", message);

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get group messages
app.get(
  "/api/groups/:groupId/messages",
  authenticateToken,
  async (req, res) => {
    try {
      const { groupId } = req.params;
      const { limit = 50, before } = req.query;

      let query = { group: groupId };
      if (before) {
        query.timestamp = { $lt: new Date(before) };
      }

      const messages = await Message.find(query)
        .populate("sender", "username avatar")
        .sort({ timestamp: -1 })
        .limit(parseInt(limit));

      res.json(messages.reverse());
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch group messages" });
    }
  }
);

// Send group message
app.post(
  "/api/groups/:groupId/messages",
  authenticateToken,
  async (req, res) => {
    try {
      const { groupId } = req.params;
      const { content, messageType = "text" } = req.body;
      const sender = req.user.id;

      const message = new Message({
        sender,
        group: groupId,
        content,
        type: messageType,
        timestamp: new Date(),
      });

      await message.save();
      await message.populate("sender", "username avatar");

      // Emit to Socket.IO
      io.to(groupId).emit("group_message", message);

      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send group message" });
    }
  }
);

// Send message (支持文件消息)
app.post("/api/messages", authenticateToken, async (req, res) => {
  try {
    const {
      receiver,
      content,
      type = "text",
      group,
      fileInfo,
      metadata,
    } = req.body;
    const sender = req.user.id;

    const message = new Message({
      sender,
      receiver,
      content,
      type,
      group,
      fileInfo,
      metadata,
      timestamp: new Date(),
    });

    await message.save();
    await message.populate("sender", "username avatar");

    // Emit to Socket.IO
    if (group) {
      io.to(group).emit("group_message", message);
    } else {
      io.to(receiver).emit("message", message);
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// 发送文件消息
app.post(
  "/api/messages/file",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    try {
      const { receiver, group, content = "" } = req.body;
      const sender = req.user.id;

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileInfo = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileUrl: `/uploads/${req.file.filename}`,
      };

      const message = new Message({
        sender,
        receiver,
        content: content || req.file.originalname,
        type: getFileType(req.file.mimetype),
        group,
        fileInfo,
        timestamp: new Date(),
      });

      await message.save();
      await message.populate("sender", "username avatar");

      // Emit to Socket.IO
      if (group) {
        io.to(group).emit("group_message", message);
      } else {
        io.to(receiver).emit("message", message);
      }

      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send file message" });
    }
  }
);

// Create group
app.post("/api/groups/create", authenticateToken, async (req, res) => {
  try {
    const { name, description, memberIds = [] } = req.body;
    const admin = req.user.id;

    const group = new Group({
      name,
      description,
      admin,
      members: [admin, ...memberIds],
    });

    await group.save();
    await group.populate("members", "username avatar");
    await group.populate("admin", "username");

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: "Failed to create group" });
  }
});

// Get my groups
app.get("/api/groups/my", authenticateToken, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate("members", "username avatar")
      .populate("admin", "username");

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

// Get group details
app.get("/api/groups/:groupId", authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId)
      .populate("members", "username avatar")
      .populate("admin", "username");

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch group details" });
  }
});

// Invite to group
app.post("/api/groups/:groupId/invite", authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { friendIds } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only admin can invite members" });
    }

    group.members = [...new Set([...group.members, ...friendIds])];
    await group.save();

    res.json({ message: "Members invited successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to invite members" });
  }
});

// Upload file (支持多种文件类型)
app.post(
  "/api/upload",
  authenticateToken,
  upload.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      const fileType = getFileType(req.file.mimetype);

      res.json({
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        type: fileType,
      });
    } catch (error) {
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// 批量上传文件
app.post(
  "/api/upload/multiple",
  authenticateToken,
  upload.array("files", 10),
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadedFiles = req.files.map((file) => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        type: getFileType(file.mimetype),
      }));

      res.json({ files: uploadedFiles });
    } catch (error) {
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// 辅助函数：根据MIME类型确定文件类型
function getFileType(mimetype) {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  if (mimetype.includes("pdf")) return "file";
  if (mimetype.includes("document") || mimetype.includes("text")) return "file";
  return "file";
}

// 数据导入相关API
// 批量创建用户
app.post("/api/admin/users/batch", authenticateToken, async (req, res) => {
  try {
    const { users } = req.body;
    if (!Array.isArray(users)) {
      return res.status(400).json({ error: "Users must be an array" });
    }

    const createdUsers = [];
    for (const userData of users) {
      const { username, password, avatar } = userData;
      const existingUser = await User.findOne({ username });
      if (!existingUser) {
        const user = new User({
          username,
          password,
          avatar:
            avatar ||
            `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${username}`,
        });
        await user.save();
        createdUsers.push({
          id: user._id,
          username: user.username,
          avatar: user.avatar,
        });
      }
    }

    res.json({
      message: "Users created successfully",
      count: createdUsers.length,
      users: createdUsers,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create users" });
  }
});

// 批量创建消息
app.post("/api/admin/messages/batch", authenticateToken, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages must be an array" });
    }

    const createdMessages = [];
    for (const msgData of messages) {
      const message = new Message({
        sender: msgData.sender,
        receiver: msgData.receiver,
        group: msgData.group,
        content: msgData.content,
        type: msgData.type || "text",
        fileInfo: msgData.fileInfo,
        metadata: msgData.metadata,
        timestamp: msgData.timestamp ? new Date(msgData.timestamp) : new Date(),
      });
      await message.save();
      createdMessages.push(message);
    }

    res.json({
      message: "Messages created successfully",
      count: createdMessages.length,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create messages" });
  }
});

// 获取系统统计信息
app.get("/api/admin/stats", authenticateToken, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const messageCount = await Message.countDocuments();
    const groupCount = await Group.countDocuments();
    const friendRequestCount = await FriendRequest.countDocuments();

    // 按类型统计消息
    const messageStats = await Message.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    res.json({
      users: userCount,
      messages: messageCount,
      groups: groupCount,
      friendRequests: friendRequestCount,
      messageTypes: messageStats,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get stats" });
  }
});

// 清理数据
app.delete("/api/admin/clean", authenticateToken, async (req, res) => {
  try {
    await Message.deleteMany({});
    await Group.deleteMany({});
    await FriendRequest.deleteMany({});
    await User.deleteMany({});

    res.json({ message: "All data cleaned successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to clean data" });
  }
});

// Socket.IO connection handling
const userSockets = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle authentication
  socket.on("login", async (data) => {
    try {
      const { token } = data;
      if (!token) {
        socket.emit("login_error", { error: "Token required" });
        return;
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        socket.emit("login_error", { error: "User not found" });
        return;
      }

      // Store user info in socket
      socket.userId = user._id.toString();
      socket.username = user.username;

      // Update user online status
      user.online = true;
      user.lastSeen = new Date();
      await user.save();

      // Join user room
      userSockets.set(user._id.toString(), socket.id);
      socket.join(user._id.toString());

      socket.emit("login_success", {
        userId: user._id,
        username: user.username,
      });

      console.log(`User ${user.username} (${user._id}) logged in via socket`);
    } catch (error) {
      console.error("Socket login error:", error);
      socket.emit("login_error", { error: "Invalid token" });
    }
  });

  // Join group room
  socket.on("join_group", (groupId) => {
    if (socket.userId) {
      socket.join(groupId);
      console.log(`User ${socket.username} joined group ${groupId}`);
    }
  });

  // Leave group room
  socket.on("leave_group", (groupId) => {
    if (socket.userId) {
      socket.leave(groupId);
      console.log(`User ${socket.username} left group ${groupId}`);
    }
  });

  // Handle typing status
  socket.on("typing", (data) => {
    if (socket.userId) {
      const { chatId, isTyping } = data;
      socket.to(chatId).emit("typing", {
        userId: socket.userId,
        username: socket.username,
        chatId,
        isTyping,
      });
    }
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    if (socket.userId) {
      // Update user offline status
      try {
        await User.findByIdAndUpdate(socket.userId, {
          online: false,
          lastSeen: new Date(),
        });
      } catch (error) {
        console.error("Error updating user offline status:", error);
      }

      // Remove from userSockets map
      userSockets.delete(socket.userId);
      console.log(`User ${socket.username} went offline`);
    }
  });
});

// Health check endpoints
app.get("/", (req, res) => res.send("Backend is running"));
app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
);
app.get("/api/test", (req, res) => res.json({ status: "ok" }));

server.listen(PORT, "0.0.0.0", () =>
  console.log("✅ Server running on port " + PORT)
);
