// miniapp/miniprogram/pages/profile/index.js
const auth = require('../../utils/auth');

Page({
  data: { defaultIva: 21 },
  onShow() { this.setData({ defaultIva: wx.getStorageSync('default_iva') || 21 }); },
  onIvaChange(e) {
    const v = parseInt(e.detail.value) || 21;
    wx.setStorageSync('default_iva', v);
    this.setData({ defaultIva: v });
  },
  onLogout() {
    wx.showModal({
      title: '退出登录', content: '确定退出？',
      success: r => {
        if (r.confirm) { auth.logout(); wx.redirectTo({ url: '/pages/login/login' }); }
      }
    });
  }
});
