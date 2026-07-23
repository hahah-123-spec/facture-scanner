## ### 任务 7：发票详情/编辑页

**文件：**
- 创建：`miniapp/miniprogram/pages/invoices/detail.js`
- 创建：`miniapp/miniprogram/pages/invoices/detail.wxml`
- 创建：`miniapp/miniprogram/pages/invoices/detail.wxss`
- 创建：`miniapp/miniprogram/pages/invoices/detail.json`

- [ ] **步骤 1：详情页逻辑**

```javascript
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
    } catch (e) { wx.showToast({ title: '加载失败', icon: 'none' }); }
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
  setEditing(val) { this.setData({ editing: val }); },
  async onSave() {
    try {
      const { id, ...fields } = this.data.invoice;
      await invoices.update(id, fields);
      wx.showToast({ title: '已保存', icon: 'success' });
      this.setEditing(false);
    } catch (e) { wx.showToast({ title: '保存失败', icon: 'none' }); }
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
```

- [ ] **步骤 2：详情页模板**

```xml
<!-- miniapp/miniprogram/pages/invoices/detail.wxml -->
<view class="detail-page" wx:if="{{invoice}}">
  <!-- 照片 -->
  <image wx:if="{{imageUrl}}" src="{{imageUrl}}" mode="widthFix" class="invoice-image" />

  <!-- 字段 -->
  <view class="fields">
    <view class="field-group">
      <text class="field-label">供应商</text>
      <input class="field-input" value="{{invoice.supplier_name}}" data-field="supplier_name" bindinput="onFieldChange" disabled="{{!editing}}" />
    </view>
    <view class="field-row">
      <view class="field-group half">
        <text class="field-label">日期</text>
        <input class="field-input" value="{{invoice.invoice_date}}" data-field="invoice_date" bindinput="onFieldChange" disabled="{{!editing}}" />
      </view>
      <view class="field-group half">
        <text class="field-label">发票号</text>
        <input class="field-input" value="{{invoice.invoice_number}}" data-field="invoice_number" bindinput="onFieldChange" disabled="{{!editing}}" />
      </view>
    </view>
    <view class="field-group">
      <text class="field-label">Base Imponible (€)</text>
      <input class="field-input amount-input" type="digit" value="{{invoice.base_amount}}" data-field="base_amount" bindinput="onFieldChange" disabled="{{!editing}}" />
    </view>
    <view class="field-group">
      <text class="field-label">IVA (%)</text>
      <input class="field-input" type="digit" value="{{invoice.iva_rate}}" bindinput="onIvaRateChange" disabled="{{!editing}}" />
    </view>
    <view class="field-group">
      <text class="field-label">Total (€)</text>
      <input class="field-input amount-input" type="digit" value="{{invoice.total_amount}}" data-field="total_amount" bindinput="onFieldChange" disabled="{{!editing}}" />
    </view>
    <view class="field-group">
      <text class="field-label">分类</text>
      <picker range="{{categories}}" range-key="label" value="{{0}}" bindchange="onCategoryChange" disabled="{{!editing}}">
        <view class="picker-value">{{invoice.category}}</view>
      </picker>
    </view>
    <view class="field-group">
      <text class="field-label">备注</text>
      <textarea class="field-textarea" value="{{invoice.notes}}" data-field="notes" bindinput="onFieldChange" disabled="{{!editing}}" />
    </view>
  </view>

  <!-- 按钮 -->
  <view class="detail-actions">
    <button wx:if="{{!editing}}" class="btn-primary" bindtap="setEditing" data-arg="{{true}}">编辑</button>
    <button wx:if="{{editing}}" class="btn-primary" bindtap="onSave">保存</button>
    <button wx:if="{{editing}}" class="btn-secondary" bindtap="setEditing" data-arg="{{false}}">取消</button>
    <button class="btn-danger" bindtap="onDelete">删除</button>
  </view>
</view>
```

- [ ] **步骤 3：Commit**

```bash
git add miniapp/miniprogram/pages/invoices/detail* && git commit -m "feat: add invoice detail and edit page"
```

---


