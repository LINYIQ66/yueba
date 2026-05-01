const api = require('../../utils/api');

Page({
  data: {
    userId: null,
    user: {},
    invitations: [],
    loading: true,
  },

  onLoad(options) {
    const userId = options.id;
    if (!userId) {
      wx.showToast({ title: '用户ID缺失', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.setData({ userId }, () => {
      this.loadProfile();
    });
  },

  async loadProfile() {
    try {
      const data = await api.getUserProfile(this.data.userId);
      this.setData({
        user: data.user || {},
        invitations: data.invitations || [],
        loading: false,
      });
      wx.setNavigationBarTitle({ title: data.user.nickname || '个人主页' });
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },
});
