const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件 - 上传目录
app.use('/uploads', express.static(config.UPLOAD_DIR));

// 路由
app.use('/api/auth', require('./routes_auth'));
app.use('/api/invitation', require('./routes_invitation'));
app.use('/api/message', require('./routes_message'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 0, msg: '约吧服务运行中 ❤️', time: new Date().toISOString() });
});

// 启动
app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`✅ 约吧后端服务已启动: http://0.0.0.0:${config.PORT}`);
});
