# SubTrack

<div align="center">

**📊 个人订阅服务管理应用 | Personal Subscription Tracker**

[![Go](https://img.shields.io/badge/Go-1.22-00ADD8?logo=go)](https://go.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[English](#english) | [中文](#中文)

</div>

---

## 中文

### 📖 简介

SubTrack 是一个帮助你追踪和管理各类订阅服务的应用。告别忘记续费或意外扣款的烦恼！

### ✨ 功能特性

- 🔐 **用户认证** - 安全的注册/登录系统
- 📝 **订阅管理** - 添加、编辑、删除订阅服务
- 📁 **分类管理** - 自定义分类整理订阅
- 💰 **多币种支持** - CNY/USD/EUR/GBP/JPY，自动汇率更新
- 🔔 **到期提醒** - 通过 Telegram Bot 接收续费提醒
- 📊 **数据统计** - 月度/年度费用概览
- 🌓 **深色模式** - 保护眼睛
- 🌍 **中英双语** - 支持中文和英文界面
- 💾 **数据导入/导出** - 备份和恢复数据

### 🛠️ 技术栈

| 组件 | 技术 |
|------|------|
| 后端 | Go 1.22 + Gin + GORM |
| 数据库 | SQLite |
| 前端 | React 18 + TypeScript + Vite |
| 通知 | Telegram Bot API |
| 定时任务 | robfig/cron |

### 🚀 快速开始

#### 使用 Docker (推荐)

```bash
# 克隆项目
git clone https://github.com/yourusername/SubTrack-Go.git
cd SubTrack-Go

# 复制环境变量配置
cp .env.example .env
# 编辑 .env 设置你的 JWT_SECRET

# 启动服务
docker compose up -d

# 访问 http://localhost:8080
```

#### 本地开发

**后端:**
```bash
cd server

# 安装依赖
go mod download

# 设置环境变量
export JWT_SECRET="your-secret-key"
export DATABASE_PATH="./data/subtrack.db"

# 运行
go run cmd/api/main.go
```

**前端:**
```bash
cd front

# 安装依赖
npm install

# 设置 API 地址
echo "VITE_API_BASE=http://localhost:8080" > .env.local

# 开发模式运行
npm run dev
```

### ⚙️ 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务器端口 | `8080` |
| `JWT_SECRET` | JWT 签名密钥 (生产环境必须设置) | - |
| `DATABASE_PATH` | SQLite 数据库路径 | `./data/subtrack.db` |
| `APP_ENV` | 运行环境 (development/production) | `development` |
| `VITE_API_BASE` | 前端 API 地址 | `http://localhost:8080` |

### 📁 项目结构

```
SubTrack-Go/
├── server/                 # Go 后端
│   ├── cmd/api/           # 入口点
│   └── internal/          # 内部包
│       ├── auth/          # 认证逻辑
│       ├── config/        # 配置加载
│       ├── database/      # 数据库连接
│       ├── domain/        # 数据模型
│       ├── http/          # HTTP 处理
│       ├── jobs/          # 定时任务
│       └── telegram/      # Telegram 通知
├── front/                  # React 前端
│   ├── components/        # React 组件
│   ├── services/          # API 服务
│   └── types.ts           # TypeScript 类型
├── contracts/             # API 契约
│   └── openapi.yaml       # OpenAPI 规范
└── docker-compose.yml     # Docker 配置
```

### 📄 API 文档

API 遵循 OpenAPI 3.0 规范，详见 [contracts/openapi.yaml](contracts/openapi.yaml)。

---

## English

### 📖 Introduction

SubTrack helps you track and manage your subscription services. Never forget a renewal or get surprised by unexpected charges!

### ✨ Features

- 🔐 **Authentication** - Secure registration and login
- 📝 **Subscription Management** - Add, edit, delete subscriptions
- 📁 **Categories** - Organize subscriptions with custom categories
- 💰 **Multi-currency** - CNY/USD/EUR/GBP/JPY with auto exchange rates
- 🔔 **Reminders** - Telegram notifications before renewal
- 📊 **Analytics** - Monthly/yearly expense overview
- 🌓 **Dark Mode** - Easy on the eyes
- 🌍 **i18n** - Chinese and English interface
- 💾 **Import/Export** - Backup and restore your data

### 🚀 Quick Start

#### Using Docker (Recommended)

```bash
git clone https://github.com/yourusername/SubTrack-Go.git
cd SubTrack-Go

cp .env.example .env
# Edit .env to set your JWT_SECRET

docker compose up -d
# Visit http://localhost:8080
```

#### Local Development

See Chinese section above for detailed commands.

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for subscription management**

</div>
