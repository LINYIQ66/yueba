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
    wx.navigateTo({ url: '/pages/user-profile/user-profile?id=' + userId });
  },

  // 预览图片
  previewImage(e) {
    const src = e.currentTarget.dataset.src;
    const urls = this.data.detail.images || [];
    wx.previewImage({ current: src, urls });
  },

  // 举报
  report() {
    const detail = this.data.detail;
    wx.showActionSheet({
      itemList: ['内容不合适', '虚假信息', '骚扰行为', '其他原因'],
      success: (res) => {
        const reasons = ['内容不合适', '虚假信息', '骚扰行为', '其他原因'];
        wx.showModal({
          title: '确认举报',
          content: '确定要举报这条邀约吗？',
          success: async (confirm) => {
            if (confirm.confirm) {
              try {
                await api.reportInvitation(detail.id, reasons[res.tapIndex]);
                wx.showToast({ title: '举报已提交', icon: 'success' });
              } catch (err) {}
            }
          },
        });
      },
    });
  },
});
