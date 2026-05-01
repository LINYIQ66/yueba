const api = require('../../utils/api');

Page({
  data: {
    avatar: '',
    nickname: '',
    gender: 0,
    age: '',
    city: '',
    intro: '',
    interests: [],
    interestList: ['运动', '读书', '电影', '美食', '旅行', '摄影', '音乐', '游戏', '绘画', '舞蹈', '健身', '瑜伽', '户外', '骑行', '桌游', '咖啡', '茶道', '手工', '编程', '宠物'],
    saving: false,
  },

  onShow() {
    const app = getApp();
    const user = app.globalData.userInfo || {};
    this.setData({
      avatar: user.avatar || '',
      nickname: user.nickname || '',
      gender: user.gender || 0,
      age: user.age ? String(user.age) : '',
      city: user.city || '',
      intro: user.intro || '',
      interests: user.interests || [],
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  selectGender(e) {
    this.setData({ gender: parseInt(e.currentTarget.dataset.value) });
  },

  toggleInterest(e) {
    const value = e.currentTarget.dataset.value;
    let interests = [...this.data.interests];
    const idx = interests.indexOf(value);
    if (idx > -1) {
      interests.splice(idx, 1);
    } else {
      if (interests.length >= 10) {
        wx.showToast({ title: '最多选10个标签', icon: 'none' });
        return;
      }
      interests.push(value);
    }
    this.setData({ interests });
  },

  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFile = res.tempFilePaths[0];
        this.setData({ avatar: tempFile });
      },
    });
  },

  async save() {
    if (!this.data.nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    this.setData({ saving: true });

    try {
      await api.updateProfile({
        nickname: this.data.nickname.trim(),
        avatar: this.data.avatar,
        gender: this.data.gender,
        age: parseInt(this.data.age) || 0,
        city: this.data.city,
        intro: this.data.intro,
        interests: this.data.interests,
      });

      // 更新全局信息
      const app = getApp();
      const oldUser = app.globalData.userInfo || {};
      app.setUserInfo({
        ...oldUser,
        nickname: this.data.nickname.trim(),
        avatar: this.data.avatar,
        gender: this.data.gender,
        age: parseInt(this.data.age) || 0,
        city: this.data.city,
        intro: this.data.intro,
        interests: this.data.interests,
      });

      wx.showToast({ title: '保存成功 ✅', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      this.setData({ saving: false });
    }
  },
});
