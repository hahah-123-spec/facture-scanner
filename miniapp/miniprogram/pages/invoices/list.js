const { invoices } = require('../../utils/supabase');

Page({
  data: {
    invoices: [],
    currentMonth: '',
    searchText: '',
    loading: false
  },
  onShow() {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.setData({ currentMonth: month });
    this.loadInvoices();
  },
  async loadInvoices() {
    this.setData({ loading: true });
    try {
      const data = await invoices.list({
        month: this.data.currentMonth,
        search: this.data.searchText || undefined
      });
      this.setData({ invoices: data || [] });
    } catch (e) { wx.showToast({ title: '加载失败', icon: 'none' }); }
    finally { this.setData({ loading: false }); }
  },
  onSearchInput(e) {
    this.setData({ searchText: e.detail.value });
    this.loadInvoices();
  },
  onPrevMonth() {
    const d = new Date(this.data.currentMonth + '-01');
    d.setMonth(d.getMonth() - 1);
    this.setData({ currentMonth: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` });
    this.loadInvoices();
  },
  onNextMonth() {
    const d = new Date(this.data.currentMonth + '-01');
    d.setMonth(d.getMonth() + 1);
    this.setData({ currentMonth: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` });
    this.loadInvoices();
  },
  onCardTap(e) {
    wx.navigateTo({ url: `/pages/invoices/detail?id=${e.detail.id}` });
  },
  onPullDownRefresh() {
    this.loadInvoices().then(() => wx.stopPullDownRefresh());
  }
});
