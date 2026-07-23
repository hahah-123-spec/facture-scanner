// miniapp/miniprogram/pages/scan/add.js
const { invoices } = require('../../utils/supabase');
const { uploadImage, getPublicUrl } = require('../../utils/storage');
const { CATEGORIES } = require('../../utils/categories');
const app = getApp();

Page({
  data: {
    photoPath: '',
    ocrLoading: false,
    saving: false,
    categories: CATEGORIES,
    categoryIndex: 0,
    form: {
      supplier_name: '', invoice_date: '', base_amount: '',
      iva_rate: '21', total_amount: '', invoice_number: '',
      category: 'productos', notes: ''
    }
  },
  onTakePhoto() {
    wx.chooseImage({
      count: 1, sizeType: ['compressed'], sourceType: ['camera', 'album'],
      success: async (res) => {
        const path = res.tempFilePaths[0];
        this.setData({ photoPath: path, ocrLoading: true });
        try {
          // 上传图片
          const filename = `incoming/${Date.now()}.jpg`;
          await uploadImage(path, filename);
          this.setData({ _imageFilename: filename });

          // 调用 OCR
          const ocrRes = await new Promise((resolve, reject) => {
            wx.request({
              url: `${app.globalData.supabaseUrl}/functions/v1/ocr-invoice`,
              method: 'POST',
              header: {
                'Content-Type': 'application/json',
                'apikey': app.globalData.anonKey,
                'Authorization': `Bearer ${wx.getStorageSync('supabase_token')}`
              },
              data: { image_url: filename },
              success(r) { resolve(r.data); },
              fail: reject
            });
          });
          this.setData({
            form: {
              supplier_name: ocrRes.supplier_name || '',
              invoice_date: ocrRes.invoice_date || '',
              base_amount: String(ocrRes.base_amount || ''),
              iva_rate: '21',
              total_amount: String(ocrRes.total_amount || ''),
              invoice_number: ocrRes.invoice_number || '',
              category: 'productos',
              notes: ''
            }
          });
        } catch (e) { console.error('OCR failed:', e); }
        finally { this.setData({ ocrLoading: false }); }
      }
    });
  },
  onFieldChange(e) {
    const { field } = e.currentTarget.dataset;
    const form = { ...this.data.form };
    form[field] = e.detail.value;
    this.setData({ form });
  },
  onCategoryChange(e) {
    const cat = this.data.categories[e.detail.value];
    const form = { ...this.data.form, category: cat.value };
    this.setData({ form, categoryIndex: e.detail.value });
  },
  async onSave() {
    const { form, _imageFilename } = this.data;
    if (!form.supplier_name || !form.invoice_date || !form.total_amount) {
      wx.showToast({ title: '请填写供应商、日期和金额', icon: 'none' }); return;
    }
    this.setData({ saving: true });
    try {
      // 重复检测
      const dup = await invoices.checkDuplicate(form.supplier_name, form.invoice_date, parseFloat(form.total_amount));
      if (dup) {
        const confirmed = await new Promise(resolve => {
          wx.showModal({
            title: '⚠️ 可能已录入',
            content: `${dup.supplier_name}\n${dup.invoice_date}\n€${dup.total_amount}\n\n已有相同发票，确认保存？`,
            confirmText: '仍然保存', cancelText: '取消',
            success: r => resolve(r.confirm)
          });
        });
        if (!confirmed) { this.setData({ saving: false }); return; }
      }

      await invoices.create({
        supplier_name: form.supplier_name,
        invoice_date: form.invoice_date,
        base_amount: parseFloat(form.base_amount) || 0,
        iva_rate: parseFloat(form.iva_rate) || 21,
        total_amount: parseFloat(form.total_amount) || 0,
        invoice_number: form.invoice_number,
        category: form.category,
        image_url: _imageFilename || '',
        notes: form.notes
      });

      wx.showToast({ title: '✅ 保存成功', icon: 'none' });
      this.setData({
        photoPath: '', _imageFilename: null,
        form: { supplier_name: '', invoice_date: '', base_amount: '', iva_rate: '21', total_amount: '', invoice_number: '', category: 'productos', notes: '' }
      });
    } catch (e) {
      console.error(e);
      wx.showToast({ title: '保存失败', icon: 'none' });
    } finally { this.setData({ saving: false }); }
  }
});
