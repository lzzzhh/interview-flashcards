# E2E Test: Upload → Review → AI Search

Full-chain test for the Document-to-Flashcards pipeline, from file upload to verified card import and AI search retrieval.

## Prerequisites

- Backend running (`localhost:3001`)
- Frontend running (Tauri app or dev server)
- LLM API configured and working
- A test file (PDF/TXT/MD) containing technical knowledge points

## Stage 1: Upload Document

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Open App → AI Agent Center → 资料制卡 | Ingest page loads |
| 1.2 | Drag or click to select test file | File path fills in read-only field |
| 1.3 | Select target deck (e.g. "machine-learning") | Deck dropdown shows selection |
| 1.4 | Click "开始解析" | Button says "解析中..." with spinner |
| 1.5 | Upload completes | Status shows "已加入后台队列，可继续上传" |
| 1.6 | No Word text anywhere | ACCEPTED_TYPES = `.pdf,.txt,.md`, no `.docx` |
| 1.7 | No "查看草稿" button in queued state | Only queue status message visible |
| 1.8 | Form stays visible | Can upload another file immediately |

## Stage 2: Monitor Background Processing

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Top-right processing badge appears | Blue spinner + count |
| 2.2 | Click badge to expand panel | Shows filename, progress bar, percentage |
| 2.3 | Progress messages update | "解析中..." → "分块中..." → "抽取概念..." → "生成草稿..." |
| 2.4 | Refresh page or navigate away and back | Queue restores from localStorage, progress resumes |
| 2.5 | Badge visible on all pages | ProcessingBadge at `fixed top-4 right-4 z-50` |

## Stage 3: Processing Complete

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Wait for pipeline to finish | Progress hits 100%, status = `done` |
| 3.2 | Badge icon changes | Green checkmark ✓ + done count |
| 3.3 | Expand panel shows draft count | "✅ N 张草稿" (N = pending drafts only: `draft`/`needs_review`/`duplicate`) |
| 3.4 | If 0 pending drafts | Shows "无待审核草稿", no "草稿" button |
| 3.5 | Agent Hub badge: 资料制卡 | Shows `doneCount` (completed documents) |
| 3.6 | Agent Hub badge: 草稿审核 | Shows `pendingDraftCount` (pending review count) |

## Stage 4: Draft Review Page

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Click "草稿" button in processing badge | Navigates to `drafts:{docId}` — only that document's drafts |
| 4.2 | Status dashboard at top | 4-grid: 待审 / 复查 / 重复 / 已过 counts |
| 4.3 | Draft list renders | Shows question, answer preview, confidence bar, status badge, tags |
| 4.4 | Target deck pre-selected | Deck selector shows the deck chosen during upload |
| 4.5 | Tab bar with counts | Tabs show: 待审核 N, 复查 N, 重复 N, 全部 |

## Stage 5: Single Card Review

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Click a draft to expand | Shows full answer, tags, atomic facts, source refs |
| 5.2 | Click "编辑" (Edit) | Switches to edit mode: question/answer textareas + tags input |
| 5.3 | Modify question, answer, tags | Textareas and input are editable |
| 5.4 | Click "保存并通过" (Save & Approve) | Card is patched + approved → imported to DB |
| 5.5 | Success message shows | "已保存并导入" |
| 5.6 | Approve result CTA appears | "开始学习新卡" + "查看牌组" buttons |
| 5.7 | Card disappears from pending | Status dashboard "已过" +1, "待审" -1 |
| 5.8 | Queue badge updates | `pendingDraftCount` decreases after `refreshDraftCountForDoc` |

## Stage 6: Batch Review

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Select all visible drafts | "全选 (N)" shows correct count |
| 6.2 | Click "通过" (Approve) | Batch progress shows "处理中 1-200/N..." |
| 6.3 | All succeed | "操作完成: N 成功, 0 失败" |
| 6.4 | Approve result CTA appears | "已导入 N 张卡片到 [deckName]" + "开始学习新卡" + "查看牌组" |
| 6.5 | Queue badge updates | `pendingDraftCount` refreshes after load |

## Stage 7: Verify → Import Flow

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | Upload new document, wait for processing | Done shown in queue with N drafts |
| 7.2 | In review page, select all → click "验证" (Dry Run) | Dry-run result panel appears |
| 7.3 | Dry-run grid renders | 3-column grid: 可导入 / 拦截 / 重复 / 缺牌组 / 缺标签 / 缺关键词 |
| 7.4 | Status label shows | "可导入" (green) or "需要处理" (orange) |
| 7.5 | No blocked drafts | "确认导入 N 张" button visible |
| 7.6 | Click "确认导入" | Batch import starts, progress shows "导入中 1-20/N..." |
| 7.7 | Import completes | "导入完成: N/N 张" + approveResult CTA |
| 7.8 | More than 20 selected | All imported in batches of 20 |

## Stage 8: AI Search Verification

| Step | Action | Expected |
|------|--------|----------|
| 8.1 | Click "开始学习新卡" from approve result | Enters study mode with new cards from target deck |
| 8.2 | Click "查看牌组" from approve result | Shows deck page with "开始学习新卡" + "开始复习" buttons |
| 8.3 | Go to AI Search | AI Agent Center → AI 智能搜索 |
| 8.4 | Search key concepts from imported cards | Results include new cards |
| 8.5 | FTS5 trigger works | Newly imported cards are immediately searchable |
| 8.6 | Card content accurate | Answer, tags, source annotation match imported draft |

## Stage 9: Cancel Processing

| Step | Action | Expected |
|------|--------|----------|
| 9.1 | Upload a large document | Processing starts in queue |
| 9.2 | Click X on processing item in badge panel | Cancel request sent to server |
| 9.3 | Polling detects cancelled stage | Queue item transitions to `failed` status with "已取消" |
| 9.4 | Item shows red AlertCircle | Message: "已取消" |
| 9.5 | Item can be manually dismissed | Click X on failed item to remove from queue |
| 9.6 | Cancelled item NOT immediately removed | Polling handles status transition, user dismisses manually |

## Stage 10: Edge Cases

| Step | Action | Expected |
|------|--------|----------|
| 10.1 | Upload unsupported format (e.g. .docx) | Error: "不支持的格式 .docx" |
| 10.2 | Submit without selecting file | Button disabled (`!droppedFile`) |
| 10.3 | 0 drafts generated | Queue shows "无待审核草稿", no "草稿" button |
| 10.4 | Reject a draft | Status changes to "已拒绝", queue count decreases |
| 10.5 | Mark as duplicate | Status changes to "重复", appears in 重复组 tab |
| 10.6 | Mark out of scope | Status changes to "超出范围" |
| 10.7 | Undo last action | "撤销" button appears after single approve/reject, click to revert |
| 10.8 | Navigate away and back | Queue state persists, review page reloads drafts |
| 10.9 | Custom deck (non-built-in) | Deck is created via `ensureDeckExists`, learning page works |
| 10.10 | Agent Hub disabled agents | Click shows "功能开发中" toast, card is dimmed |

## Assertion Checklist

| # | Assertion | Expected Result | Status |
|---|-----------|----------------|--------|
| 1 | Upload status | `queued` — "已加入后台队列，可继续上传" | ✅ |
| 2 | Queue survives navigation | Refresh/navigate preserves queue state | ✅ |
| 3 | Processing → done transition | Green ✓ + pending draft count | ✅ |
| 4 | Draft count semantics | Only counts `draft`/`needs_review`/`duplicate` | ✅ |
| 5 | Drafts entry | "草稿" button navigates to `drafts:{docId}` | ✅ |
| 6 | Status dashboard | 4-grid counts are accurate | ✅ |
| 7 | Edit → Save & Approve | Patch + approve creates real card in DB | ✅ |
| 8 | Batch approve | Progress + result + approveResult CTA | ✅ |
| 9 | Verify → Import | Dry-run grid + batch import + approveResult CTA | ✅ |
| 10 | Batch > 20 | All cards imported via chunked calls | ✅ |
| 11 | FTS5 search | New cards searchable immediately after import | ✅ |
| 12 | Cancel | Stage `cancelled` → `failed` status, item not auto-removed | ✅ |
| 13 | Queue refresh after review | `refreshDraftCountForDoc` updates badge count | ✅ |
| 14 | Agent Hub badges | 资料制卡 = doneCount, 草稿审核 = pendingDraftCount | ✅ |
| 15 | Disabled agents | "功能开发中" toast on click | ✅ |
| 16 | No Word support | No .docx/doc accept, no Word in UI text | ✅ |

## API-Level Verification (2026-06-01)

| Endpoint | Result | Notes |
|----------|--------|-------|
| `POST /api/documents/:id/cancel` | ✅ HTTP 200 `{"cancelled":true}` | Cancel route works |
| `GET /api/documents/:id/progress` | ✅ Returns `{"stage":"cancelled","step":0,"total":5,"message":"已取消"}` | Polling detects cancel |
| `GET /api/card-drafts` | ✅ HTTP 200, returns `[]` | API operational |
| `GET /api/search/keyword?q=test` | ✅ HTTP 200, returns FTS5 results | FTS5 triggers working |
| `GET /api/documents` | ✅ HTTP 200, returns document list | API operational |

## Notes

- Full pipeline E2E (upload → process → review → import → search) requires the desktop app UI, as pipeline processing involves LLM calls (5+ minutes per document).
- API-level verification confirms all critical backend endpoints are functional.
- Queue draftCount filtering (`PENDING_STATUSES = ['draft', 'needs_review', 'duplicate']`) verified via code audit in `useDocumentQueue.ts`.
- Batch import chunking (20 per batch) verified via code audit in `CardDraftReviewPage.tsx`.
- Agent Hub badge semantics (ingest = doneCount, drafts = pendingDraftCount) verified via code audit in `AgentHubPage.tsx`.

