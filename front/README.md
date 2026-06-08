# SubTrack Mobile

SubTrack Mobile 是使用 Expo + React Native + NativeWind 重构的 Android 优先本地应用，聚焦两个核心场景：

- 订阅管理：记录长期扣款、续费日期、周期、状态、付款方式、提醒天数和月度/年度支出，并支持一键续费生成历史。
- 物品管理：记录资产购入价、位置、照片、保修、序列号、使用次数、完整使用历史、闲置天数和单次使用成本。
- 仪表盘：展示长期主义指数、订阅预算进度、待处理洞察，并支持点击跳转到对应模块。

## 技术栈

- Expo Router 文件路由
- React Native + TypeScript
- React Native Reusables 风格 UI 组件（NativeWind、CVA、tailwind-merge）
- expo-sqlite 本地数据库
- Zustand 状态管理
- expo-notifications 通知权限
- expo-file-system + expo-document-picker 导入导出

## 开发

```bash
cd front
npm install
npm run start
npm run android
```

## 验证

```bash
npm run typecheck
npm run lint
```

## Android 构建

```bash
cd front
npx eas build -p android --profile preview
```
