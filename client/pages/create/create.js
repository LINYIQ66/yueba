const api = require('../../utils/api');

Page({
  data: {
    typeList: [
      { name: '☕ 喝咖啡', value: 1, icon: '☕' },
      { name: '🎬 看电影', value: 2, icon: '🎬' },
      { name: '✈️ 旅行', value: 3, icon: '✈️' },
      { name: '🎯 其他', value: 4, icon: '🎯' },
    ],
    countList: [2, 5, 10, 20, 50],
    formData: {
      type: 0,
      title: '',
      description: '',
      location: '',
      date: '',
      time: '',
      max: 10,
    },
    submitting: false,
  },

  selectType(e) {
    this.setData({
      'formData.type': parseInt(e.currentTarget.dataset.value),
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      ['formData.' + field]: e.detail.value,
    });
  },

  onDateChange(e) {
    this.setData({
      'formData.date': e.detail.value,
    });
  },

  onTimeChange(e) {
    this.setData({
      'formData.time': e.detail.value,
    });
  },

  selectCount(e) {
    this.setData({
      'formData.max': parseInt(e.currentTarget.dataset.value),
    });
  },

  async submit() {
    const fd = this.data.formData;
    if (!fd.type) {
      wx.showToast({ title: '请选择邀约类型', icon: 'none' });
      return;
    }
    if (!fd.title.trim()) {
      wx.showToast({ title: '请填写标题', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    try {
      const eventTime = fd.date ? fd.date + ' ' + (fd.time || '00:00') + ':00' : null;
      await api.createInvitation({
        type: fd.type,
        title: fd.title.trim(),
        description: fd.description.trim(),
        location: fd.location.trim(),
        event_time: eventTime,
        max_participants: fd.max,
      });

      wx.showToast({ title: '发布成功 🎉', icon: 'success' });
      
      // 重置表单并返回首页
      this.setData({
        formData: { type: 0, title: '', description: '', location: '', date: '', time: '', max: 10 },
        submitting: false,
      });

      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1500);
    } catch (err) {
      this.setData({ submitting: false });
    }
  },
});
