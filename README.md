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
  <b>AI Semantic Search</b> . <b>Learning Plans</b> . <b>Vector Matching</b><br>
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
| macOS (Apple Silicon) | `Interview-Flashcards_aarch64.dmg` |
| macOS (Intel) | `Interview-Flashcards_x86_64.dmg` |
| Windows | NSIS `.exe` installer |
| Linux | `.deb` package |

---

## Features

### Home Page

Three-column layout: Today's Tasks . Recommended Study . My Decks, with bottom tab bar navigation.

- **Today's Tasks**: Real-time stats for review / new cards / in-progress, one-click daily study start
- **Recommended Study**: SM-2 algorithm intelligently recommends cards needing review, supports swipe and tap navigation
- **My Decks**: 9 built-in modules + custom decks, showing review/new card counts
- **Bottom Tab Bar**: Home / All Decks / Stats / Agent / Profile

### Active Recall + Spaced Repetition

Cards hide answers by default -- recall first, then reveal. Algorithm cards support independent "Approach" and "Code" sections. Q&A cards support Markdown + LaTeX rendering.

- **Enhanced SM-2 Scheduling**: Tracks `new / learning / review / relearning` states
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

### AI Semantic Search (requires backend + Ollama)

Semantic search based on bge-m3 vector embeddings, supporting Chinese natural language queries with automatic matching of relevant interview cards.

- **Multi-channel Recall**: FTS5 full-text search + tag matching + semantic vector retrieval
- **Smart Ranking**: Field weighting + learning state boost + deck match scoring
- **Semantic Understanding**: Synonyms, mixed Chinese/English, natural language queries

### AI Learning Plans

After searching, input a learning intent (e.g. "learn decision trees", "master SVM"). AI automatically selects relevant cards and sorts by learning priority to generate a study plan. Plans are saved locally and accessible under Profile > Learning Plans for review and jump-to-study.

### Vector Database

Visual vector store management with multi-module switching, real-time embedded record viewing, and semantic search results.

### Study Statistics

Dedicated stats page showing:

- Total cards, mastered, pending review
- Streak days, today's learned
- Mastery rate progress bar, review stage distribution
- Module distribution progress bars
- Daily new card limit (collapsible)
- Data export / import (covers all modules + custom decks)

### Agent Hub

Unified AI Agent management. Currently supports AI Search, document-to-flashcard import, and draft review. Additional agents (Job Preparation, Mock Interview, Resume Project) are planned.

### Tag Management

Cross-module tagging system with custom tag creation, batch assignment, and tag-based card filtering.

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
| **Backend API** | **Fastify + Prisma + SQLite** |
| Vector Embeddings | bge-m3 via Ollama (local deployment) |
| Full-text Search | SQLite FTS5 + Chinese bigram tokenizer |
| Spaced Repetition | SM-2 algorithm (backend priority) |
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
|  |              SQLite / PostgreSQL                   |   |
|  +-----------------------------------------------------+  |
+-----------------------------------------------------------+
```

## Build from Source

```bash
git clone https://github.com/lzzzhh/interview-flashcards.git
cd interview-flashcards
npm install

# Start backend (optional, for database features)
cd backend && npm install && npm run dev

# Browser development
npm run dev

# Build desktop installer
npm run build:desktop
```

---

## License

MIT License
