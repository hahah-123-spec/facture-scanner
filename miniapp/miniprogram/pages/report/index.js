// miniapp/miniprogram/pages/report/index.js
const { invoices } = require('../../utils/supabase');
const { CATEGORIES, getLabel } = require('../../utils/categories');

Page({
  data: {
    currentMonth: '', summary: null, categoryData: []
  },
  onShow() {
    const now = new Date();
    this.setData({ currentMonth: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}` });
    this.loadSummary();
  },
  async loadSummary() {
    try {
      const all = await invoices.list({ month: this.data.currentMonth });
      const summary = {
        total: all.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0),
        iva: all.reduce((s, i) => s + parseFloat(i.iva_amount || 0), 0),
        base: all.reduce((s, i) => s + parseFloat(i.base_amount || 0), 0),
        count: all.length
      };
      // 按分类汇总
      const catMap = {};
      all.forEach(i => {
        catMap[i.category] = (catMap[i.category] || 0) + parseFloat(i.total_amount || 0);
      });
      const categoryData = CATEGORIES
        .filter(c => catMap[c.value])
        .map(c => ({
          label: c.label,
          amount: catMap[c.value],
          pct: summary.total ? Math.round(catMap[c.value] / summary.total * 100) : 0
        }));
      this.setData({ summary, categoryData });
    } catch (e) { wx.showToast({ title: '加载失败', icon: 'none' }); }
  },
  async onExport() {
    wx.showLoading({ title: '生成中...' });
    try {
      const all = await invoices.list({ month: this.data.currentMonth });
      // 生成 CSV（Excel 可直接打开）
      let csv = 'Fecha,Proveedor,Nº Factura,Base,IVA%,IVA,Total,Categoría\n';
      all.forEach(i => {
        csv += `${i.invoice_date},${i.supplier_name},${i.invoice_number || ''},${i.base_amount},${i.iva_rate},${i.iva_amount},${i.total_amount},${getLabel(i.category)}\n`;
      });
      // 写入临时文件并分享
      const fs = wx.getFileSystemManager();
      const filePath = `${wx.env.USER_DATA_PATH}/invoices_${this.data.currentMonth}.csv`;
      fs.writeFileSync(filePath, csv, 'utf8');
      wx.shareFileMessage({
        filePath, fileName: `invoices_${this.data.currentMonth}.csv`,
        success() { wx.hideLoading(); wx.showToast({ title: '已分享', icon: 'success' }); },
        fail() { wx.hideLoading(); wx.showToast({ title: '导出失败', icon: 'none' }); }
      });
    } catch (e) { wx.hideLoading(); wx.showToast({ title: '导出失败', icon: 'none' }); }
  }
});
