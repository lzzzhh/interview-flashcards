# Interview Flashcards

<p align="center">
  <a href="https://github.com/lzzzhh/interview-flashcards/actions/workflows/build.yml"><img src="https://github.com/lzzzhh/interview-flashcards/actions/workflows/build.yml/badge.svg" alt="Build"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri" alt="Tauri v2">
  <img src="https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite" alt="SQLite">
  <img src="https://img.shields.io/badge/Neo4j-5-4581C3?logo=neo4j" alt="Neo4j">
</p>

<p align="center">
  <img src="icon.png" width="128" alt="Interview Flashcards icon" />
</p>

<p align="center">
  A desktop flashcard app for interview preparation, powered by Active Recall and SM-2 spaced repetition.<br>
  <b>Job Prep Agent</b> · <b>AI Semantic Search</b> · <b>Document-to-Flashcards</b> · <b>Learning Mode Presets</b><br>
  Built-in card coverage: Algorithms · Statistics · Machine Learning · Deep Learning · LLM · Agent · Java · Vibe Coding · Industry Jargon · Workplace Communication.
</p>

---

## Quick Start

```bash
curl -fsSL https://raw.githubusercontent.com/lzzzhh/interview-flashcards/main/install.sh | bash
```

Or download from [Releases](https://github.com/lzzzhh/interview-flashcards/releases).

---

## Features

### Learning Mode Presets

Configure your study pace with one click. The app calculates daily card quotas and auto-resolves cards once they reach a target interval.

- **Sprint** (21 days), **Fast** (45 days), **Normal** (90 days), **Custom** mode
- Per-deck quota allocation with visual sliders
- Auto-resolve: cards are automatically marked as mastered when their SM-2 interval reaches the threshold
- Manual "Mark as Mastered" button on every card — removes it from future review queues
- Sprint mode compresses SM-2 learning→review from 6 to 4 days

### Active Recall + Spaced Repetition (SM-2)

Cards hide answers by default — recall first, then reveal. Tracks `new / learning / review / relearning / mastered` states.

- **Five-level Rating System**: Buttons show real-time predicted intervals
- **Mastered State**: Cards graduate to a permanent "resolved" state — never appear in review again
- **Undo Last Rating**: `Ctrl/Cmd + Z` to rollback
- Scheduling runs locally with backend review logging

### Job Prep Agent

Paste a job description and get a personalized study plan in minutes.

- **Multi-Agent ReAct Pipeline**: ContextAgent → RequirementAgent → RetrievalAgent → PlannerAgent → CriticAgent
- **Eight Role Profiles**: Algorithm, LLM, LLM Application, Machine Learning, Data Science, Data Analysis, Backend, Frontend
- **Guard System**: Rule validator (7 sync rules) + LLM guard, max 2 repair attempts
- **Resume Tailoring**: Upload PDF/DOCX resume, get JD-optimized rewrite with gap analysis
- **Neo4j Graph Expansion**: Concept graph + card similarity graph for richer card discovery

### AI Semantic Search

Multi-channel recall with vector similarity, graph expansion, and diversity re-ranking.

- **6 Recall Channels**: FTS5 keyword, tag matching, search keywords, bge-m3 vector, Neo4j concept graph, Neo4j card similarity graph
- **Smart Ranking**: Weighted scoring (vector + keyword + graph + field + learning state)
- **Learning Plan Search**: Intent-aware query understanding with staged plan output

### Document-to-Flashcards

Upload PDF, TXT, or Markdown files → LLM extracts concepts → generates Chinese flashcard drafts → review, edit, and batch-import.

- Global background queue with real-time progress
- Draft review dashboard with status filtering
- Batch import with frontend chunking (20 cards/batch)

### Neo4j Card Similarity Graph

All 1,141 cards have bge-m3 embeddings. Pairwise cosine similarity stored as `SIMILAR_TO` edges in Neo4j — powers cross-deck card discovery and learning path recommendations.

### Study Statistics

Pre-computed stats snapshot for instant dashboard rendering.

- Overview: total cards, due, streak, today's correct rate
- Progress stages: new / learning / review / relearning / mastered
- Per-deck breakdown with progress bars
- Daily limits with per-deck allocation

### 10 Built-in Decks (1,141 cards)

| Deck | Cards | Sub-topics |
|------|-------|------------|
| LeetCode | 100 | Hot 100 |
| Statistics | 50 | Descriptive, probability, hypothesis testing, Bayesian |
| Machine Learning | 100 | Supervised, unsupervised, ensemble, feature engineering |
| Deep Learning | 100 | Backprop, CNN/RNN, Transformer, GAN/VAE, Diffusion, Deployment |
| LLM | 100 | Attention, architecture, SFT/PEFT, RLHF, inference, RAG, safety |
| Agent | 100 | ReAct, tools, memory, RAG, LangGraph, MCP |
| Java | 200 | Core, collections, concurrency, JVM, Spring, Redis, distributed |
| Vibe Coding | 50 | Commands, skills, agent teams, MCP, hooks |
| Jargon | 50 | Internet slang, industry terminology |
| Workplace | 50 | Communication, project management, interview techniques |

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
| Styling | TailwindCSS v4 |
| Math Rendering | react-markdown + KaTeX |
| Desktop Framework | Tauri v2 (Rust) |
| Backend API | Fastify + Prisma + SQLite |
| Vector Search | bge-m3 (Ollama) + custom SQLite cosine |
| Full-text Search | SQLite FTS5 |
| Graph Database | Neo4j 5 (optional) |
| External Vector DB | Qdrant (optional) |
| Spaced Repetition | SM-2 (local-first) |
| CI/CD | GitHub Actions |

---

## Build from Source

```bash
git clone https://github.com/lzzzhh/interview-flashcards.git
cd interview-flashcards
npm install

# Backend
cd backend
npm install
cp .env.example .env     # edit .env with your LLM API key
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts   # import 1,141 built-in cards
npm run dev

# Frontend (another terminal)
cd interview-flashcards
npm run dev              # browser development

# Desktop App
npm run tauri build      # production build
```

---

## License

MIT License
