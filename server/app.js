const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const multer = require('multer');
const fs = require('fs');

const app = express();

// 确保上传目录存在
if (!fs.existsSync(config.UPLOAD_DIR)) {
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
}

// Multer 配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, Date.now() + '_' + Math.random().toString(36).substring(2, 8) + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  },
});

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件 - 上传目录
app.use('/uploads', express.static(config.UPLOAD_DIR));

// 静态文件 - Web 端 H5 页面
app.use(express.static(path.join(__dirname, 'public')));

// 路由
app.use('/api/auth', require('./routes_auth'));
app.use('/api/invitation', require('./routes_invitation'));
app.use('/api/message', require('./routes_message'));

// 图片上传接口
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.json({ code: 400, msg: '请选择图片' });
  const url = '/uploads/' + req.file.filename;
  res.json({ code: 0, data: { url }, msg: '上传成功' });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 0, msg: '约吧服务运行中 ❤️', time: new Date().toISOString() });
});

// 启动
app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`✅ 约吧后端服务已启动: http://0.0.0.0:${config.PORT}`);
});
