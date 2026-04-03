# 跑团组局小程序 - CLAUDE.md

> **当前 PRD：prd_v1_3.md（唯一权威需求源，页面结构、字段定义、跳转关系等以 PRD 为准）**

## ⚠️ 重要说明
本项目是 TRPG 跑团（桌游/角色扮演游戏）**组局**小程序，不是跑腿外卖。

## 项目定位
- 产品定位：QQ 群跑团生态的"高效率组局插件"（非跑团工具本体）
- 适用端：微信小程序 / QQ 小程序（双端互通）
- 北极星指标：发布人完成一次招募发布的时间 < 10秒
- 技术栈：uni-app + Vue3 + Vite + Pinia（JavaScript）

---

## 开发原则
- **严格按 PRD 和本文档开发**，不要自行猜测功能
- **每次修改代码前必须重新阅读本文件**，不得以任何理由跳过
- 页面极简优先，减少不必要的功能入口
- 修改完成后不需要编译验证，由产品方在微信开发者工具中自行测试

---

## 当前页面与组件清单

### 页面（10 个）
| 页面 | 路径 | 状态 |
|---|---|---|
| P1 招募大厅 | pages/home/index | ✅ TabBar Tab1 |
| P2 招募详情页 | pages/home/detail | ✅ |
| P3 发布/编辑表单 | pages/publish/form | ✅ 非 TabBar 页面 |
| P4 用户主页 | pages/profile/index | ✅ 支持本人/他人视角 |
| P5 编辑个人资料 | pages/profile/edit | ✅ |
| P6 演绎记录详情 | pages/profile/log_detail | ✅ |
| P7 我的（Tab2 壳页面）| pages/mine/index | ✅ TabBar Tab2 |
| P8 我的创建/申请/足迹 | pages/mine/created | ✅ tab 参数区分 |
| P9 发布人详情页 | pages/mine/detail | ✅ |
| P10 审核页 | pages/mine/review | ✅ |

### 公共组件
| 组件 | 用途 |
|---|---|
| ModuleDetail.vue | 共用模组信息展示 |
| UserProfileContent.vue | 共用用户资料（本人/他人视角） |
| ShareMenu.vue | 分享菜单（转发好友 + 生成海报入口） |
| PosterGenerator.vue | Canvas 海报生成 + 预览 + 保存相册 |

### 核心架构
- mock 数据统一在 `src/utils/mockData.js`，通过 `src/api/` 层访问（`api/module.js`、`api/user.js`、`api/log.js`），页面和 store 禁止直接 import mockData
- Store：`store/game.js`（含 departModule 自动拒绝逻辑）、`store/user.js`
- 路由配置：`pages.json`，`tabBar.custom: true`
- 自定义 TabBar：`src/custom-tab-bar/`（原生微信组件）
- 登录工具：`src/utils/auth.js` 的 `checkLogin()` 方法
- 时间格式化：`src/utils/formatTime.js` 的 `formatGameTime()`

---

## 已知的坑（必读）
- 微信小程序不支持组件多根节点（fragment），组件必须有单一根节点
- 微信小程序组件样式不允许标签选择器，只能用 class 选择器
- TabBar 页面跳转必须用 `uni.switchTab`，不能用 `uni.navigateTo`
- 禁止引用 `/static/` 下不存在的本地图片，用背景色块占位代替
- 导航栏右上角是微信系统胶囊区域，禁止放自定义按钮，操作按钮统一改为底部吸底按钮
- **数据字段注意**：招募 PL 人数字段名是 `plCount`（不是 `recruitPL`）
- **跑团时间字段**：使用 `gameDays`（数组）+ `startTime` + `endTime`（HH:mm），展示调用 `formatGameTime()`；旧 `time` 字符串字段已废弃
- **联系方式数据结构**：统一为 `contact: { type: 'qq'|'wx'|'qqgroup', value: '' }`，用户资料和招募模组均使用此结构

---

## 代码规范

### 代码风格
- Vue 3 Composition API，`<script setup>` 语法，不使用 Options API
- 变量驼峰（camelCase），组件大驼峰（PascalCase）
- 页面放 `src/pages/`，公共组件放 `src/components/`
- API 请求通过 `src/utils/request.js` 封装
- 样式使用 SCSS，颜色和间距使用 `src/uni.scss` 全局变量
- 只用 `const` 和 `let`，禁止 `var`
- 异步用 `async/await`，不用 `.then()` 链

### uni-app 规范
- 布局用 `<view>`，文字用 `<text>`，图片用 `<image>` 并设 mode
- 点击事件用 `@tap`，不用 `@click`
- 尺寸单位用 `rpx`

### 图片资源
- 禁止引用不存在的本地图片
- 图片占位用背景色块（`.avatar-placeholder` / `.cover-placeholder`）
- 真实图片路径通过接口数据动态传入

### 页面跳转
- TabBar 页面路径：`pages/home/index`、`pages/mine/index`
- TabBar 页面跳转用 `uni.switchTab`，非 TabBar 用 `uni.navigateTo`
- 表单提交后、发车成功后用 `uni.redirectTo`（避免返回空表单）
- 返回用 `uni.navigateBack()`

### TabBar 规范
- 使用自定义 TabBar（`src/custom-tab-bar/`），不用微信原生样式
- 三个视觉位：招募大厅（tab 页）、发布（中间按钮，非 tab 页）、我的（tab 页）
- 中间按钮用 `uni.navigateTo` 跳转 `pages/publish/form`
- 每个 tab 页面 `onShow` 中调用 `getTabBar().setData({ selected: N })` 更新选中态
- `pages.json` 中 `tabBar.custom: true`，`list` 仍需声明所有 tab 页面路径

### 注释规范
- 每个组件顶部写明用途
- 复杂逻辑必须添加注释
- API 调用处注明接口用途

---

## UI 设计规范（所有页面必须遵守）

### 颜色系统
```scss
$bg-page: #f5f5f5;        // 页面背景
$bg-navbar: #2c2c2c;      // 导航栏背景
$text-navbar: #ffffff;     // 导航栏文字
$bg-tabbar: #e6e6e6;      // TabBar 背景
$bg-card: #e8e8e8;        // 卡片背景
$bg-card-overlay: rgba(0,0,0,0.5); // 已发车蒙层
$bg-tag: #434343;         // tag 背景
$text-tag: #ffffff;       // tag 文字
$text-primary: #000000;   // 主标题
$text-secondary: #363636; // 正文
$text-tertiary: #b2b2b2;  // 辅助信息
$text-placeholder: #999999; // placeholder
$border-color: #d9d9d9;   // 边框
$bg-placeholder-icon: #666666; // 图标占位
$bg-image-placeholder: #d9d9d9; // 图片占位
```

### 颜色强制要求
- 严格使用 `src/uni.scss` 变量，禁止硬编码色值
- 特别禁止：`#6B3FA0`（紫色）、`#FF6B35`（橙色）、`#1989fa`（蓝色）

### 间距与尺寸
- 页面左右内边距：`32rpx`
- 卡片：`padding: 16rpx 32rpx`，圆角 `16rpx`，间距 `8rpx`
- 封面图：`100rpx × 100rpx`，圆角 `10rpx`
- Tag：高 `32rpx`，左右 padding `16rpx`，圆角 `999rpx`
- 搜索栏：高 `64rpx`，圆角 `999rpx`
- 图标占位：`32rpx × 32rpx`，圆角 `50%`
- 吸底按钮：高 `88rpx`，圆角 `16rpx`

### 字体
- 主标题：`36rpx` 粗体
- Tag / 信息行 / 辅助信息：`22rpx`
- 表单标签：`28rpx`

### 布局
- 所有页面背景 `#f5f5f5`，禁止深色背景
- 卡片 `width: 100%`，禁止固定 rpx 宽度
- 所有容器 `box-sizing: border-box`（逐个声明，不用 * 通配符）
- 禁止 CSS 通配符 `*`、伪元素 `::before/::after`、`vh/vw` 单位

### 导航栏
- 所有页面使用微信原生默认导航栏，禁止自定义导航栏
- `pages.json` 只配 `navigationBarTitleText`，禁止设 `navigationStyle: custom`
- 禁止手动加 `padding-top` 避开导航栏

### 档案馆吸顶
- UserProfileContent 组件的档案馆 tab 栏：`position: sticky; top: 0; z-index: 10;`

### 登录规范
- 无独立登录页，授权通过 `checkLogin()` + wx.login 弹窗触发
- 游客可浏览招募大厅和详情页
- 触发登录的操作：申请加入、进入「我的」Tab、点击发布按钮、点击他人头像进入主页
- MVP 阶段授权后注入 mockData 用户数据

### 新建页面默认模板
```vue
<template>
  <view class="page-container">
    <!-- 页面内容 -->
  </view>
</template>

<style lang="scss">
.page-container {
  min-height: 100%;
  background-color: #f5f5f5;
  box-sizing: border-box;
  padding: 0 32rpx;
}
</style>
```

---

## 待办事项
- [ ] 海报样式真机调试与微调
- [ ] 后端接口接入替换 mock 数据
