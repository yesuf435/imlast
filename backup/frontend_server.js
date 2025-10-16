const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// 静态文件服务
app.use(express.static(path.join(__dirname, 'frontend_dist')));

// 所有请求返回前端页面
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend_dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`前端服务器运行在端口 ${PORT}`);
    console.log(`访问地址: http://47.121.27.165:${PORT}`);
});
