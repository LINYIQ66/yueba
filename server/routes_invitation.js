const express = require('express');
const router = express.Router();
const pool = require('./db');
const auth = require('./auth');

// 邀约类型映射
const TYPE_MAP = { 1: '喝咖啡', 2: '看电影', 3: '去旅行', 4: '其他' };

// ============ 创建邀约 ============
router.post('/create', auth, async (req, res) => {
  try {
    const { type, title, description, location, event_time, max_participants } = req.body;
    if (!type || !title) return res.json({ code: 400, msg: '请填写邀约类型和标题' });

    const [result] = await pool.query(
      'INSERT INTO invitations (user_id, type, title, description, location, event_time, max_participants) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.userId, type, title, description || '', location || '', event_time || null, max_participants || 10]
    );

    res.json({ code: 0, data: { id: result.insertId }, msg: '发布成功！' });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ============ 邀约广场（分页） ============
router.get('/list', auth, async (req, res) => {
  try {
    const { type, page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let where = 'WHERE i.status = 1';
    const params = [];
    if (type && parseInt(type) > 0) {
      where += ' AND i.type = ?';
      params.push(parseInt(type));
    }

    // 排除自己发布的
    where += ' AND i.user_id != ?';
    params.push(req.userId);

    const [total] = await pool.query(
      `SELECT COUNT(*) as count FROM invitations i ${where}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT i.*, u.nickname, u.avatar, u.gender, u.age, u.city,
        (SELECT COUNT(*) FROM participants p WHERE p.invitation_id = i.id AND p.status = 1) as participant_count
      FROM invitations i
      LEFT JOIN users u ON i.user_id = u.id
      ${where}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    const list = rows.map(r => ({
      ...r,
      type_name: TYPE_MAP[r.type] || '其他',
      event_time: r.event_time ? r.event_time.toISOString().replace('T', ' ').substring(0, 16) : '',
      created_at: r.created_at ? r.created_at.toISOString().replace('T', ' ').substring(0, 16) : '',
    }));

    res.json({
      code: 0,
      data: {
        list,
        total: total[0].count,
        page: parseInt(page),
        hasMore: offset + list.length < total[0].count,
      },
    });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ============ 我发布的邀约 ============
router.get('/mine', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const [total] = await pool.query(
      'SELECT COUNT(*) as count FROM invitations WHERE user_id = ?',
      [req.userId]
    );

    const [rows] = await pool.query(
      `SELECT i.*,
        (SELECT COUNT(*) FROM participants p WHERE p.invitation_id = i.id AND p.status = 1) as participant_count
      FROM invitations i
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?`,
      [req.userId, parseInt(pageSize), offset]
    );

    const list = rows.map(r => ({
      ...r,
      type_name: TYPE_MAP[r.type] || '其他',
      event_time: r.event_time ? r.event_time.toISOString().replace('T', ' ').substring(0, 16) : '',
      created_at: r.created_at ? r.created_at.toISOString().replace('T', ' ').substring(0, 16) : '',
    }));

    res.json({ code: 0, data: { list, total: total[0].count, page: parseInt(page), hasMore: offset + list.length < total[0].count } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ============ 我报名的邀约 ============
router.get('/joined', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const [total] = await pool.query(
      `SELECT COUNT(*) as count FROM participants p
       JOIN invitations i ON p.invitation_id = i.id
       WHERE p.user_id = ? AND p.status = 1`,
      [req.userId]
    );

    const [rows] = await pool.query(
      `SELECT i.*, p.created_at as joined_at,
        u.nickname, u.avatar, u.gender, u.age,
        (SELECT COUNT(*) FROM participants p2 WHERE p2.invitation_id = i.id AND p2.status = 1) as participant_count
      FROM participants p
      JOIN invitations i ON p.invitation_id = i.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE p.user_id = ? AND p.status = 1
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [req.userId, parseInt(pageSize), offset]
    );

    const list = rows.map(r => ({
      ...r,
      type_name: TYPE_MAP[r.type] || '其他',
      event_time: r.event_time ? r.event_time.toISOString().replace('T', ' ').substring(0, 16) : '',
      created_at: r.created_at ? r.created_at.toISOString().replace('T', ' ').substring(0, 16) : '',
    }));

    res.json({ code: 0, data: { list, total: total[0].count, page: parseInt(page), hasMore: offset + list.length < total[0].count } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ============ 邀约详情 ============
router.get('/detail/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.*, u.nickname, u.avatar, u.gender, u.age, u.city, u.intro,
        (SELECT COUNT(*) FROM participants p WHERE p.invitation_id = i.id AND p.status = 1) as participant_count
      FROM invitations i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) return res.json({ code: 404, msg: '邀约不存在' });

    const inv = rows[0];

    // 我是否报名了
    const [myJoin] = await pool.query(
      'SELECT id FROM participants WHERE invitation_id = ? AND user_id = ? AND status = 1',
      [req.params.id, req.userId]
    );

    // 报名人列表
    const [participants] = await pool.query(
      `SELECT u.id, u.nickname, u.avatar, u.gender, u.age, u.city
      FROM participants p JOIN users u ON p.user_id = u.id
      WHERE p.invitation_id = ? AND p.status = 1`,
      [req.params.id]
    );

    res.json({
      code: 0,
      data: {
        ...inv,
        type_name: TYPE_MAP[inv.type] || '其他',
        event_time: inv.event_time ? inv.event_time.toISOString().replace('T', ' ').substring(0, 16) : '',
        created_at: inv.created_at ? inv.created_at.toISOString().replace('T', ' ').substring(0, 16) : '',
        is_joined: myJoin.length > 0,
        is_owner: inv.user_id === req.userId,
        participants,
      },
    });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ============ 报名参加 ============
router.post('/join', auth, async (req, res) => {
  try {
    const { invitation_id } = req.body;
    if (!invitation_id) return res.json({ code: 400, msg: '参数错误' });

    // 检查邀约是否存在且可报名
    const [inv] = await pool.query('SELECT * FROM invitations WHERE id = ?', [invitation_id]);
    if (inv.length === 0) return res.json({ code: 404, msg: '邀约不存在' });
    if (inv[0].status !== 1) return res.json({ code: 400, msg: '该邀约已截止' });
    if (inv[0].user_id === req.userId) return res.json({ code: 400, msg: '不能报名自己的邀约' });

    // 检查人数限制
    const [count] = await pool.query(
      'SELECT COUNT(*) as cnt FROM participants WHERE invitation_id = ? AND status = 1',
      [invitation_id]
    );
    if (count[0].cnt >= inv[0].max_participants) {
      return res.json({ code: 400, msg: '报名已满' });
    }

    // 检查是否已报名
    const [existing] = await pool.query(
      'SELECT id FROM participants WHERE invitation_id = ? AND user_id = ?',
      [invitation_id, req.userId]
    );
    if (existing.length > 0) {
      // 如果之前取消过，重新激活
      await pool.query(
        'UPDATE participants SET status = 1 WHERE invitation_id = ? AND user_id = ?',
        [invitation_id, req.userId]
      );
    } else {
      await pool.query(
        'INSERT INTO participants (invitation_id, user_id) VALUES (?, ?)',
        [invitation_id, req.userId]
      );
    }

    // 发通知给邀约发布者
    await pool.query(
      'INSERT INTO notifications (user_id, type, content, from_user_id, invitation_id) VALUES (?, ?, ?, ?, ?)',
      [inv[0].user_id, 'join', '有人报名了你的邀约', req.userId, invitation_id]
    );

    res.json({ code: 0, msg: '报名成功！快去准备出发吧 🎉' });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ============ 取消报名 ============
router.post('/cancel-join', auth, async (req, res) => {
  try {
    const { invitation_id } = req.body;
    await pool.query(
      "UPDATE participants SET status = 2 WHERE invitation_id = ? AND user_id = ?",
      [invitation_id, req.userId]
    );
    res.json({ code: 0, msg: '已取消报名' });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ============ 结束邀约 ============
router.post('/close', auth, async (req, res) => {
  try {
    const { invitation_id } = req.body;
    const [inv] = await pool.query('SELECT user_id FROM invitations WHERE id = ?', [invitation_id]);
    if (inv.length === 0) return res.json({ code: 404, msg: '邀约不存在' });
    if (inv[0].user_id !== req.userId) return res.json({ code: 403, msg: '只有发布者可以操作' });

    await pool.query('UPDATE invitations SET status = 2 WHERE id = ?', [invitation_id]);
    res.json({ code: 0, msg: '已结束招募' });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

module.exports = router;
