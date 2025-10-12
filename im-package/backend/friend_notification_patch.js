// 加好友通知功能补丁
app.post('/api/friends/add', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.body;
    const user = await User.findById(req.user.id);
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({ error: 'User not found' });
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
      io.to(friendSocketId).emit('friend_request', {
        type: 'friend_added',
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
      io.to(userSocketId).emit('friend_request', {
        type: 'friend_added_success',
        to: {
          id: friend._id,
          username: friend.username,
          avatar: friend.avatar
        },
        message: `已成功添加 ${friend.username} 为好友`,
        timestamp: new Date()
      });
    }

    res.json({ message: 'Friend added successfully', friend });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add friend' });
  }
});
