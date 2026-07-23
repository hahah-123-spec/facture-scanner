## ### 任务 6：发票列表页（Tab 1）

**文件：**
- 创建：`miniapp/miniprogram/pages/invoices/list.js`
- 创建：`miniapp/miniprogram/pages/invoices/list.wxml`
- 创建：`miniapp/miniprogram/pages/invoices/list.wxss`
- 创建：`miniapp/miniprogram/pages/invoices/list.json`

- [ ] **步骤 1：列表页逻辑**

```javascript
// miniapp/miniprogram/pages/invoices/list.js
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
```

- [ ] **步骤 2：列表页模板**

```xml
<!-- miniapp/miniprogram/pages/invoices/list.wxml -->
<view class="list-page">
  <!-- 搜索栏 -->
  <view class="search-bar">
    <input class="search-input" placeholder="🔍 搜索供应商..." bindinput="onSearchInput" value="{{searchText}}" />
  </view>

  <!-- 月份切换 -->
  <view class="month-switcher">
    <text class="month-btn" bindtap="onPrevMonth">◀</text>
    <text class="month-label">{{currentMonth}}</text>
    <text class="month-btn" bindtap="onNextMonth">▶</text>
  </view>

  <!-- 列表 / 空状态 -->
  <block wx:if="{{invoices.length > 0}}">
    <scroll-view scroll-y="true" class="list-scroll">
      <invoice-card wx:for="{{invoices}}" wx:key="id" invoice="{{item}}" bind:tap="onCardTap" />
    </scroll-view>
  </block>
  <block wx:else>
    <view class="empty-state">
      <text class="empty-icon">🧾</text>
      <text class="empty-text">还没有发票</text>
      <text class="empty-hint">点下方 + 开始录入</text>
    </view>
  </block>
</view>
```

- [ ] **步骤 3：列表页样式**

```css
/* miniapp/miniprogram/pages/invoices/list.wxss */
.list-page { min-height: 100vh; padding-bottom: 80px; }
.search-bar { padding: 12px 16px; }
.search-input { background: #fff; border: 1px solid var(--pale-ink); border-radius: 8px; height: 40px; padding: 0 12px; font-size: 14px; }
.month-switcher { display: flex; justify-content: center; align-items: center; padding: 8px 0 4px; }
.month-btn { padding: 8px 16px; font-size: 16px; color: var(--ink-blue); }
.month-label { font-size: 16px; font-weight: 500; min-width: 100px; text-align: center; }
.list-scroll { height: calc(100vh - 180px); }
.empty-state { display: flex; flex-direction: column; align-items: center; padding-top: 120px; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-text { font-size: 18px; color: var(--steel-gray); }
.empty-hint { font-size: 14px; color: var(--steel-gray); margin-top: 4px; }
```

- [ ] **步骤 4：注册组件**

```json
// miniapp/miniprogram/pages/invoices/list.json
{
  "usingComponents": { "invoice-card": "/components/invoice-card/index" },
  "enablePullDownRefresh": true
}
```

- [ ] **步骤 5：Commit**

```bash
git add miniapp/miniprogram/pages/invoices/list* && git commit -m "feat: add invoice list page with search and month filter"
```

---


