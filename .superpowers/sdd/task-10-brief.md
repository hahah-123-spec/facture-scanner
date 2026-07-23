## ### 任务 10：我的页面（Tab 4）

**文件：**
- 创建：`miniapp/miniprogram/pages/profile/index.js`
- 创建：`miniapp/miniprogram/pages/profile/index.wxml`
- 创建：`miniapp/miniprogram/pages/profile/index.wxss`
- 创建：`miniapp/miniprogram/pages/profile/index.json`

- [ ] **步骤 1：实现**

```javascript
// miniapp/miniprogram/pages/profile/index.js
const auth = require('../../utils/auth');

Page({
  data: { defaultIva: 21 },
  onShow() { this.setData({ defaultIva: wx.getStorageSync('default_iva') || 21 }); },
  onIvaChange(e) {
    const v = parseInt(e.detail.value) || 21;
    wx.setStorageSync('default_iva', v);
    this.setData({ defaultIva: v });
  },
  onLogout() {
    wx.showModal({
      title: '退出登录', content: '确定退出？',
      success: r => {
        if (r.confirm) { auth.logout(); wx.redirectTo({ url: '/pages/login/login' }); }
      }
    });
  }
});
```

```xml
<!-- miniapp/miniprogram/pages/profile/index.wxml -->
<view class="profile-page">
  <view class="section">
    <text class="section-title">设置</text>
    <view class="setting-row">
      <text class="setting-label">默认 IVA 税率 (%)</text>
      <input class="setting-input" type="number" value="{{defaultIva}}" bindinput="onIvaChange" />
    </view>
  </view>
  <view class="section">
    <text class="section-title">关于</text>
    <view class="info-row"><text class="info-label">版本</text><text class="info-value">1.0.0</text></view>
  </view>
  <button class="btn-logout" bindtap="onLogout">退出登录</button>
</view>
```

- [ ] **步骤 2：Commit**

```bash
git add miniapp/miniprogram/pages/profile/ && git commit -m "feat: add profile page with settings and logout"
```

---


