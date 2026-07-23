// miniapp/miniprogram/pages/invoices/detail.js
const { invoices } = require('../../utils/supabase');
const { getPublicUrl } = require('../../utils/storage');
const { CATEGORIES } = require('../../utils/categories');

Page({
  data: { invoice: null, categories: CATEGORIES, editing: false, imageUrl: '' },

  onLoad(options) {
    this.loadInvoice(options.id);
  },

  async loadInvoice(id) {
    try {
      const invoice = await invoices.getById(id);
      this.setData({
        invoice,
        imageUrl: invoice.image_url ? getPublicUrl(invoice.image_url) : ''
      });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onFieldChange(e) {
    const { field } = e.currentTarget.dataset;
    const invoice = { ...this.data.invoice };
    invoice[field] = e.detail.value;
    this.setData({ invoice });
  },

  onCategoryChange(e) {
    const idx = e.detail.value;
    const invoice = { ...this.data.invoice, category: CATEGORIES[idx].value };
    this.setData({ invoice });
  },

  onIvaRateChange(e) {
    const rate = parseFloat(e.detail.value) || 21;
    const invoice = { ...this.data.invoice, iva_rate: rate };
    this.setData({ invoice });
  },

  setEditing(e) {
    const val = typeof e === 'object' ? e.currentTarget.dataset.arg : e;
    this.setData({ editing: val });
  },

  async onSave() {
    try {
      const { id, ...fields } = this.data.invoice;
      await invoices.update(id, fields);
      wx.showToast({ title: '已保存', icon: 'success' });
      this.setEditing(false);
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  async onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      confirmColor: '#C2413E',
      success: async (res) => {
        if (res.confirm) {
          await invoices.delete(this.data.invoice.id);
          wx.navigateBack();
        }
      }
    });
  }
});
