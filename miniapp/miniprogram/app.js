const { getToken } = require('./utils/auth');

App({
  globalData: {
    supabaseUrl: 'YOUR_SUPABASE_URL',
    supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
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
