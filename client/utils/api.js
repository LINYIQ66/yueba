const app = getApp();

const request = (url, method = 'GET', data = {}) => {
  return new Promise((resolve, reject) => {
    const token = app.globalData.token;
    const header = { 'Content-Type': 'application/json' };
    if (token) header['Authorization'] = 'Bearer ' + token;

    wx.request({
      url: app.globalData.serverUrl + url,
      method,
      data,
      header,
      success(res) {
        if (res.data.code === 0) {
          resolve(res.data.data);
        } else if (res.data.code === 401) {
          // token 过期，重新登录
          wx.showToast({ title: '登录已过期', icon: 'none' });
          wx.removeStorageSync('token');
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/index/index' });
          }, 1500);
          reject(res.data);
        } else {
          wx.showToast({ title: res.data.msg || '请求失败', icon: 'none' });
          reject(res.data);
        }
      },
      fail(err) {
        wx.showToast({ title: '网络错误', icon: 'none' });
        reject(err);
      },
    });
  });
};

// ============ 登录 ============
function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (res.code) {
          request('/api/auth/login', 'POST', { code: res.code })
            .then(data => {
              app.setToken(data.token);
              app.setUserInfo(data.user);
              resolve(data);
            })
            .catch(reject);
        } else {
          reject(res);
        }
      },
      fail: reject,
    });
  });
}

// ============ 用户相关 ============
function getProfile() {
  return request('/api/auth/profile');
}

function updateProfile(data) {
  return request('/api/auth/profile/update', 'POST', data);
}

function getUserInfo(id) {
  return request('/api/auth/user/' + id);
}

// ============ 邀约相关 ============
function createInvitation(data) {
  return request('/api/invitation/create', 'POST', data);
}

function getInvitationList(type = 0, page = 1) {
  return request('/api/invitation/list?type=' + type + '&page=' + page);
}

function getMyInvitations(page = 1) {
  return request('/api/invitation/mine?page=' + page);
}

function getJoinedInvitations(page = 1) {
  return request('/api/invitation/joined?page=' + page);
}

function getInvitationDetail(id) {
  return request('/api/invitation/detail/' + id);
}

function joinInvitation(invitation_id) {
  return request('/api/invitation/join', 'POST', { invitation_id });
}

function cancelJoin(invitation_id) {
  return request('/api/invitation/cancel-join', 'POST', { invitation_id });
}

function closeInvitation(invitation_id) {
  return request('/api/invitation/close', 'POST', { invitation_id });
}

// ============ 消息 ============
function getNotifications() {
  return request('/api/message/list');
}

function getUnreadCount() {
  return request('/api/message/unread-count');
}

function markRead(ids) {
  return request('/api/message/read', 'POST', { ids });
}

function sendMessage(data) {
  return request('/api/message/send', 'POST', data);
}

function getChat(invitation_id, other_user) {
  return request('/api/message/chat?invitation_id=' + invitation_id + '&other_user=' + other_user);
}

function getConversations() {
  return request('/api/message/conversations');
}

module.exports = {
  wxLogin,
  getProfile,
  updateProfile,
  getUserInfo,
  createInvitation,
  getInvitationList,
  getMyInvitations,
  getJoinedInvitations,
  getInvitationDetail,
  joinInvitation,
  cancelJoin,
  closeInvitation,
  getNotifications,
  getUnreadCount,
  markRead,
  sendMessage,
  getChat,
  getConversations,
};
