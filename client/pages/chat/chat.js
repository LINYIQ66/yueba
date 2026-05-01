const api = require('../../utils/api');

Page({
  data: {
    conversations: [],
    loading: true,
  },

  onShow() {
    this.loadConversations();
  },

  async loadConversations() {
    this.setData({ loading: true });
    try {
      const data = await api.getConversations();
      this.setData({ conversations: data, loading: false });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  openChat(e) {
    const { invitation, other, title } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/chat/chat?invitation_id=${invitation}&other_user=${other}&title=${encodeURIComponent(title)}`,
    });
  },
});
