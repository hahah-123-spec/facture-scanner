const { getToken } = require('./utils/auth');

App({
  globalData: {
    supabaseUrl: 'https://uujhooozssitwxqedifa.supabase.co',
    anonKey: 'sb_publishable_4hv0MhC53QLiedOJYwrJ8A_5wnedcPn',
    userInfo: null
  },

  onLaunch() {
    const token = getToken();
    if (!token) {
      wx.navigateTo({
        url: '/pages/login/login'
      });
    }
  }
});
