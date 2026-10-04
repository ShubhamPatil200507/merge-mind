# MergeMind — AI GitHub Integration Advisor

> **"Git tells developers when code conflicts textually. MergeMind tells developers when code conflicts behaviorally."**

MergeMind is a multi-agent developer platform designed for engineering teams to detect hidden behavioral, semantic, architectural, and contract conflicts across parallel branches, commits, and pull requests *before* code merges into production, and generates concrete code modifications to make them mutually compatible.

---

## 🎯 The Core Problem MergeMind Solves

Conventional Git detects **textual line collisions**. If two developers modify different functions or different lines in the same file, Git reports:
```text
Automatic merge succeeded! 0 conflicts found.
```

However, software integration failures are frequently **behavioral and semantic**, not textual:
- Developer A introduces JWT authentication middleware into the request flow.
- Developer B refactors API request processing to optimize async throughput, inadvertently mounting handlers prior to middleware registration.
- **Git detects no textual conflict.**
- **The result:** Unauthenticated requests bypass token verification and reach protected routes in production!

MergeMind identifies these subtle integration hazards, proves them with empirical code evidence, calculates a transparent 100-point risk score, generates sequential step-by-step resolution plans, recommends targeted test suites, and **generates exact code reconciliation patches** to make conflicting branches mutually compatible.

---

## 🤖 Multi-Agent Architecture & Pipeline

MergeMind executes a deterministic-first pipeline using typed data schemas rather than a generic single-prompt chatbot:

```text
                      GitHub Repository / Pull Requests
                                      ↓
                      AST & Normalized Code Parser Engine
                       (Python ast, JS/TS Token Parser)
                                      ↓
                  Agent 1: Commit Understanding Agent
                     ↳ Infers true architectural intent
                                      ↓
                  Agent 2: Change Mapping Agent
                     ↳ Normalizes files, symbols, routes, and imports
                                      ↓
                  Agent 3: Collision Detection Agent
                     ↳ Evaluates all 12 Collision Categories
                                      ↓
                  Agent 4: Semantic Risk Agent
                     ↳ Reasons about behavioral incompatibilities
                                      ↓
                  Agent 5: Risk Assessment Agent
                     ↳ Calculates transparent 100-point risk score
                                      ↓
                  Agent 6: Resolution Planning Agent
                     ↳ Creates actionable, step-by-step resolution plans
                                      ↓
                  Agent 7: Test Recommendation Agent
                     ↳ Discovers test tooling (Jest, Vitest, pytest, Maven, Cargo, Go)
                                      ↓
                  Compatibility & Reconciliation Engine
                     ↳ Generates unified .patch diffs & validates syntax
                                      ↓
                  Sandboxed Test Execution Runner
                     ↳ Runs approved tests with zero credential leakage
                                      ↓
                  Human Developer Review & Audit Trail
                     ↳ Signoff, Approve, Flag, and persist to SQLite
```

---

## 🛡️ 12 Collision Classification Categories

MergeMind implements dedicated detection classifiers for all 12 collision categories:

1. **`DIRECT_FILE`**: Both branches modify the same file paths with overlapping or nearby modifications.
2. **`STRUCTURAL`**: Parallel modifications to the same class, shared module abstraction, or common export index.
3. **`FUNCTION`**: Concurrent changes to identical function signatures, parameters, or return semantics.
4. **`API_CONTRACT`**: Incompatible HTTP route handlers, payload shapes (`userId: number` vs `user_id: UUID`), or response codes.
5. **`DEPENDENCY`**: Conflicting manifest package versions, major-version upgrades, or peer dependency mismatches (`package.json`, `requirements.txt`).
6. **`SCHEMA`**: Database model modifications, migrations, or DDL column constraints created concurrently.
7. **`CONFIGURATION`**: Conflicting environment variables, security flags, or connection strings.
8. **`EXECUTION_ORDER`**: Out-of-order middleware mounting vs route registration (e.g. auth bypass hazard).
9. **`STATE_DATA_FLOW`**: Conflicting state transitions on models (`draft -> published` vs `draft -> pending_approval -> published`).
10. **`TEST_INCOMPATIBILITY`**: Route/logic modifications that invalidate assertions in existing test suites.
11. **`PERFORMANCE_REGRESSION`**: Unbatched queries, N+1 query patterns inside loops, or unindexed database operations.
12. **`SEMANTIC_OVERLAP`**: Conceptually related modifications across distinct files (e.g. auth policy in file A and route dispatch in file B).

---

## 🛠️ Code Reconciliation & Compatibility Engine

When changes diverge, MergeMind generates concrete code modifications to match the repositories together:

1. **Execution Order Inversion (`server.js`)**:
   - Reconciles authentication guardrails with asynchronous stream processing.
   - Mounts `authMiddleware` upstream of `handleRequest` so that all protected endpoints enforce JWT verification without sacrificing non-blocking throughput.
   - Generates unified `.patch` format and validates with `git apply --check`.

2. **Dual-Contract Compatibility Adapter (`routes/user.js`)**:
   - Resolves API contract divergence between numeric `userId` and UUID string `user_id`.
   - Returns a backward-compatible dual-key response payload allowing frontend consumers to parse numeric fields while backend migrations ingest modern UUID identifiers.

3. **Harmonized SemVer Dependency Alignment (`package.json`)**:
   - Reconciles peer package requirements across diverging branches (e.g. `jsonwebtoken`, `pg`, `@prisma/client`) with zero lockfile collisions.

> **Zero-Hallucination Policy**: If code evidence is insufficient to safely synthesize a patch, MergeMind omits code generation and outputs step-by-step manual resolution instructions.
> **Human-in-the-Loop Guarantee**: Every patch carries `AI-GENERATED • REQUIRES HUMAN REVIEW • REQUIRES TESTING`. MergeMind never automatically merges or pushes production code.

---

## 🔒 Security & Sandboxing Model

- **Prompt Injection Defense**: All repository content (code, commit messages, PR descriptions) is treated strictly as untrusted data strings using system-level prompt injection guards.
- **Sandboxed Test Runner**:
  - Restricts commands to an approved allowlist (`npm test`, `pytest`, `npx vitest`, `cargo test`, `go test`, `mvn test`).
  - Arbitrary shell commands (`rm`, `curl`, `powershell`) are blocked immediately with `status="forbidden"`.
  - Subprocess environments are stripped of sensitive credentials (`LLM_API_KEY`, `GITHUB_TOKEN`).
  - Enforces a 10-second hard execution timeout.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ & npm
- Python 3.9+ & pip

### Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 3000
```

Open `http://localhost:3000` in your browser.

---

## ⚙️ Environment Configuration

Set these environment variables in `backend/.env` or your hosting provider:

```ini
# LLM Provider Configuration
LLM_PROVIDER=openai           # Options: openai, groq, openrouter, ollama, mock
LLM_MODEL=gpt-4o-mini         # Model identifier
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=                 # Optional: custom base URL (e.g. for local Ollama)

# GitHub Integration (Optional - increases rate limits from 60 to 5,000 req/hr)
GITHUB_TOKEN=ghp_your_github_token_here
```

---

## 🧪 Running Automated Tests

```bash
cd backend
python -m pytest tests/test_mergemind.py -v
```

All 11 unit, integration, and E2E fixture tests verify AST parsing, collision detection, patch validation, test sandboxing, and SQLite audit trails.
