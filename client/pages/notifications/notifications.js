const api = require('../../utils/api');

Page({
  data: {
    notifications: [],
    loading: false,
  },

  onShow() {
    this.loadNotifications();
  },

  onPullDownRefresh() {
    this.loadNotifications();
  },

  async loadNotifications() {
    this.setData({ loading: true });

    try {
      const data = await api.getNotifications();
      const list = data.list || data || [];
      this.setData({
        notifications: list,
        loading: false,
      });
    } catch (err) {
      this.setData({ loading: false });
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  async onItemTap(e) {
    const dataset = e.currentTarget.dataset;
    const id = dataset.id;
    const invitationId = dataset.invitationId;

    // 标记为已读
    try {
      await api.markRead([id]);
      // 更新本地状态
      const notifications = this.data.notifications.map((n) => {
        if (n.id === id) {
          return { ...n, is_read: true };
        }
        return n;
      });
      this.setData({ notifications });
    } catch (err) {
      // 即使标记失败也继续跳转
    }

    // 跳转到邀约详情
    if (invitationId) {
      wx.navigateTo({
        url: '/pages/detail/detail?id=' + invitationId,
      });
    }
  },
});
