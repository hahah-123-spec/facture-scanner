# 任务 5：发票卡片组件 — 完成报告

## 状态：完成

## 变更摘要

创建了 4 个文件共 41 行新代码：

| 文件 | 路径 | 说明 |
|------|------|------|
| `index.js` | `miniapp/miniprogram/components/invoice-card/` | 组件逻辑，使用 `observers` 监听 `invoice.category` 变化并计算 `categoryLabel` |
| `index.wxml` | `miniapp/miniprogram/components/invoice-card/` | 卡片模板，展示供应商、金额、日期、类别和可选的 IVA 税率 |
| `index.wxss` | `miniapp/miniprogram/components/invoice-card/` | 卡片样式，使用 flexbox 和 CSS 自定义属性 |
| `index.json` | `miniapp/miniprogram/components/invoice-card/` | 组件声明 |

## 关键适配

原始简报使用 `computed` 属性，但微信小程序原生 Component 不支持 `computed`。改为使用 `observers` 实现相同功能：

```javascript
// before (brief)
computed: {
  categoryLabel() { return getLabel(this.data.invoice.category); }
}

// after (implementation)
observers: {
  'invoice.category': function(category) {
    this.setData({ categoryLabel: getLabel(category) });
  }
}
```

## 自审检查

- [x] 文件路径与简报一致
- [x] `getLabel` 正确地从 `../../utils/categories` 导入
- [x] `observers` 替代 `computed` 已正确实现
- [x] `onTap` 方法正确触发 `tap` 事件并携带 `{ id }`
- [x] wxml 模板使用 `bindtap` 绑定点击事件
- [x] 金额显示带 `€` 前缀
- [x] IVA 税率使用 `wx:if` 条件渲染
- [x] wxss 样式与简报完全一致
- [x] json 声明 `"component": true`
- [x] 提交成功：`63d3721` — `feat: add invoice card component`
