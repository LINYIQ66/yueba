const api = require('../../utils/api');

Page({
  data: {
    user: {},
    activeTab: 'mine',
    invitations: [],
    page: 1,
    hasMore: true,
    loading: false,
  },

  onShow() {
    const app = getApp();
    this.setData({ user: app.globalData.userInfo || {} });
    this.loadList(true);
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;
    this.setData({ activeTab: tab }, () => {
      this.loadList(true);
    });
  },

  async loadList(reset) {
    if (this.data.loading) return;
    if (!reset && !this.data.hasMore) return;

    this.setData({ loading: true });
    if (reset) {
      this.setData({ page: 1, invitations: [] });
    }

    try {
      const fn = this.data.activeTab === 'mine' ? api.getMyInvitations : api.getJoinedInvitations;
      const data = await fn(this.data.page);
      this.setData({
        invitations: reset ? data.list : [...this.data.invitations, ...data.list],
        page: this.data.page + 1,
        hasMore: data.hasMore,
        loading: false,
      });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },

  goNotifications() {
    wx.navigateTo({ url: '/pages/notifications/notifications' });
  },

  onReachBottom() {
    this.loadList();
  },
});
