# 📚 面经闪卡 — Interview Flashcards

[![Build Desktop Apps](https://github.com/your-username/interview-flashcards/actions/workflows/build.yml/badge.svg)](https://github.com/your-username/interview-flashcards/actions/workflows/build.yml)

> Active Recall + Spaced Repetition = 肌肉记忆级面试准备

一个 **Anki 风格**的面试复习闪卡桌面应用。先看题回忆答案，再揭示；SM-2 算法 + 艾宾浩斯遗忘曲线自动调度复习。547 张高质量卡片覆盖力扣、统计学、机器学习、大模型、行业黑话、职场话术六大题库。

---

## 一键安装

```bash
curl -fsSL https://raw.githubusercontent.com/your-username/interview-flashcards/main/install.sh | bash
```

或手动下载 [GitHub Releases](https://github.com/your-username/interview-flashcards/releases) 中对应平台的安装包。

| 平台 | 安装包 |
|------|--------|
| 🍎 macOS (Apple Silicon) | `面经闪卡_aarch64.dmg` |
| 🍎 macOS (Intel) | `面经闪卡_x86_64.dmg` |
| 🪟 Windows | `面经闪卡_x64-setup.exe` |
| 🐧 Linux | `.AppImage` / `.deb` / `.rpm` |

---

## 功能

### 🧠 Active Recall 主动回忆
- **先看题，再揭示答案** — 所有非力扣卡片默认隐藏答案
- 思路和代码独立开关，避免一次性剧透
- 点击「显示答案」或按 **Space** 键揭示

### 📅 SM-2 间隔重复 + 艾宾浩斯曲线
- 基于 SM-2 算法自动计算下次复习时间
- 统计面板内置遗忘曲线可视化
- 复习模式：只看到期卡片，评分后自动跳下一题

### 🎮 Anki 风格评分
- 五级评分：忘了 / 困难 / 一般 / 顺利 / 秒答
- 每个按钮预显示下次复习间隔（如「7天」「1月」）
- 评分完自动跳到下一题，无缝复习流

### 📊 六大题库 · 547 张卡片

| 题库 | 数量 | 内容 |
|------|------|------|
| 🔥 力扣 Hot 100 | 100 道 | 题号+描述+思路+代码，全 Python |
| 📊 统计学 | 162 道 | 描述统计/概率论/假设检验/贝叶斯/AB实验/因果推断/时间序列/生存分析 |
| 🤖 机器学习 | 155 道 | 监督/无监督/集成/深度/NLP/RL/GNN/生成模型/推荐系统/MLOps |
| 🧠 大模型 | 43 道 | Transformer/训练微调/推理部署/Agent/RAG/评估安全 |
| 💬 行业黑话 | 45 道 | 对齐颗粒度/赋能/闭环/飞轮效应... |
| 👔 职场话术 | 42 道 | 向上沟通/跨部门/面试技巧/项目汇报... |

### 🎹 键盘快捷键

| 键 | 功能 |
|------|------|
| ← → | 翻页 |
| Space | 显示/隐藏答案 |
| S / C | 显示/隐藏代码 |
| 1-5 | 评分（忘了→秒答） |
| M | 标记掌握 |
| F | 收藏 |
| D | 深色模式 |
| / | 聚焦搜索 |
| Esc | 关闭统计面板 |

### 🌗 深色模式
- 代码块自动适配浅色/深色主题
- 统计面板、卡片、按钮全量适配

### 📝 Markdown + 数学公式
- 答案支持 Markdown 排版（标题/列表/表格/代码块）
- `$...$` 行内公式、`$$...$$` 块公式
- 中文段落和数学公式自动分离，公式独占一行居中
- KaTeX 渲染，支持 LaTeX 语法

### 💾 本地文件存储
- 数据保存在 `~/Documents/interview-flashcards/data.json`
- 放到 iCloud/Dropbox 文件夹即可跨设备自动同步
- 支持导出/导入 JSON 备份

---

## 从源码构建

### 前提

- Node.js 22+
- Rust 1.77+
- macOS: Xcode Command Line Tools
- Windows: Visual Studio Build Tools（C++ 桌面开发）
- Linux: `sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev`

### 构建

```bash
git clone https://github.com/your-username/interview-flashcards.git
cd interview-flashcards
npm install
npm run build:desktop
# 安装包在 src-tauri/target/release/bundle/ 下
```

### 开发模式（浏览器预览）

```bash
npm run dev
# → http://localhost:3000
```

### 开发模式（桌面窗口 + 热重载）

```bash
npm run dev:desktop
```

---

## 技术栈

| 层 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite 8 |
| 样式 | TailwindCSS v4 |
| 数学渲染 | react-markdown + remark-math + rehype-katex |
| 图标 | lucide-react |
| 桌面框架 | Tauri v2 (Rust) |
| 存储 | 本地 JSON 文件 |
| 间隔重复 | SM-2 算法 |

---

## 架构

```
面经闪卡.app (9.5MB)
├── Web 前端 (React + TypeScript)
│   ├── 卡片渲染、评分交互
│   ├── Markdown + LaTeX 渲染
│   └── SM-2 算法、艾宾浩斯曲线
├── Rust 后端 (文件 I/O)
│   ├── read_data()  → ~/Documents/interview-flashcards/data.json
│   └── write_data() → ~/Documents/interview-flashcards/data.json
└── 数据流: 前端 ↔ IPC ↔ Rust ↔ 本地文件
```

## 许可证

MIT
