# MergeMind — AI GitHub Integration Advisor

> **"Git tells you when code conflicts. MergeMind helps you understand when code may conflict in behavior."**

MergeMind is a multi-agent AI system designed for software development teams to detect hidden behavioral, semantic, architectural, and contract conflicts across parallel branches, commits, and pull requests *before* code is merged into production, and generate concrete code modifications to make them mutually compatible.

---

## 🎯 The Core Problem MergeMind Solves

Conventional Git detects **textual line collisions**. If two developers modify different functions or different lines in the same file, Git reports:
```text
Automatic merge succeeded! 0 conflicts found.
```

However, software integration failures are frequently **behavioral and semantic**, not textual:
- Developer A introduces JWT authentication middleware into the request flow.
- Developer B refactors API request processing to optimize async throughput, inadvertently changing dispatch order.
- **Git detects no textual conflict.**
- **The result:** Unauthenticated requests bypass token verification and reach protected routes in production!

MergeMind identifies these subtle integration hazards, proves them with empirical code evidence, calculates a transparent risk score, generates sequential step-by-step resolution plans, recommends targeted test suites, and **generates exact code reconciliation patches** to make conflicting branches mutually compatible.

---

## 🤖 Multi-Agent Architecture & Reconciliation Pipeline

MergeMind coordinates a multi-agent pipeline using typed data schemas rather than a generic single-prompt chatbot:

```text
       GitHub Repository / Pull Requests
                       ↓
              Repository Analyzer
                       ↓
   Agent 1: Commit Understanding Agent
      ↳ Infers true architectural intent without trusting vague messages ("Fix stuff")
                       ↓
   Agent 2: Change Mapping Agent
      ↳ Extracts functions, endpoints, schemas, dependencies, and test footprints
                       ↓
   Agent 3: Collision Detection Agent
      ↳ Identifies 7 collision types (Direct File, Function, Structural, API, Dependency, Schema, Semantic)
                       ↓
   Agent 4: Semantic Risk Agent
      ↳ Reasons about behavioral incompatibilities with prudent, evidence-first language
                       ↓
   Agent 5: Risk Assessment Agent
      ↳ Calculates transparent 0–100 risk score breakdown (Code overlap, Dependency, API, Security, Test uncertainty)
                       ↓
   Agent 6: Resolution Planning Agent
      ↳ Creates actionable, step-by-step resolution procedures specific to target files
                       ↓
   Agent 7: Test Recommendation Agent
      ↳ Detects testing tooling (Jest, Vitest, pytest) and prescribes exact test commands & checklists
                       ↓
   Compatibility & Reconciliation Engine
      ↳ Generates concrete proposed code, unified diff patches, and CLI 'git apply' commands
                       ↓
        Human Developer Gate (Signoff & Merge Authority)
```

---

## 🛠️ Code Reconciliation & Compatibility Engine

When changes diverge, MergeMind generates concrete code modifications to match the repositories together:

1. **Pipeline Execution Sequence Inversion (`server.js`)**:
   - Reconciles authentication guardrails with asynchronous stream processing.
   - Mounts `authMiddleware` upstream of `handleRequest` so that all protected endpoints enforce JWT verification without sacrificing non-blocking throughput.
   - Generates exact proposed code and unified `.patch` file.

2. **Dual-Contract Compatibility Adapter (`routes/user.js`)**:
   - Resolves API contract divergence between numeric `userId` and UUID string `user_id`.
   - Returns a backward-compatible dual-key response payload allowing frontend consumers to parse numeric fields while backend migrations ingest modern UUID identifiers.

3. **Harmonized SemVer Dependency Alignment (`package.json`)**:
   - Reconciles peer package requirements across diverging branches (e.g. `jsonwebtoken`, `pg`, `@prisma/client`) with zero lockfile collisions.

---

## 🚀 Key Features

1. **Code Reconciliation Patches**: Generates proposed compatible implementations, unified diffs, and `git apply` CLI commands.
2. **Live GitHub Connect**: Inspect any repository (`owner/repo`) or use Personal Access Tokens for private repositories with automatic rate-limit detection.
3. **Evidence-First AI**: Every risk card cites exact commit SHAs, commit messages, author names, changed files, and code snippets.
4. **Transparent Risk Scoring (0–100)**: Itemized point breakdown across Code Overlap (max 30), Dependency Interaction (max 20), API Impact (max 20), Security Impact (max 20), and Test Uncertainty (max 10).
5. **Interactive Branch Comparison**: Side-by-side file matrix with collision badges (`COLLISION`, `SINGLE`), file diff inspection, and related commit timelines.
6. **Human-in-the-Loop Signoff**: "AI recommends. Developer decides." Mark risks as Reviewed, add signoff notes, dismiss false positives, or export resolution guides as formatted Markdown.
7. **Automated Test Recommendations**: Prescribes exact CLI commands and test area checklists, complete with an interactive terminal runner.

---

## 💻 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Backend**: Python 3.9+, FastAPI, Uvicorn, Pydantic v2, HTTPX
- **Design System**: Developer-first dark theme inspired by GitHub Dark with high information density

---

## 🏃 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.9+)

### 2. Start the Backend API
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
API docs available at: `http://127.0.0.1:8000/docs`

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 3000
```
Open your browser to: **`http://localhost:3000`**

---

## 🔒 Security Principles

- No raw tokens are ever logged, persisted to disk, or broadcasted to clients.
- Read-only analysis of diffs and commit metadata.
- MergeMind **never automatically pushes code or merges branches**. Developer review is mandatory.
