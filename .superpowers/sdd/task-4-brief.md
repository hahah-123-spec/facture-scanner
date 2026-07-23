## ### 任务 4：登录页面

**文件：**
- 创建：`miniapp/miniprogram/pages/login/login.js`
- 创建：`miniapp/miniprogram/pages/login/login.wxml`
- 创建：`miniapp/miniprogram/pages/login/login.wxss`
- 创建：`miniapp/miniprogram/pages/login/login.json`

- [ ] **步骤 1：编写登录页逻辑**

```javascript
// miniapp/miniprogram/pages/login/login.js
const auth = require('../../utils/auth');

Page({
  data: { loading: false },
  async handleLogin() {
    this.setData({ loading: true });
    try {
      await auth.login();
      wx.switchTab({ url: '/pages/invoices/list' });
    } catch (e) {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      console.error(e);
    } finally {
      this.setData({ loading: false });
    }
  }
});
```

- [ ] **步骤 2：编写登录页模板**

```xml
<!-- miniapp/miniprogram/pages/login/login.wxml -->
<view class="login-page">
  <view class="hero">
    <text class="hero-icon">🧾</text>
    <text class="hero-title">发票管理</text>
    <text class="hero-sub">拍照 · 识别 · 报表</text>
  </view>
  <button class="login-btn" bindtap="handleLogin" loading="{{loading}}" disabled="{{loading}}">
    微信一键登录
  </button>
</view>
```

- [ ] **步骤 3：编写登录页样式**

```css
/* miniapp/miniprogram/pages/login/login.wxss */
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 48px 32px;
  background-color: var(--paper-white);
}
.hero { text-align: center; margin-bottom: 64px; }
.hero-icon { font-size: 64px; display: block; margin-bottom: 16px; }
.hero-title { font-size: 28px; font-weight: bold; color: var(--ink-blue); display: block; }
.hero-sub { font-size: 16px; color: var(--steel-gray); margin-top: 8px; display: block; }
.login-btn {
  width: 100%; max-width: 320px; height: 52px; line-height: 52px;
  background-color: var(--ink-blue); color: #fff; border-radius: 12px;
  font-size: 18px; border: none;
}
.login-btn::after { border: none; }
.login-btn:active { opacity: 0.85; }
```

- [ ] **步骤 4：Commit**

```bash
git add miniapp/miniprogram/pages/login/ && git commit -m "feat: add WeChat login page"
```

---


