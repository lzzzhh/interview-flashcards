# 多语言代码支持 — 优化方案

## 目标

力扣卡片当前仅支持 Python 代码，且以纯文本方式渲染。本次优化将其升级为：

1. 覆盖力扣支持的所有主流语言
2. 代码块语法高亮
3. 语言标签切换，一键切换查看不同语言实现

---

## 支持的语言

覆盖力扣前 9 大主流面试语言：

| 语言 | 标识符 | 优先级 | 备注 |
|------|--------|--------|------|
| Python | `python` | P0 | 已有，需迁移 |
| Java | `java` | P0 | 面试最常见 |
| C++ | `cpp` | P0 | 算法竞赛/大厂 |
| JavaScript | `javascript` | P0 | 前端/全栈 |
| Go | `go` | P1 | 云原生/后端 |
| TypeScript | `typescript` | P1 | 前端进阶 |
| Rust | `rust` | P1 | 系统编程/新兴 |
| C# | `csharp` | P2 | 微软生态 |
| Kotlin | `kotlin` | P2 | Android |

P0 为必须覆盖，P1 建议覆盖，P2 可选。

---

## 数据层改造

### 1. 类型定义（`src/types/index.ts`）

```diff
 export interface LeetCodeCard {
   id: string;
   category: 'leetcode';
   number: number;
   title: string;
   titleCn: string;
   difficulty: Difficulty;
   tags: string[];
   description: string;
   approach: string;
-  code: string;
+  codes?: Record<string, string>;  // { python: "...", java: "...", javascript: "..." }
   sm2: SM2Record;
   favorited: boolean;
+  defaultLanguage?: string;        // 默认显示的语言，缺省为 "python"
 }
```

- `codes` 以语言标识符为 key，代码为 value
- 删除原有 `code` 字段（数据迁移时自动转为 `codes.python`）
- `defaultLanguage` 用于用户自定义默认偏好

### 2. 数据迁移策略

**迁移脚本（`scripts/migrate-v0.4-to-v0.5.ts`）：**

```
当前格式 → codes.python = code → 写入 codes 字段 → 删除 code 字段
```

现有 sm2 进度数据不受影响，只修改卡片定义。

### 3. 补充代码方案

100 道力扣题，每道补 P0 语言（Python/Java/JavaScript/C++/Go）约 **500 段代码**。三种补充策略：

| 方案 | 成本 | 准确性 | 推荐度 |
|------|------|--------|--------|
| **A. AI 批量生成** | 低 | 中高 | ⭐ 推荐 |
| B. 逐题手动录入 | 极高 | 高 | 不推荐 |
| C. 社区贡献 | 低 | 中 | 可长期采用 |

**推荐方案 A：** 写一个脚本，对每道题用 LLM 根据题目描述 + 现有 Python 代码，生成 Java/JS/C++/Go 实现，自动写入数据文件。

---

## UI 层改造

### 1. 语法高亮

当前代码在 `<pre><code>` 中纯文本渲染：

```tsx
<pre className="...">
  <code>{card.code}</code>
</pre>
```

改为使用 **highlight.js**（轻量、无运行时开销）：

```bash
npm install highlight.js
```

新增代码块组件 `CodeBlock.tsx`：

```tsx
import hljs from 'highlight.js';

function CodeBlock({ code, language }: { code: string; language: string }) {
  const highlighted = hljs.highlight(code, { language }).value;
  return (
    <pre className="...">
      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
    </pre>
  );
}
```

### 2. 语言切换标签（CardView.tsx）

在代码折叠区域上方增加语言标签栏：

```
┌──────────────────────────────┐
│  📝 显示代码                  │
├──────────────────────────────┤
│  [Python] [Java] [JS] [C++]  │  ← 语言标签
├──────────────────────────────┤
│  def twoSum(nums, target):   │
│      seen = {}               │  ← 高亮代码
│      ...                     │
└──────────────────────────────┘
```

逻辑：

- 仅当 `Object.keys(card.codes).length > 1` 时显示标签栏
- 第一个标签高亮为当前选中语言
- 切换标签时保留折叠状态

### 3. CardEditor 改造

当前编辑器只支持 QA 卡片的编辑，未支持 LeetCode 卡片的 `description`/`approach`/`code`。

改造后：

```
┌─ 分类: [LeetCode] ──────────────────┐
│  题号: [1]  难度: [Easy]             │
│  标题: [Two Sum]  中文: [两数之和]    │
│  描述: [···]                         │
│  思路: [···]                         │
├─ 代码 ───────────────────────────────┤
│  [+ 添加语言]                        │
│  ┌ Python ───────────────────────┐   │
│  │ def twoSum(...):              │   │
│  │   ...                         │   │
│  └───────────────────────────────┘   │
│  ┌ Java ─────────────────────────┐   │
│  │ public int[] twoSum(...) {    │   │
│  │   ...                         │   │
│  └───────────────────────────────┘   │
└──────────────────────────────────────┘
```

---

## 其他数据文件

本次改造仅涉及 `src/data/leetcode-hot100.ts`，其他模块（统计学/ML/大模型等）的问答卡片不受影响。

---

## 实现步骤

| 步骤 | 内容 | 预估工时 |
|------|------|----------|
| 1 | 安装 highlight.js，创建 CodeBlock 组件 | 0.5h |
| 2 | 修改 LeetCodeCard 类型，添加 codes 字段 | 0.5h |
| 3 | 改造 CardView，添加语言标签切换 | 1h |
| 4 | 改造 CardEditor，支持 LeetCode 卡片编辑 | 2h |
| 5 | 编写数据迁移脚本（code → codes.python） | 0.5h |
| 6 | 批量生成 P0 语言代码（Java/JS/C++/Go） | LLM 脚本自动化 |
| 7 | 验收：100 道题每种语言代码可正常渲染 | 1h |

---

## 文件改动清单

```
src/types/index.ts              # LeetCodeCard 类型
src/components/CardView.tsx      # 语言标签 + 代码高亮
src/components/CardEditor.tsx    # LeetCode 卡片编辑
src/components/CodeBlock.tsx     # [新增] 语法高亮代码块
src/data/leetcode-hot100.ts      # 补充多语言代码
scripts/migrate-v0.4-to-v0.5.ts  # [新增] 数据迁移脚本
package.json                     # 添加 highlight.js 依赖
```
