const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const config = require('./config');
const auth = require('./auth');

// ============ 微信登录 ============
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.json({ code: 400, msg: '缺少 code' });

    // 微信服务器登录
    const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: config.WX.APPID,
        secret: config.WX.APPSECRET,
        js_code: code,
        grant_type: 'authorization_code',
      },
    });

    const { openid, session_key, errcode, errmsg } = wxRes.data;
    if (errcode) {
      return res.json({ code: 500, msg: `微信登录失败: ${errmsg}` });
    }

    // 查找或创建用户
    const [rows] = await pool.query('SELECT id, nickname, avatar, gender, age, city, intro FROM users WHERE openid = ?', [openid]);
    let user;
    if (rows.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO users (openid, nickname, avatar) VALUES (?, ?, ?)',
        [openid, '微信用户', '']
      );
      user = { id: result.insertId, nickname: '微信用户', avatar: '', gender: 0, age: 0, city: '', intro: '' };
    } else {
      user = rows[0];
    }

    // 生成 JWT
    const token = jwt.sign(
      { userId: user.id, openid },
      config.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      code: 0,
      data: { token, user },
      msg: '登录成功',
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ============ 获取用户信息 ============
router.get('/profile', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, openid, nickname, avatar, gender, age, city, intro, interests, created_at FROM users WHERE id = ?',
      [req.userId]
    );
    if (rows.length === 0) return res.json({ code: 404, msg: '用户不存在' });

    const user = rows[0];
    user.interests = user.interests ? user.interests.split(',') : [];
    res.json({ code: 0, data: user });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ============ 更新用户信息 ============
router.post('/profile/update', auth, async (req, res) => {
  try {
    const { nickname, avatar, gender, age, city, intro, interests } = req.body;
    const interestsStr = Array.isArray(interests) ? interests.join(',') : interests;
    await pool.query(
      'UPDATE users SET nickname=?, avatar=?, gender=?, age=?, city=?, intro=?, interests=? WHERE id=?',
      [nickname || '', avatar || '', gender || 0, age || 0, city || '', intro || '', interestsStr || '', req.userId]
    );
    res.json({ code: 0, msg: '更新成功' });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ============ 获取其他用户资料（用于邀约详情） ============
router.get('/user/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nickname, avatar, gender, age, city, intro, interests FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.json({ code: 404, msg: '用户不存在' });

    const user = rows[0];
    user.interests = user.interests ? user.interests.split(',') : [];
    res.json({ code: 0, data: user });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ============ Web 端简易登录（不需要微信授权） ============
router.post('/web-login', async (req, res) => {
  try {
    const { nickname, avatar } = req.body;
    if (!nickname || !nickname.trim()) {
      return res.json({ code: 400, msg: '请填写昵称' });
    }

    // 用 nickname 查找或创建用户（Web 端简化版）
    const [rows] = await pool.query(
      'SELECT id, nickname, avatar, gender, age, city, intro, interests FROM users WHERE nickname = ? ORDER BY id DESC LIMIT 1',
      [nickname.trim()]
    );
    
    let user;
    if (rows.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO users (openid, nickname, avatar) VALUES (?, ?, ?)',
        ['web_' + Date.now() + '_' + Math.random().toString(36).slice(2), nickname.trim(), avatar || '']
      );
      user = { id: result.insertId, nickname: nickname.trim(), avatar: avatar || '', gender: 0, age: 0, city: '', intro: '', interests: '' };
    } else {
      user = rows[0];
    }

    const token = jwt.sign(
      { userId: user.id, openid: user.openid || 'web' },
      config.JWT_SECRET,
      { expiresIn: '30d' }
    );

    if (typeof user.interests === 'string') {
      user.interests = user.interests ? user.interests.split(',') : [];
    }

    res.json({ code: 0, data: { token, user }, msg: '登录成功' });
  } catch (err) {
    console.error('Web登录失败:', err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ============ 获取用户公开主页（含其邀约） ============
router.get('/user/:id/profile', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // 用户信息
    const [users] = await pool.query(
      'SELECT id, nickname, avatar, gender, age, city, intro, interests, created_at FROM users WHERE id = ?',
      [userId]
    );
    if (users.length === 0) return res.json({ code: 404, msg: '用户不存在' });

    const user = users[0];
    user.interests = user.interests ? user.interests.split(',') : [];

    // 该用户发布的邀约
    const [invitations] = await pool.query(
      `SELECT i.*,
        (SELECT COUNT(*) FROM participants p WHERE p.invitation_id = i.id AND p.status = 1) as participant_count
      FROM invitations i
      WHERE i.user_id = ? AND i.status = 1
      ORDER BY i.created_at DESC
      LIMIT 20`,
      [userId]
    );

    const TYPE_MAP = { 1: '喝咖啡', 2: '看电影', 3: '去旅行', 4: '其他' };
    const list = invitations.map(r => ({
      ...r,
      type_name: TYPE_MAP[r.type] || '其他',
      images: r.images ? JSON.parse(r.images) : [],
      event_time: r.event_time ? r.event_time.toISOString().replace('T', ' ').substring(0, 16) : '',
      created_at: r.created_at ? r.created_at.toISOString().replace('T', ' ').substring(0, 16) : '',
    }));

    res.json({ code: 0, data: { user, invitations: list } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

module.exports = router;
