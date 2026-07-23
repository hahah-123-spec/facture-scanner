// miniapp/miniprogram/pages/report/index.js
const { invoices } = require('../../utils/supabase');
const { CATEGORIES, getLabel } = require('../../utils/categories');

// 用于 CSV 转义：包含逗号/引号/换行的字段用双引号包裹
function escCsv(v) {
  const s = String(v ?? '');
  const needsQuoting = s.includes(',') || s.includes('"') || s.includes('\n') || /^[=+\-@]/.test(s);
  return needsQuoting ? `"${s.replace(/"/g, '""')}"` : s;
}

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
    wx.showLoading({ title: '加载中...' });
    try {
      const all = await invoices.list({ month: this.data.currentMonth });
      const total = all.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
      const iva = all.reduce((s, i) => s + parseFloat(i.iva_amount || 0), 0);
      const base = all.reduce((s, i) => s + parseFloat(i.base_amount || 0), 0);
      const summary = {
        total: +total.toFixed(2),
        iva: +iva.toFixed(2),
        base: +base.toFixed(2),
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
    finally { wx.hideLoading(); }
  },
  async onExport() {
    wx.showLoading({ title: '生成中...' });
    try {
      const all = await invoices.list({ month: this.data.currentMonth });
      // 生成 CSV（带 BOM 支持西班牙语字符）
      let csv = '﻿Fecha,Proveedor,Nº Factura,Base,IVA%,IVA,Total,Categoría\n';
      all.forEach(i => {
        csv += `${escCsv(i.invoice_date)},${escCsv(i.supplier_name)},${escCsv(i.invoice_number)},${i.base_amount},${i.iva_rate},${i.iva_amount},${i.total_amount},${escCsv(getLabel(i.category))}\n`;
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
