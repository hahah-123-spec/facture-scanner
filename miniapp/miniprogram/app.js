const { getToken } = require('./utils/auth');

App({
  globalData: {
    supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
    anonKey: 'YOUR_ANON_KEY',
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
