// miniapp/miniprogram/pages/login/login.js
const auth = require('../../utils/auth');

Page({
  data: { loading: false },
  async handleLogin() {
    this.setData({ loading: true });
    try {
      await auth.login();
      wx.switchTab({ url: '/pages/invoices/list' });
    } catch (e) {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      console.error(e);
    } finally {
      this.setData({ loading: false });
    }
  }
});
