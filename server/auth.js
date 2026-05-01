const jwt = require('jsonwebtoken');
const config = require('./config');

// 验证 JWT token 中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.json({ code: 401, msg: '未登录' });
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.userId = decoded.userId;
    req.openid = decoded.openid;
    next();
  } catch (err) {
    return res.json({ code: 401, msg: '登录已过期，请重新登录' });
  }
}

module.exports = authMiddleware;
