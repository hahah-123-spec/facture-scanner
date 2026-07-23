// miniapp/miniprogram/utils/supabase.js
const app = getApp();

function getHeaders() {
  const token = wx.getStorageSync('supabase_token');
  return {
    'Content-Type': 'application/json',
    'apikey': app.globalData.anonKey,
    'Authorization': token ? `Bearer ${token}` : `Bearer ${app.globalData.anonKey}`
  };
}

function api(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.supabaseUrl}/rest/v1/${path}`,
      method: options.method || 'GET',
      header: getHeaders(),
      data: options.body,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject({ status: res.statusCode, message: res.data });
        }
      },
      fail: reject
    });
  });
}

// 发票 CRUD
const invoices = {
  list(params = {}) {
    const qs = [];
    if (params.month) {
      // 使用下个月第一天作为上界，避免 31 日硬编码导致的二月/小月问题
      const [y, m] = params.month.split('-').map(Number);
      const next = new Date(y, m, 1);
      qs.push(`invoice_date=gte.${params.month}-01`);
      qs.push(`invoice_date=lt.${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`);
    }
    if (params.search) qs.push(`supplier_name=ilike.*${params.search}*`);
    qs.push('order=invoice_date.desc');
    qs.push('limit=100');
    return api(`invoices?${qs.join('&')}`);
  },

  getById(id) {
    return api(`invoices?id=eq.${id}&limit=1`).then(r => r[0] || null);
  },

  create(data) {
    return api('invoices', { method: 'POST', body: [data] });
  },

  update(id, data) {
    return api(`invoices?id=eq.${id}`, { method: 'PATCH', body: data });
  },

  delete(id) {
    return api(`invoices?id=eq.${id}`, { method: 'DELETE' });
  },

  checkDuplicate(supplier_name, invoice_date, total_amount) {
    return api(
      `invoices?supplier_name=eq.${encodeURIComponent(supplier_name)}&invoice_date=eq.${invoice_date}&total_amount=eq.${total_amount}&limit=1`
    ).then(r => r.length > 0 ? r[0] : null);
  },

  monthlySummary(month) {
    return api(`rpc/monthly_summary?p_month=${month}`);
  }
};

module.exports = { invoices };
