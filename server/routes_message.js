const express = require('express');
const router = express.Router();
const pool = require('./db');
const auth = require('./auth');

// ============ 获取我的通知 ============
router.get('/list', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.*, u.nickname as from_nickname, u.avatar as from_avatar
      FROM notifications n
      LEFT JOIN users u ON n.from_user_id = u.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50`,
      [req.userId]
    );
    res.json({ code: 0, data: rows });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ============ 标记已读 ============
router.post('/read', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (ids && ids.length > 0) {
      await pool.query(
        `UPDATE notifications SET is_read = 1 WHERE id IN (${ids.map(() => '?').join(',')}) AND user_id = ?`,
        [...ids, req.userId]
      );
    }
    res.json({ code: 0, msg: 'ok' });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ============ 未读通知数 ============
router.get('/unread-count', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [req.userId]);
    res.json({ code: 0, data: { count: rows[0].count } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ============ 发消息（在邀约内） ============
router.post('/send', auth, async (req, res) => {
  try {
    const { invitation_id, to_user, content } = req.body;
    if (!invitation_id || !to_user || !content) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    await pool.query(
      'INSERT INTO messages (invitation_id, from_user, to_user, content) VALUES (?, ?, ?, ?)',
      [invitation_id, req.userId, to_user, content]
    );

    res.json({ code: 0, msg: '发送成功' });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ============ 获取聊天记录（两个人之间的） ============
router.get('/chat', auth, async (req, res) => {
  try {
    const { invitation_id, other_user } = req.query;
    if (!invitation_id || !other_user) return res.json({ code: 400, msg: '参数不完整' });

    const [rows] = await pool.query(
      `SELECT m.*, u.nickname, u.avatar
      FROM messages m
      LEFT JOIN users u ON m.from_user = u.id
      WHERE m.invitation_id = ? AND (
        (m.from_user = ? AND m.to_user = ?) OR
        (m.from_user = ? AND m.to_user = ?)
      )
      ORDER BY m.created_at ASC
      LIMIT 200`,
      [invitation_id, req.userId, other_user, other_user, req.userId]
    );

    // 标记已读
    await pool.query(
      'UPDATE messages SET is_read = 1 WHERE invitation_id = ? AND to_user = ? AND is_read = 0',
      [invitation_id, req.userId]
    );

    res.json({ code: 0, data: rows });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ============ 我的聊天列表（有消息的人） ============
router.get('/conversations', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.invitation_id, i.title, i.type,
        CASE WHEN m.from_user = ? THEN m.to_user ELSE m.from_user END as other_user,
        u.nickname, u.avatar, u.gender, u.age,
        m.content as last_message, m.created_at as last_time
      FROM messages m
      JOIN invitations i ON m.invitation_id = i.id
      JOIN users u ON u.id = CASE WHEN m.from_user = ? THEN m.to_user ELSE m.from_user END
      WHERE m.from_user = ? OR m.to_user = ?
      GROUP BY m.invitation_id, other_user
      ORDER BY m.created_at DESC`,
      [req.userId, req.userId, req.userId, req.userId]
    );

    res.json({ code: 0, data: rows });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

module.exports = router;
