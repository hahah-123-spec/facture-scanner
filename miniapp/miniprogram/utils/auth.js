// miniapp/miniprogram/utils/auth.js
const app = getApp();

function getToken() {
  return wx.getStorageSync('supabase_token');
}

function getUserId() {
  return wx.getStorageSync('supabase_user_id');
}

async function login() {
  return new Promise((resolve, reject) => {
    wx.login({
      async success(res) {
        try {
          const wxCode = res.code;
          // 调用 Supabase Edge Function 换取 JWT
          const result = await new Promise((rs, rj) => {
            wx.request({
              url: `${app.globalData.supabaseUrl}/functions/v1/wechat-login`,
              method: 'POST',
              header: { 'Content-Type': 'application/json', 'apikey': app.globalData.anonKey },
              data: { code: wxCode },
              success(r) { rs(r.data); },
              fail: rj
            });
          });
          wx.setStorageSync('supabase_token', result.access_token);
          wx.setStorageSync('supabase_user_id', result.user_id);
          resolve(result);
        } catch (e) { reject(e); }
      },
      fail: reject
    });
  });
}

function logout() {
  wx.removeStorageSync('supabase_token');
  wx.removeStorageSync('supabase_user_id');
}

module.exports = { getToken, getUserId, login, logout };
