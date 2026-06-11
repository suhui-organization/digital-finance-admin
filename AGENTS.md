<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# digital-finance-admin — AI 开发代理规范

## 项目身份
- **名称**: 数字金融彩票 - 管理后台
- **端口**: 16010
- **技术栈**: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + daisyUI 5
- **包管理器**: yarn

## 关键约定
- 遵循 `../.clinerules`（根 Rule）和本目录 `.clinerules`
- 组件使用函数组件 + Hooks，Props 必须有 TypeScript 接口
- API 调用统一封装，base URL 从环境变量读取，请求需带 JWT token
- 使用 Tailwind 工具类优先，避免内联 style
- 移动端/桌面端响应式兼容

## 快速命令
- `yarn dev` — 启动开发服务器 (端口 16010)
- `yarn lint` — 代码检查
- `yarn build` — 生产构建
- `yarn start` — 启动生产服务器

## 关联服务
- Go 后端: http://localhost:16080
- AI 服务: http://localhost:16081
- 统入口 (Nginx): http://localhost:16000