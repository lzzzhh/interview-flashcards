# Interview Flashcards

<p align="center">
  <a href="https://github.com/lzzzhh/interview-flashcards/actions/workflows/build.yml"><img src="https://github.com/lzzzhh/interview-flashcards/actions/workflows/build.yml/badge.svg" alt="Build"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri" alt="Tauri v2">
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss" alt="TailwindCSS v4">
  <img src="https://img.shields.io/badge/Fastify-5-000000?logo=fastify" alt="Fastify">
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma" alt="Prisma">
</p>

<p align="center">
  <img src="icon.png" width="128" alt="Interview Flashcards icon" />
</p>

<p align="center">
  A desktop flashcard app for interview preparation, powered by Active Recall and SM-2 spaced repetition.<br>
  <b>AI Semantic Search</b> . <b>Document-to-Flashcards</b> . <b>Learning Plans</b><br>
  Built-in card coverage: Algorithms . Statistics . Machine Learning . Deep Learning . LLM . Agent . Vibe Coding . Industry Jargon . Workplace Communication.
</p>

---

## Quick Start

```bash
curl -fsSL https://raw.githubusercontent.com/lzzzhh/interview-flashcards/main/install.sh | bash
```

Or download from [Releases](https://github.com/lzzzhh/interview-flashcards/releases):

| Platform | Package |
|----------|---------|
| macOS (Apple Silicon) | DMG installer |
| macOS (Intel) | DMG installer |
| Windows | NSIS `.exe` installer |
| Linux | `.deb` package |

---

## Features

### Home Page

Mobile-first single-column layout with Today's Tasks, Recommended Study, and a compact My Decks preview. The full deck list is available from the All Decks page.

- **Today's Tasks**: Real-time stats for review / new cards / in-progress, one-click daily study start
- **Recommended Study**: SM-2 algorithm intelligently recommends cards needing review, supports swipe and tap navigation
- **My Decks**: Preview of the first 6 built-in modules with review/new card counts
- **Bottom Tab Bar**: Home / All Decks / Stats / Agent / Profile

### Active Recall + Spaced Repetition

Cards hide answers by default -- recall first, then reveal. Algorithm cards support independent "Approach" and "Code" sections. Q&A cards support Markdown + LaTeX rendering.

- **SM-2 Scheduling**: Tracks `new / learning / review / relearning` states; scheduling runs locally first, with backend review logging when available
- **Five-level Rating System**: Buttons show real-time predicted intervals: `<1d`, `3d`, `2w`, `1m`
- **Due Review Queue**: Review mode only shows due cards; new card mode has daily limit control
- **Undo Last Rating**: `Ctrl/Cmd + Z` to rollback

### Nine Built-in Modules

| Module | Coverage |
|--------|----------|
| LeetCode | Hot 100 |
| Statistics | Descriptive stats, probability, hypothesis testing, Bayesian |
| Machine Learning | Supervised/unsupervised, ensemble methods, feature engineering |
| Deep Learning | Neural network training, generative models |
| LLM | Transformers, RAG, training & fine-tuning |
| Agent | Agent architecture, tool calling, memory |
| Vibe Coding | /command, Skill, Agent Team, MCP, Hooks |
| Jargon | Internet slang, industry terminology |
| Workplace | Upward communication, interview techniques |

### Document-to-Flashcards

Upload PDF, TXT, or Markdown files. The app processes documents in a global background queue, extracts concepts via LLM, generates Chinese flashcard drafts, and lets users review, edit, validate, and batch-import cards into selected decks.

- **Background Queue**: Uploads go into a global processing queue with real-time progress tracking. The queue persists across navigation and page refreshes.
- **Draft Review Page**: Status dashboard (pending / needs-review / duplicate / approved counts), custom deck selector, dry-run validation, confidence-sorted card list
- **Edit & Approve**: Edit question, answer, and tags inline before importing. Single or batch approve/reject/mark-duplicate/mark-out-of-scope
- **Batch Import**: Select all drafts, validate via dry run, then import in batches. Supports more than 20 cards at once.
- **Post-import CTA**: After importing, direct links to start learning new cards or view the target deck

### AI Semantic Search

Semantic search with multi-channel recall and smart ranking, supporting Chinese natural language queries.

- **Multi-channel Recall**: FTS5 full-text search + tag matching + search keyword matching + vector similarity
- **Smart Ranking**: Field weighting + learning state boost + deck match scoring
- **Embeddings**: Supports OpenAI-compatible embedding APIs and local Ollama bge-m3. Falls back to local n-gram vectors if no embedding provider is configured.
- **Semantic Understanding**: Synonyms, mixed Chinese/English, natural language queries

### AI Learning Plans

After searching, input a learning intent (e.g. "learn decision trees", "master SVM"). AI automatically selects relevant cards and sorts by learning priority to generate a study plan. Plans are saved locally and accessible under Profile > Learning Plans.

### Study Statistics

Dedicated stats page showing:

- Total cards, mastered, pending review
- Streak days, today's learned
- Mastery rate progress bar, review stage distribution
- Module distribution progress bars
- Daily new card limit (collapsible)

### Profile & Data Management

- **Data Storage**: JSON / CSV export and import for cards and custom decks
- **Learning Plans**: View and manage saved study plans
- **API Settings**: Configure LLM base URL, API key, and model
- **Tag Management**: Cross-module tag listing, rename, merge, and delete operations

### Agent Hub

Currently available: AI Search, Document-to-Flashcards, Draft Review. Job Preparation, Mock Interview, and Resume Project are shown as disabled placeholders.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` `→` | Navigate cards |
| `Space` | Show / hide answer |
| `1` – `5` | Rate card |
| `D` | Toggle dark mode |
| `Ctrl/Cmd + Z` | Undo rating |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite 8 |
| Styling | TailwindCSS v4 + CSS variable theming |
| Math Rendering | react-markdown + KaTeX |
| Icons | lucide-react |
| Desktop Framework | Tauri v2 (Rust) |
| Backend API | Fastify + Prisma + SQLite |
| Vector Embeddings | OpenAI-compatible API / Ollama bge-m3 / local n-gram fallback |
| Full-text Search | SQLite FTS5 + Chinese bigram tokenizer |
| Spaced Repetition | SM-2 algorithm (local-first, backend logging when available) |
| CI/CD | GitHub Actions (macOS / Windows / Linux) |

## Architecture

<p align="center">
  <img src="docs/assets/architecture.png" alt="Project architecture diagram" width="920">
</p>

```
+-----------------------------------------------------------+
|                    Tauri Desktop Shell                     |
|  +-----------------------------------------------------+  |
|  |              React Frontend (SPA)                    |  |
|  |  +-----------+ +--------+ +----------------------+  |  |
|  |  | HomePage  | |CardView| | Stats / Deck /       |  |  |
|  |  |           | |        | | Profile / Search     |  |  |
|  |  +-----+-----+ +---+----+ +----------+-----------+  |  |
|  |        |            |                |               |  |
|  |  +-----v------------v----------------v-----------+   |  |
|  |  |         Repository / API Client              |   |  |
|  |  +---------------------+------------------------+   |  |
|  +-------------------------+----------------------------+  |
|                            |                               |
|  +-------------------------v----------------------------+  |
|  |         Native Storage (Rust fs / localStorage)     |  |
|  +-----------------------------------------------------+  |
+-----------------------------------------------------------+
                            |
                            v
+-----------------------------------------------------------+
|               Backend API (Fastify :3001)                  |
|  +----------+ +--------+ +----------+ +---------+         |
|  | /api/    | | /api/  | | /api/    | | /api/   |         |
|  |  decks   | | cards  | | reviews  | | study   |         |
|  +----+-----+ +---+----+ +----+-----+ +----+----+         |
|  +----+-----+ +----+-----------------------------+        |
|  | /api/    | | /api/search (AI search + plans)  |        |
|  | settings | | /api/documents (ingest pipeline) |        |
|  +----+-----+ +----+-----------------------------+        |
|       |            |            |            |            |
|  +----v------------v------------v------------v--------+   |
|  |              Prisma ORM                            |   |
|  +------------------------+---------------------------+   |
|                           |                               |
|  +------------------------v---------------------------+   |
|  |                     SQLite                         |   |
|  +-----------------------------------------------------+  |
+-----------------------------------------------------------+
```

## Build from Source

```bash
git clone https://github.com/lzzzhh/interview-flashcards.git
cd interview-flashcards
npm install

# ---- Backend ----
cd backend
npm install
cp .env.example .env     # edit .env with your LLM API key before running
npx prisma generate
npx prisma db push
npm run dev

# ---- Frontend (open another terminal) ----
cd interview-flashcards
npm run dev              # browser development

# ---- Desktop App ----
npm run dev:desktop      # Tauri dev mode
npm run build:desktop    # production build
```

---

## License

MIT License
