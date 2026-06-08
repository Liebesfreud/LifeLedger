# SubTrack

SubTrack 正在从 Web 订阅管理工具重构为 **Expo + React Native Android App**。新版本采用本地优先架构，核心功能是订阅管理与物品管理，并逐步扩展为长期主义生活管理工具。

## 当前移动端能力

- 订阅管理：新增、编辑、删除、状态/付款方式、周期支出统计、一键续费、续费历史和提醒状态。
- 物品管理：新增、编辑、删除、照片、保修/序列号、记录使用、完整使用历史、闲置天数、单次使用成本。
- 仪表盘：月度订阅、年度支出、物品总值、需关注事项、长期主义指数。
- 设置：基础币种、月度预算、闲置提醒天数、通知权限、JSON 导入导出。
- 数据：使用 `expo-sqlite` 保存在设备本地。

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 移动端 | Expo + React Native + TypeScript |
| 路由 | Expo Router |
| UI | NativeWind + React Native Reusables 风格组件 |
| 状态 | Zustand |
| 数据库 | expo-sqlite |
| 通知 | expo-notifications |
| 导入导出 | expo-file-system + expo-document-picker |

## 开发启动

```bash
cd front
npm install
npm run start
```

运行 Android：

```bash
cd front
npm run android
```

类型检查：

```bash
cd front
npm run typecheck
```

## 目录

```text
front/
  app/              Expo Router 页面
  components/       通用 UI 与业务组件
  lib/              SQLite 与工具函数
  store/            Zustand 应用状态
  types/            领域类型
server/             旧 Go 后端，迁移期间暂保留
contracts/          旧 API 契约，迁移期间暂保留
```
