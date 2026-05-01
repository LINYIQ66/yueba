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

module.exports = router;
