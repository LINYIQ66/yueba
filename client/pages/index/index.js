const api = require('../../utils/api');

Page({
  data: {
    greeting: '嗨，今天想做什么？',
    avatar: '',
    currentType: 0,
    typeList: [
      { name: '全部', value: 0 },
      { name: '☕ 喝咖啡', value: 1 },
      { name: '🎬 看电影', value: 2 },
      { name: '✈️ 旅行', value: 3 },
      { name: '🎯 其他', value: 4 },
    ],
    invitations: [],
    page: 1,
    hasMore: true,
    loading: false,
    firstLoad: true,
  },

  onLoad() {
    this.checkLogin();
  },

  onShow() {
    this.loadInvitations(true);
  },

  onPullDownRefresh() {
    this.loadInvitations(true);
  },

  async checkLogin() {
    const app = getApp();
    if (!app.globalData.token) {
      wx.showLoading({ title: '登录中...' });
      try {
        await api.wxLogin();
        this.updateUserInfo();
      } catch (err) {
        console.error('登录失败', err);
      }
      wx.hideLoading();
    } else {
      this.updateUserInfo();
    }
  },

  updateUserInfo() {
    const app = getApp();
    const user = app.globalData.userInfo;
    if (user) {
      this.setData({
        avatar: user.avatar || '',
        greeting: this.getGreeting(),
      });
    }
  },

  getGreeting() {
    const h = new Date().getHours();
    if (h < 6) return '🌙 夜深了还在刷？';
    if (h < 9) return '🌅 早安，美好的一天开始啦';
    if (h < 12) return '☀️ 上午好，约杯咖啡吧';
    if (h < 14) return '🌤 中午好，吃饭了吗？';
    if (h < 18) return '🌤 下午好，出去走走？';
    if (h < 21) return '🌆 傍晚好，看个电影？';
    return '🌙 晚上好，聊聊天吧';
  },

  async loadInvitations(reset) {
    if (this.data.loading) return;
    if (!reset && !this.data.hasMore) return;

    this.setData({ loading: true });
    if (reset) {
      this.setData({ page: 1, invitations: [] });
    }

    try {
      const data = await api.getInvitationList(this.data.currentType, this.data.page);
      this.setData({
        invitations: reset ? data.list : [...this.data.invitations, ...data.list],
        page: this.data.page + 1,
        hasMore: data.hasMore,
        loading: false,
        firstLoad: false,
      });
    } catch (err) {
      this.setData({ loading: false });
    }

    wx.stopPullDownRefresh();
  },

  switchType(e) {
    const type = e.currentTarget.dataset.value;
    if (type === this.data.currentType) return;
    this.setData({ currentType: type }, () => {
      this.loadInvitations(true);
    });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },

  onReachBottom() {
    this.loadInvitations();
  },
});
