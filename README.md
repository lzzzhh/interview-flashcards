# 📚 Interview Flashcards — 面经闪卡

<p align="center">
  <a href="https://github.com/lzzzhh/interview-flashcards/actions/workflows/build.yml"><img src="https://github.com/lzzzhh/interview-flashcards/actions/workflows/build.yml/badge.svg" alt="Build"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri" alt="Tauri v2">
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss" alt="TailwindCSS v4">
</p>

<p align="center">
  Active Recall + SM-2 间隔重复驱动的面试复习桌面应用。<br>
  高质量卡片覆盖算法 · 统计学 · 机器学习 · 大模型 · 行业黑话 · 职场话术六大方向。<br>
  数据本地存储，Tauri 原生桌面体感，跨平台（macOS / Windows / Linux）。
</p>

---

## 快速开始

```bash
curl -fsSL https://raw.githubusercontent.com/lzzzhh/interview-flashcards/main/install.sh | bash
```

或从 [Releases](https://github.com/lzzzhh/interview-flashcards/releases) 下载：

| 平台 | 安装包 |
|------|--------|
| 🍎 macOS (Apple Silicon) | `面经闪卡_aarch64.dmg` |
| 🍎 macOS (Intel) | `面经闪卡_x86_64.dmg` |
| 🪟 Windows | `面经闪卡_x64-setup.exe` |
| 🐧 Linux | `.AppImage` / `.deb` / `.rpm` |

---

## 功能亮点

### 🧠 主动回忆 (Active Recall)

所有非代码类卡片默认隐藏答案。先回忆、再揭示，模拟真实面试场景。

- **思路 / 代码独立开关** — 分步揭示，避免一次性剧透
- **Space 快捷键** — 一键切换显示状态
- **平滑展开动画** — 答案揭示不跳闪

### 📅 SM-2 间隔重复系统

基于 SM-2 算法 + 艾宾浩斯遗忘曲线，智能调度复习节奏。

- **到期卡片自动筛选** — 复习模式下只展示该复习的卡片
- **ReviewLog 持久化** — 每次评分的间隔、反应时间、日期完整记录
- **统计面板** — 今日复习数、连续打卡天数、准确率、困难卡片检测
- **掌握状态提示** — 卡片达到稳定间隔后标记为已掌握

### 🎮 五级评分系统

| 评分 | 含义 | 预期间隔 |
|------|------|----------|
| 1 — 忘了 | 完全没想起来 | 1 分钟 |
| 2 — 困难 | 想了很久才记起 | 10 分钟 |
| 3 — 一般 | 有印象但不确定 | 1 天 |
| 4 — 顺利 | 很快想起来了 | 4 天 |
| 5 — 秒答 | 瞬间反应 | 7 天+ |

评分后自动跳转下一题，形成无缝复习流。

### 📊 六大题库

| 题库 | 覆盖范围 |
|------|----------|
| 🔥 力扣 Hot 100 | 题号 + 题目描述 + 解题思路 + Python 实现 |
| 📊 统计学 | 描述统计 / 概率论 / 假设检验 / 贝叶斯 / AB 实验 / 因果推断 / 时间序列 / 生存分析 / 实验设计 / 大数据统计 |
| 🤖 机器学习 | 监督 / 无监督 / 集成 / 深度学习 / NLP / 强化学习 / GNN / 生成模型 / 推荐系统 / MLOps / 特征工程 / 模型评估 |
| 🧠 大模型 | Transformer / 训练微调 / 推理部署 / Agent / RAG / 评估安全 |
| 💬 行业黑话 | 对齐颗粒度、赋能、闭环、飞轮效应等互联网面试常考术语 |
| 👔 职场话术 | 向上沟通、跨部门协作、面试技巧、项目汇报模板 |

### ✏️ 卡片管理 (CRUD)

内置内容管理系统，无需手动编辑数据文件：

- **新增卡片** — 指定题库、添加题目 / 答案 / 代码 / 思路
- **编辑卡片** — 实时修改内容，自动保存
- **删除卡片** — 一键移除，支持批量操作
- **搜索筛选** — 按内容、题库、收藏状态快速定位
- **CSV 导入 / 导出** — 批量导入自定义题库，导出分享

### 🎹 全键盘操作

| 快捷键 | 功能 |
|--------|------|
| `←` `→` | 翻页 |
| `Space` | 显示 / 隐藏答案 |
| `S` `C` | 显示 / 隐藏思路 / 代码 |
| `1` – `5` | 评分 |
| `M` | 标记已掌握 |
| `F` | 收藏卡片 |
| `D` | 切换深色模式 |
| `/` | 搜索 |
| `Esc` | 关闭面板 |

### 🌗 深色模式

全组件深色适配 — 代码块、统计面板、评分按钮、卡片，一键切换。

### 📝 Markdown + LaTeX

答案支持完整 Markdown 排版和数学公式：

```markdown
### 置信区间

$CI = \\bar{x} \\pm z_{\\alpha/2} \\cdot \\frac{\\sigma}{\\sqrt{n}}$

其中 $\\bar{x}$ 为样本均值，$\\sigma$ 为标准差，$n$ 为样本量。
```

- KaTeX 渲染引擎，支持 LaTeX 完整语法
- 公式自动与中文分离，独占一行居中
- 行内公式 `$...$` / 块公式 `$$...$$`

### 💾 本地存储 + 跨设备同步

- 数据文件：`~/Documents/interview-flashcards/data.json`
- **Tauri 模式** — Rust 文件 I/O，直接读写本地 JSON
- **浏览器模式** — File System Access API，支持选择任意文件路径
- 放入 iCloud / Dropbox 即可多设备自动同步
- 支持 JSON 导出备份和恢复

---

## 技术栈

| 层级 | 技术选型 |
|------|----------|
| UI 框架 | React 19 + TypeScript |
| 构建工具 | Vite 8 |
| 样式方案 | TailwindCSS v4 |
| 数学渲染 | react-markdown + remark-math + rehype-katex |
| 图标库 | lucide-react |
| 桌面框架 | Tauri v2 (Rust) |
| 数据持久化 | 本地 JSON 文件 (Tauri fs / File System Access API) |
| 间隔重复 | SM-2 算法 + ReviewLog 持久化 |
| CI/CD | GitHub Actions (macOS arm64/x64, Windows, Linux) |

## 架构

```
┌─────────────────────────────────────────────────────┐
│              面经闪卡.app (9.5 MB)                    │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │         Web 前端 (React + TypeScript)        │   │
│  │  ┌─────────┐ ┌──────────┐ ┌────────────┐   │   │
│  │  │ 卡片渲染 │ │ 评分交互  │ │ 搜索/筛选   │   │   │
│  │  ├─────────┤ ├──────────┤ ├────────────┤   │   │
│  │  │ Markdown│ │ 数学公式 │ │ 遗忘曲线    │   │   │
│  │  │ 渲染    │ │ KaTeX    │ │ 可视化      │   │   │
│  │  └─────────┘ └──────────┘ └────────────┘   │   │
│  │  ┌──────────────────────────────────────┐   │   │
│  │  │ 状态管理: AppContext + useReducer     │   │   │
│  │  │ SM-2 算法 / ReviewLog / 卡片 CRUD     │   │   │
│  │  └──────────────────────────────────────┘   │   │
│  └──────────────────┬──────────────────────────┘   │
│                     │ IPC (Tauri invoke)            │
│  ┌──────────────────▼──────────────────────────┐   │
│  │    Rust 后端 (Tauri v2)                     │   │
│  │    read_data() / write_data()               │   │
│  └──────────────────┬──────────────────────────┘   │
│                     │                               │
│  ┌──────────────────▼──────────────────────────┐   │
│  │  ~/Documents/interview-flashcards/data.json  │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## 从源码构建

### 前置依赖

- **Node.js** 22+
- **Rust** 1.77+
- **macOS**: Xcode Command Line Tools
- **Windows**: Visual Studio Build Tools（C++ 桌面工作负载）
- **Linux**: `libwebkit2gtk-4.1-dev` `libappindicator3-dev`

### 构建命令

```bash
git clone https://github.com/lzzzhh/interview-flashcards.git
cd interview-flashcards
npm install

# 构建桌面安装包
npm run build:desktop
# 输出: src-tauri/target/release/bundle/

# 浏览器开发（热重载）
npm run dev

# 桌面开发（热重载 + 原生窗口）
npm run dev:desktop
```

---

## 许可证

MIT License
