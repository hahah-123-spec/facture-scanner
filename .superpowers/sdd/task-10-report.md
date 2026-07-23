# Task 10 Report - 我的页面（Tab 4）

## Summary

Created the "我的" (Profile) page as Tab 4 of the mini program, with 4 files under `miniapp/miniprogram/pages/profile/`.

## Files Created

- **index.js**: Page logic with:
  - `defaultIva` state management via `wx.getStorageSync`/`wx.setStorageSync`
  - `onIvaChange` handler to persist IVA rate changes
  - `onLogout` handler with confirm modal → `auth.logout()` → redirect to login
  - Version display via data binding

- **index.wxml**: Template with:
  - Settings section (IVA rate input)
  - About section (version `1.0.0`)
  - Logout button

- **index.wxss**: Styling consistent with existing pages (cards, inputs, logout button in red)

- **index.json**: Page config with title "我的"

## Commit

`a4b16f2 feat: add profile page with settings and logout`

4 files changed, 120 insertions(+)
