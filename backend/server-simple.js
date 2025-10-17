const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 内存存储（用于测试）
const users = new Map();
const messages = [];
const friendRequests = [];

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

    if (users.has(username)) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const userId = `user_${Date.now()}`;
    users.set(username, {
      id: userId,
      username,
      password,
      avatar: `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${username}`,
      friends: [],
      online: false,
      lastSeen: new Date(),
    });

    const token = jwt.sign({ id: userId, username }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: userId,
        username,
        avatar: `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${username}`,
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

    const user = users.get(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    user.online = true;
    user.lastSeen = new Date();

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        online: user.online,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed", details: error.message });
  }
});

// Get user profile
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = users.get(req.user.username);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      online: user.online,
      lastSeen: user.lastSeen,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Search users
app.get("/api/users/search", authenticateToken, async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: "Username parameter required" });
    }

    const searchResults = Array.from(users.values())
      .filter(
        (user) =>
          user.username.toLowerCase().includes(username.toLowerCase()) &&
          user.id !== req.user.id
      )
      .map((user) => ({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        online: user.online,
        lastSeen: user.lastSeen,
      }))
      .slice(0, 10);

    res.json(searchResults);
  } catch (error) {
    res.status(500).json({ error: "Failed to search users" });
  }
});

// Get friends
app.get("/api/friends", authenticateToken, async (req, res) => {
  try {
    const user = users.get(req.user.username);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const friends = user.friends
      .map((friendId) => {
        const friend = Array.from(users.values()).find(
          (u) => u.id === friendId
        );
        return friend
          ? {
              id: friend.id,
              username: friend.username,
              avatar: friend.avatar,
              online: friend.online,
              lastSeen: friend.lastSeen,
            }
          : null;
      })
      .filter(Boolean);

    res.json(friends);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch friends" });
  }
});

// Send friend request
app.post("/api/friend-requests", authenticateToken, async (req, res) => {
  try {
    const { receiverId } = req.body;
    const user = users.get(req.user.username);
    const friend = Array.from(users.values()).find((u) => u.id === receiverId);

    if (!friend) {
      return res.status(404).json({ error: "User not found" });
    }

    // 检查是否已经是好友
    if (user.friends.includes(receiverId)) {
      return res.status(400).json({ error: "Already friends" });
    }

    // 检查是否已经发送过申请
    const existingRequest = friendRequests.find(
      (fr) =>
        fr.sender === user.id &&
        fr.receiver === receiverId &&
        fr.status === "pending"
    );

    if (existingRequest) {
      return res.status(400).json({ error: "Friend request already sent" });
    }

    // 创建好友申请
    const friendRequest = {
      id: `req_${Date.now()}`,
      sender: user.id,
      receiver: receiverId,
      status: "pending",
      createdAt: new Date(),
    };

    friendRequests.push(friendRequest);

    res.json({
      message: "Friend request sent successfully",
      requestId: friendRequest.id,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to send friend request" });
  }
});

// Get friend requests
app.get("/api/friend-requests", authenticateToken, async (req, res) => {
  try {
    const userRequests = friendRequests.filter(
      (fr) => fr.receiver === req.user.id && fr.status === "pending"
    );

    res.json(userRequests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch friend requests" });
  }
});

// Handle friend request
app.put(
  "/api/friend-requests/:requestId",
  authenticateToken,
  async (req, res) => {
    try {
      const { requestId } = req.params;

      const request = friendRequests.find((fr) => fr.id === requestId);
      if (!request) {
        return res.status(404).json({ error: "Friend request not found" });
      }

      if (request.receiver !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Not authorized to handle this request" });
      }

      request.status = "accepted";

      const user = users.get(req.user.username);
      const friend = Array.from(users.values()).find(
        (u) => u.id === request.sender
      );

      if (user && friend) {
        if (!user.friends.includes(request.sender)) {
          user.friends.push(request.sender);
        }
        if (!friend.friends.includes(user.id)) {
          friend.friends.push(user.id);
        }
      }

      res.json({ message: "Friend request accepted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to handle friend request" });
    }
  }
);

// Send private message
app.post("/api/private-messages", authenticateToken, async (req, res) => {
  try {
    const { receiverId, content, messageType = "text" } = req.body;
    const sender = req.user.id;

    const message = {
      id: `msg_${Date.now()}`,
      sender,
      receiver: receiverId,
      content,
      type: messageType,
      timestamp: new Date(),
    };

    messages.push(message);

    // Emit to Socket.IO
    io.to(receiverId).emit("private_message", message);

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get private messages
app.get(
  "/api/private-messages/:userId",
  authenticateToken,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 50 } = req.query;
      const currentUserId = req.user.id;

      const userMessages = messages
        .filter(
          (msg) =>
            (msg.sender === currentUserId && msg.receiver === userId) ||
            (msg.sender === userId && msg.receiver === currentUserId)
        )
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .slice(-parseInt(limit));

      res.json(userMessages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  }
);

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
      const user = users.get(decoded.username);

      if (!user) {
        socket.emit("login_error", { error: "User not found" });
        return;
      }

      // Store user info in socket
      socket.userId = user.id;
      socket.username = user.username;

      // Update user online status
      user.online = true;
      user.lastSeen = new Date();

      // Join user room
      userSockets.set(user.id, socket.id);
      socket.join(user.id);

      socket.emit("login_success", {
        userId: user.id,
        username: user.username,
      });

      console.log(`User ${user.username} (${user.id}) logged in via socket`);
    } catch (error) {
      console.error("Socket login error:", error);
      socket.emit("login_error", { error: "Invalid token" });
    }
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    if (socket.userId) {
      // Update user offline status
      const user = Array.from(users.values()).find(
        (u) => u.id === socket.userId
      );
      if (user) {
        user.online = false;
        user.lastSeen = new Date();
      }

      // Remove from userSockets map
      userSockets.delete(socket.userId);
      console.log(`User ${socket.username} went offline`);
    }
  });
});

server.listen(PORT, "0.0.0.0", () =>
  console.log("✅ Server running on port " + PORT)
);
