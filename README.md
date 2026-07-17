# 跑团组局小程序

面向 QQ 群跑团生态的 TRPG **组局**小程序（不是跑团工具本体，也不是跑腿外卖）。定位是「高效率组局插件」，北极星指标是**发布人完成一次招募发布的时间 < 10 秒**。

微信小程序 / QQ 小程序双端互通。

## 核心闭环

发布招募 → 大厅可见 → 申请加入 → 发布人审核 → 发车 → 已通过成员查看联系方式

发车时系统自动将剩余 pending 申请归并为 rejected。

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | uni-app + Vue 3（Composition API / `<script setup>`）+ Vite |
| 状态管理 | Pinia |
| 样式 | SCSS，设计变量集中在 `src/uni.scss` |
| 后端 | 微信云开发（云函数 + 云数据库） |
| 语言 | JavaScript |

## 项目结构

```
src/
├── pages/           10 个页面（招募大厅 / 详情 / 发布 / 我的 / 审核 ...）
├── components/      公共组件（ModuleDetail / UserProfileContent / ShareMenu / PosterGenerator）
├── custom-tab-bar/  自定义 TabBar（原生微信组件）
├── api/             数据访问层，页面与 store 不直接碰数据源
├── store/           Pinia（game / user）
├── utils/           auth / request / formatTime
└── config.js        云环境配置（本地私有，见下）

cloudfunctions/      13 个云函数（用户 / 招募 / 申请 / 演绎记录）
docs/                PRD 与迭代文档
```

云数据库 4 个集合：`modules` / `users` / `applications` / `logs`。

## 本地运行

```bash
npm install
cp src/config.example.js src/config.js   # 填入自己的云开发环境 ID
npm run dev:mp-weixin
```

然后用微信开发者工具打开 `dist/dev/mp-weixin/`。

云函数需在开发者工具中右键 `cloudfunctions/` 下各目录单独上传部署。

## 文档

- `prd_v1_4.md` — 当前权威 PRD
- `V1.4联调测试清单.md` — 双人真机联调用例
- `CLAUDE.md` / `AGENTS.md` — 开发约定与踩坑记录

## 状态

V1.4（MVP 收口版）开发中：3 个 P0 已修复待验收，双人真机联调未开始。
