const api = require('../../utils/api');

Page({
  data: {
    invitationId: 0,
    detail: null,
    loading: true,
    joining: false,
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ invitationId: parseInt(options.id) });
      this.loadDetail();
    }
  },

  async loadDetail() {
    this.setData({ loading: true });
    try {
      const data = await api.getInvitationDetail(this.data.invitationId);
      this.setData({ detail: data, loading: false });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  async join() {
    this.setData({ joining: true });
    try {
      const result = await api.joinInvitation(this.data.invitationId);
      wx.showToast({ title: result.msg || '报名成功 🎉', icon: 'success' });
      this.loadDetail();
    } catch (err) {
      this.setData({ joining: false });
    }
  },

  async cancelJoin() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消报名吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.cancelJoin(this.data.invitationId);
            wx.showToast({ title: '已取消', icon: 'success' });
            this.loadDetail();
          } catch (err) {}
        }
      },
    });
  },

  async closeInvitation() {
    wx.showModal({
      title: '结束招募',
      content: '结束招募后其他人不能再报名，确定吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.closeInvitation(this.data.invitationId);
            wx.showToast({ title: '已结束', icon: 'success' });
            this.loadDetail();
          } catch (err) {}
        }
      },
    });
  },

  goUserProfile(e) {
    const userId = e.currentTarget.dataset.id;
    if (!userId) return;
    // WeChat mini program doesn't have user profile page yet
    // Just navigate to the detail
    wx.showToast({ title: '点击个人资料可编辑', icon: 'none' });
  },
});
