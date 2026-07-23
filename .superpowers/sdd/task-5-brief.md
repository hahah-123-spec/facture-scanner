## ### 任务 5：发票卡片组件

**文件：**
- 创建：`miniapp/miniprogram/components/invoice-card/index.js`
- 创建：`miniapp/miniprogram/components/invoice-card/index.wxml`
- 创建：`miniapp/miniprogram/components/invoice-card/index.wxss`
- 创建：`miniapp/miniprogram/components/invoice-card/index.json`

- [ ] **步骤 1：实现卡片组件**

```javascript
// miniapp/miniprogram/components/invoice-card/index.js
const { getLabel } = require('../../utils/categories');

Component({
  properties: {
    invoice: { type: Object, value: {} }
  },
  computed: {
    categoryLabel() { return getLabel(this.data.invoice.category); }
  },
  methods: {
    onTap() {
      this.triggerEvent('tap', { id: this.data.invoice.id });
    }
  }
});
```

- [ ] **步骤 2：卡片模板**

```xml
<!-- miniapp/miniprogram/components/invoice-card/index.wxml -->
<view class="card" bindtap="onTap">
  <view class="card-row-top">
    <text class="supplier">{{invoice.supplier_name}}</text>
    <text class="amount">€{{invoice.total_amount}}</text>
  </view>
  <view class="card-row-bottom">
    <text class="date">{{invoice.invoice_date}}</text>
    <text class="sep">·</text>
    <text class="category">{{invoice.category}}</text>
    <text class="iva" wx:if="{{invoice.iva_rate}}">IVA {{invoice.iva_rate}}%</text>
  </view>
</view>
```

- [ ] **步骤 3：卡片样式**

```css
/* miniapp/miniprogram/components/invoice-card/index.wxss */
.card-row-top { display: flex; justify-content: space-between; align-items: baseline; }
.supplier { font-size: 16px; font-weight: 500; color: var(--ink-black); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.amount { font-size: 22px; font-weight: bold; color: var(--ink-black); flex-shrink: 0; margin-left: 12px; }
.card-row-bottom { display: flex; align-items: center; margin-top: 8px; }
.date { font-size: 14px; color: var(--steel-gray); }
.sep { margin: 0 6px; color: var(--pale-ink); }
.category { font-size: 14px; color: var(--ink-blue); }
.iva { font-size: 12px; color: var(--steel-gray); margin-left: 6px; }
```

- [ ] **步骤 4：Commit**

```bash
git add miniapp/miniprogram/components/ && git commit -m "feat: add invoice card component"
```

---


