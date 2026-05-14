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
  <img src="icon.png" width="128" alt="面经闪卡图标" />
</p>

<p align="center">
  Active Recall + SM-2 间隔重复驱动的面试复习桌面应用。<br>
  686 张内置卡片覆盖算法 · 统计学 · 机器学习 · 深度学习 · 大模型 · Agent · 行业黑话 · 职场话术。<br>
  支持自定义题库、难度配比学习、每日新卡上限、本地文件同步和 Tauri 原生桌面体验。
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
| 🪟 Windows | NSIS `.exe` 安装包 |
| 🐧 Linux | `.deb` 安装包 |

---

## 功能亮点

### 🧠 主动回忆 + 间隔重复

卡片默认隐藏答案，先回忆、再揭示，模拟真实面试中的检索过程。算法题支持「思路」和「代码」独立展开，问答题支持 Markdown + LaTeX 渲染。

- **增强版 SM-2 调度** — 记录 `new / learning / review / relearning` 状态、间隔、遗忘次数和 ease factor
- **到期复习队列** — 复习模式只展示已经到期的卡片，新卡模式只展示未学习卡片
- **评分后自动前进** — 1-5 分评分会更新下次复习时间，并自动进入下一张
- **撤回上次评分** — 支持 `Ctrl/Cmd + Z` 回滚最近一次评分
- **掌握 / 收藏 / 随机顺序** — 常用复习操作集中在卡片底部工具栏

### 🎮 五级评分系统（带间隔预览）

| 评分 | 含义 | 预期间隔 |
|------|------|----------|
| 1 — 忘了 | 完全忘记，进入 relearning | 约 1 天 |
| 2 — 困难 | 记得一点，降低 ease factor | 当前间隔约 50% |
| 3 — 一般 | 大部分正确 | 稳步进入复习 |
| 4 — 顺利 | 正确且轻松 | 更长间隔 |
| 5 — 秒答 | 秒答正确 | 最长间隔 |

评分按钮会实时显示下一次复习间隔，例如 `<1天`、`3天`、`2周`、`1月`。

### 🎯 新卡学习控制

每个模块都有独立的新卡学习节奏，避免一次性塞太多题。

- **模块每日新卡上限** — 首页展示每个模块的每日新卡数和今日待复习数
- **统计面板滑块设置** — 每个内置模块和自定义模块都能单独设置 1-100 张每日新卡上限
- **难度配比选择器** — 力扣、统计、机器学习、深度学习、大模型、Agent 支持按简单 / 中等 / 困难挑选新卡
- **自动分配 / 均分 / 手动加减** — 开始新卡前可以快速调整今日学习结构

### 📊 八大内置模块

当前内置 686 张面试闪卡，并支持继续扩展自定义模块。

| 模块 | 数量 | 覆盖范围 |
|------|------|----------|
| 🔥 力扣 | 100 | Hot 100 题号、题目描述、解题思路、Python 实现、难度标签 |
| 📊 统计学 | 199 | 描述统计、概率论、假设检验、贝叶斯、回归分析、实验设计等 |
| 🤖 机器学习 | 171 | 监督 / 无监督、集成学习、特征工程、评估指标、优化、推荐、MLOps 等 |
| 🧩 深度学习 | 32 | 深度学习基础、神经网络训练、生成模型等 |
| 🧠 大模型 | 42 | Transformer、训练微调、推理部署、RAG、评估安全等 |
| 🤖 Agent | 21 | Agent 架构、工具调用、记忆、规划、评估等 |
| 💬 黑话 | 45 | 互联网黑话、职场术语、面试表达和语境解释 |
| 👔 职场 | 76 | 向上沟通、跨部门协作、项目管理、面试技巧 |

### ✏️ 自定义模块 + 卡片管理

内置卡片管理界面，不需要手动改源码或数据文件。

- **新建模块** — 自定义模块名称、图标和每日新卡上限
- **删除模块** — 首页可直接移除不再需要的自定义题库
- **新增卡片** — 指定题库、添加题目 / 答案 / 代码 / 思路
- **编辑卡片** — 实时修改内容，自动保存
- **删除卡片** — 卡片管理页二次确认删除
- **搜索筛选** — 按题目、答案、题号、标签快速定位
- **CSV / JSON 导入导出** — 支持批量导入题库、导出当前筛选结果

### 📈 学习统计面板

统计面板集中展示学习进度、复习压力和数据存储状态。

- 总卡片、已掌握、到期复习、今日可学新卡
- 今日复习数、连续天数、7 日正确率、平均评分、薄弱卡片
- 复习阶段分布与艾宾浩斯遗忘曲线
- 模块每日新卡上限设置
- JSON 备份导入 / 导出，本地文件模式状态查看

### 🎹 快捷键与手势

| 快捷键 | 功能 |
|--------|------|
| `←` `→` | 翻页 |
| `Space` | 显示 / 隐藏答案或思路 |
| `S` / `C` | 显示 / 隐藏代码 |
| `1` – `5` | 评分 |
| `M` | 标记已掌握 |
| `F` | 收藏卡片 |
| `D` | 切换深色模式 |
| `/` | 搜索 |
| `Ctrl/Cmd + Z` | 撤回上次评分 |
| `Esc` | 关闭统计面板 / 退出输入焦点 |

首页模块页还支持左右方向键、分页按钮、触控滑动、触控板横向滚动和鼠标拖拽翻页。

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
- **浏览器模式** — localStorage fallback，可连接 File System Access API 数据文件
- **跨设备同步** — 将数据 JSON 放入 iCloud / Dropbox / OneDrive 等同步目录即可
- **兼容备份** — 支持 JSON 导出和恢复

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

<p align="center">
  <img src="docs/assets/architecture.png" alt="面经闪卡项目架构图" width="920">
</p>

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
