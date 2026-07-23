// miniapp/miniprogram/utils/storage.js
const app = getApp();

function uploadImage(filePath, filename) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('supabase_token');
    wx.uploadFile({
      url: `${app.globalData.supabaseUrl}/storage/v1/object/invoices/${filename}`,
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${token}`,
        'apikey': app.globalData.anonKey
      },
      success(res) {
        resolve(JSON.parse(res.data));
      },
      fail: reject
    });
  });
}

function getPublicUrl(filename) {
  return `${app.globalData.supabaseUrl}/storage/v1/object/public/invoices/${filename}`;
}

module.exports = { uploadImage, getPublicUrl };
