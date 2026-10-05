import { RepositoryAnalysis } from './types';

export const fallbackDemoAnalysis: RepositoryAnalysis = {
  repository_name: "hyperlink-io/nexus-api",
  branches: [
    "main",
    "feature/auth",
    "feature/api-refactor",
    "feature/dashboard-v2",
    "feature/db-migration"
  ],
  commits: [
    {
      sha: "c001a11",
      message: "feat(core): initial express server setup with basic health check",
      author: "Alex Rivera",
      timestamp: "2026-09-28T09:00:00Z",
      branch: "main",
      files_changed: ["server.js", "package.json", "config/app.js"],
      additions: 80,
      deletions: 0,
      diff_snippet: "// server.js\nconst express = require('express');\nconst app = express();\napp.use(express.json());\napp.get('/health', (req, res) => res.json({ status: 'ok' }));\napp.listen(3000);"
    },
    {
      sha: "a101f34",
      message: "feat(auth): create JWT authentication middleware utility",
      author: "Alex Rivera",
      timestamp: "2026-10-02T10:30:00Z",
      branch: "feature/auth",
      files_changed: ["middleware/auth.js", "package.json"],
      additions: 68,
      deletions: 0,
      diff_snippet: "// middleware/auth.js\nconst jwt = require('jsonwebtoken');\nfunction authMiddleware(req, res, next) {\n  const token = req.headers.authorization?.split(' ')[1];\n  if (!token) return res.status(401).json({ error: 'Unauthorized: missing token' });\n  try {\n    req.user = jwt.verify(token, process.env.JWT_SECRET);\n    next();\n  } catch (err) {\n    return res.status(403).json({ error: 'Forbidden: invalid token' });\n  }\n}",
      pr_number: 101
    },
    {
      sha: "a102e56",
      message: "feat(auth): wire authMiddleware into server.js request pipeline",
      author: "Alex Rivera",
      timestamp: "2026-10-02T13:40:00Z",
      branch: "feature/auth",
      files_changed: ["server.js"],
      additions: 14,
      deletions: 2,
      diff_snippet: "@@ server.js @@\n const express = require('express');\n+const { authMiddleware } = require('./middleware/auth');\n const app = express();\n app.use(express.json());\n+\n+// Protect all API endpoints before dispatching to handlers\n+app.use('/v1', authMiddleware);\n+app.use('/v1/users', userRoutes);",
      pr_number: 101
    },
    {
      sha: "b201f99",
      message: "refactor(api): create asynchronous requestHandler stream manager",
      author: "Sarah Chen",
      timestamp: "2026-10-02T11:50:00Z",
      branch: "feature/api-refactor",
      files_changed: ["handlers/requestHandler.js", "config/app.js"],
      additions: 75,
      deletions: 12,
      diff_snippet: "// handlers/requestHandler.js\nfunction handleRequest(req, res, targetRoute) {\n  return targetRoute(req, res);\n}\nmodule.exports = { handleRequest };",
      pr_number: 102
    },
    {
      sha: "b202e88",
      message: "refactor(server): restructure express middleware flow for async throughput",
      author: "Sarah Chen",
      timestamp: "2026-10-02T15:20:00Z",
      branch: "feature/api-refactor",
      files_changed: ["server.js"],
      additions: 22,
      deletions: 15,
      diff_snippet: "@@ server.js @@\n const express = require('express');\n+const { handleRequest } = require('./handlers/requestHandler');\n const app = express();\n+\n+// Optimization: mount router early to bypass heavy middleware tree for speed\n+app.use('/v1', (req, res, next) => handleRequest(req, res, next));\n app.use(express.json());",
      pr_number: 102
    },
    {
      sha: "d301a22",
      message: "feat(dashboard): implement UserProfile widget for v2 contract",
      author: "Marcus Vance",
      timestamp: "2026-10-03T09:30:00Z",
      branch: "feature/dashboard-v2",
      files_changed: ["client/components/UserProfile.tsx", "client/services/api.ts"],
      additions: 85,
      deletions: 14,
      diff_snippet: "interface UserResponse {\n  userId: number;\n  displayName: string;\n}\nexport function UserProfile({ data }: { data: UserResponse }) {\n  return <div>User #{data.userId}: {data.displayName}</div>;\n}",
      pr_number: 103
    },
    {
      sha: "m401a77",
      message: "feat(db): update user schema and add uuid migration",
      author: "Elena Rostova",
      timestamp: "2026-10-03T14:00:00Z",
      branch: "feature/db-migration",
      files_changed: ["prisma/schema.prisma", "routes/user.js"],
      additions: 55,
      deletions: 20,
      diff_snippet: "@@ routes/user.js @@\n router.get('/v1/users/:id', async (req, res) => {\n   const user = await getUser(req.params.id);\n-  res.json({ userId: user.id, username: user.name });\n+  res.json({ user_id: user.uuid, username: user.name });\n });"
    }
  ],
  pull_requests: [
    {
      id: 101,
      number: 101,
      title: "feat(auth): Add JWT authentication middleware & route protection",
      author: "alex-rivera",
      author_name: "Alex Rivera",
      author_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      source_branch: "feature/auth",
      target_branch: "main",
      created_at: "2026-10-02T10:15:00Z",
      updated_at: "2026-10-03T14:20:00Z",
      status: "open",
      description: "Implements JWT token validation in request pipeline to protect all /v1/* secure resources. Injects req.user context and updates security integration tests.",
      changed_files_count: 4,
      additions: 142,
      deletions: 18
    },
    {
      id: 102,
      number: 102,
      title: "refactor(api): Streamline request handling pipeline & async throughput",
      author: "sarah-chen",
      author_name: "Sarah Chen",
      author_avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
      source_branch: "feature/api-refactor",
      target_branch: "main",
      created_at: "2026-10-02T11:45:00Z",
      updated_at: "2026-10-03T16:10:00Z",
      status: "open",
      description: "Refactors express middleware flow in server.js and modularizes requestHandler.js for non-blocking stream processing.",
      changed_files_count: 3,
      additions: 98,
      deletions: 45
    },
    {
      id: 103,
      number: 103,
      title: "feat(dashboard): User Profile v2 Integration & Telemetry Card",
      author: "marcus-vance",
      author_name: "Marcus Vance",
      author_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      source_branch: "feature/dashboard-v2",
      target_branch: "main",
      created_at: "2026-10-03T09:00:00Z",
      updated_at: "2026-10-04T08:30:00Z",
      status: "open",
      description: "Migrates frontend dashboard to ingest User Profile contract v2. Expects payload with numeric userId.",
      changed_files_count: 4,
      additions: 115,
      deletions: 28
    }
  ],
  understandings: [
    {
      sha: "a101f34",
      branch: "feature/auth",
      intent: "Add or update authentication and authorization middleware",
      category: "security",
      affected_components: ["authentication", "request pipeline", "authorization guard"],
      risk_level: "HIGH",
      confidence: 0.94,
      raw_message_trusted: true,
      inferred_reasoning: "Diff introduces token verification, authentication middleware, or security headers."
    },
    {
      sha: "b202e88",
      branch: "feature/api-refactor",
      intent: "Refactor request routing flow and middleware pipeline dispatch",
      category: "refactoring",
      affected_components: ["request handler", "routing pipeline", "middleware chain"],
      risk_level: "HIGH",
      confidence: 0.91,
      raw_message_trusted: true,
      inferred_reasoning: "Modifications alter request handling flow, pipeline middleware order, or route dispatchers."
    }
  ],
  change_maps: [
    {
      sha: "a102e56",
      branch: "feature/auth",
      files_changed: ["server.js"],
      functions_changed: ["authMiddleware()"],
      classes_changed: [],
      apis_changed: [],
      dependencies_changed: [],
      config_changed: [],
      schema_changed: [],
      tests_changed: [],
      frontend_components: []
    },
    {
      sha: "b202e88",
      branch: "feature/api-refactor",
      files_changed: ["server.js"],
      functions_changed: ["handleRequest()"],
      classes_changed: [],
      apis_changed: [],
      dependencies_changed: [],
      config_changed: [],
      schema_changed: [],
      tests_changed: [],
      frontend_components: []
    }
  ],
  detected_risks: [
    {
      id: "collision-semantic-auth-bypass",
      title: "Execution order collision: Authentication middleware bypass via out-of-order route registration",
      collision_type: "EXECUTION_ORDER",
      risk_level: "CRITICAL",
      risk_score: {
        code_overlap: 28,
        dependency_interaction: 15,
        api_impact: 22,
        security_impact: 25,
        test_coverage_uncertainty: 5,
        total: 95,
        explanation: "Risk Score 95/100: CRITICAL security bypass vulnerability. Parallel routing change mounts route handlers before auth verification executes."
      },
      branches: ["feature/auth", "feature/api-refactor"],
      commits: ["a102e56", "b202e88"],
      summary: "Branch 'feature/api-refactor' optimizes server.js throughput by registering routes directly at top of express stack, which unknowingly bypasses the JWT auth guard mounted in 'feature/auth'.",
      why_it_exists: "Developer A added authMiddleware expecting all downstream routes to be protected. Developer B restructured server.js to register routes earlier for asynchronous streaming. Both PRs pass independent unit tests, but merging both silently leaves /v1 routes unauthenticated.",
      affected_files: ["server.js"],
      affected_components: ["Express middleware pipeline", "JWT auth guard", "Route dispatchers"],
      evidence: [
        {
          commit_sha: "a102e56",
          commit_message: "feat(auth): wire authMiddleware into server.js request pipeline",
          author: "Alex Rivera",
          branch: "feature/auth",
          changed_files: ["server.js"],
          snippet_or_symbol: "app.use('/v1', authMiddleware);",
          observation: "Mounts security guard on /v1 route tree."
        },
        {
          commit_sha: "b202e88",
          commit_message: "refactor(server): restructure express middleware flow for async throughput",
          author: "Sarah Chen",
          branch: "feature/api-refactor",
          changed_files: ["server.js"],
          snippet_or_symbol: "app.use('/v1', (req, res, next) => handleRequest(req, res, next));",
          observation: "Dispatches /v1 requests prior to auth evaluation."
        }
      ],
      potential_impact: "Unauthenticated callers can execute internal /v1 administrative endpoints without passing a JWT token, causing a critical data exposure vulnerability.",
      confidence: 0.98,
      recommended_steps: [
        {
          step_number: 1,
          action: "Reorder Express middleware pipeline registration in server.js",
          detail: "Ensure authMiddleware is mounted upstream of the asynchronous request stream dispatcher.",
          file_reference: "server.js"
        },
        {
          step_number: 2,
          action: "Apply unified reconciliation patch",
          detail: "Run git apply with the synthesized MergeMind patch to preserve both stream speed and security enforcement.",
          file_reference: "server.js"
        },
        {
          step_number: 3,
          action: "Run integration security tests",
          detail: "Execute npm test -- tests/integration/auth_pipeline.test.js to verify 401 Unauthorized is returned for tokenless requests.",
          file_reference: "tests/integration/auth_pipeline.test.js"
        }
      ],
      test_recommendation: {
        tooling_detected: "Jest (Node.js)",
        framework_detected: "Jest (Node.js)",
        test_runner: "npm test --",
        recommended_commands: [
          "npm test -- tests/integration/auth_pipeline.test.js",
          "npm test -- tests/auth.test.js"
        ],
        verification_areas: [
          "Authentication guard enforcement on /v1 endpoints",
          "Token verification and payload injection into req.user",
          "Asynchronous stream handling performance under auth load"
        ],
        reasoning: "Detected Jest harness. Critical security middleware reordering requires integration tests verifying 401 Unauthorized responses before merging."
      },
      compatibility_patch: {
        id: "patch-collision-semantic-auth-bypass",
        file_path: "server.js",
        risk_id: "collision-semantic-auth-bypass",
        target_branch: "feature/api-refactor",
        source_branch: "feature/auth",
        strategy_name: "Middleware Pipeline Inversion & Security Preserving Dispatcher",
        summary: "Mounts authMiddleware strictly before the async stream handler so that all requests are validated before dispatch.",
        reconciled_code: "const express = require('express');\nconst { authMiddleware } = require('./middleware/auth');\nconst { handleRequest } = require('./handlers/requestHandler');\nconst app = express();\n\napp.use(express.json());\n// Enforce authentication prior to async stream dispatch\napp.use('/v1', authMiddleware);\napp.use('/v1', (req, res, next) => handleRequest(req, res, next));\n\nmodule.exports = app;\n",
        unified_diff: "--- a/server.js\n+++ b/server.js\n@@ -2,6 +2,7 @@\n const express = require('express');\n+const { authMiddleware } = require('./middleware/auth');\n const { handleRequest } = require('./handlers/requestHandler');\n const app = express();\n \n app.use(express.json());\n+// Enforce authentication prior to async stream dispatch\n+app.use('/v1', authMiddleware);\n app.use('/v1', (req, res, next) => handleRequest(req, res, next));\n",
        git_apply_command: "git apply --check server.js.patch && git apply server.js.patch",
        why_this_resolves: "Guarantees token validation occurs before async streaming handles request payloads.",
        confidence: 0.96,
        is_validated: true,
        ai_disclaimer: "AI-GENERATED • REQUIRES HUMAN REVIEW • REQUIRES TESTING",
        instructions: [
          "1. Inspect unified diff in Resolution Center.",
          "2. Apply patch to feature/api-refactor branch.",
          "3. Run automated tests to verify security headers."
        ]
      },
      review_status: "PENDING",
      requires_human_review: true,
      ai_disclaimer: "Human review required. MergeMind advises; developer decides."
    },
    {
      id: "collision-api-contract",
      title: "API contract mismatch: User identifier format and key naming divergence",
      collision_type: "API_CONTRACT",
      risk_level: "HIGH",
      risk_score: {
        code_overlap: 18,
        dependency_interaction: 5,
        api_impact: 22,
        security_impact: 5,
        test_coverage_uncertainty: 8,
        total: 58,
        explanation: "Risk Score 58/100: Breaking contract change. DB migration returns UUID string user_id while frontend client expects numeric userId."
      },
      branches: ["feature/db-migration", "feature/dashboard-v2"],
      commits: ["m401a77", "d301a22"],
      summary: "Branch 'feature/db-migration' renames userId -> user_id (UUID), breaking 'feature/dashboard-v2' which expects numeric userId.",
      why_it_exists: "Backend refactor changed the response key to snake_case UUID format while frontend assumes legacy numeric ID schema.",
      affected_files: ["routes/user.js", "client/components/UserProfile.tsx"],
      affected_components: ["User API controller", "UserProfile component"],
      evidence: [
        {
          commit_sha: "m401a77",
          commit_message: "feat(db): update user schema and add uuid migration",
          author: "Elena Rostova",
          branch: "feature/db-migration",
          changed_files: ["routes/user.js"],
          snippet_or_symbol: "res.json({ user_id: user.uuid, username: user.name });",
          observation: "Alters response key to user_id."
        },
        {
          commit_sha: "d301a22",
          commit_message: "feat(dashboard): implement UserProfile widget for v2 contract",
          author: "Marcus Vance",
          branch: "feature/dashboard-v2",
          changed_files: ["client/components/UserProfile.tsx"],
          snippet_or_symbol: "interface UserResponse { userId: number; }",
          observation: "Expects numeric userId."
        }
      ],
      potential_impact: "Frontend dashboard crashes with TypeError: Cannot read properties of undefined (reading 'toFixed') upon rendering user profiles.",
      confidence: 0.94,
      recommended_steps: [
        {
          step_number: 1,
          action: "Implement dual-key compatibility adapter",
          detail: "Return both userId and user_id in API response during migration period.",
          file_reference: "routes/user.js"
        }
      ],
      test_recommendation: {
        tooling_detected: "Jest (Node.js)",
        framework_detected: "Jest (Node.js)",
        recommended_commands: ["npm test -- tests/api.test.js"],
        verification_areas: ["Dual-contract response payload testing"],
        reasoning: "Test dual-key payload compatibility."
      },
      compatibility_patch: {
        id: "patch-collision-api-contract",
        file_path: "routes/user.js",
        strategy_name: "Dual-Key Contract Compatibility Adapter",
        summary: "Returns both userId and user_id so neither consumer breaks.",
        reconciled_code: "router.get('/:id', async (req, res) => {\n  const user = await getUser(req.params.id);\n  res.json({ userId: user.id || 1042, user_id: user.uuid, username: user.name });\n});",
        unified_diff: "--- a/routes/user.js\n+++ b/routes/user.js\n@@ -2,3 +2,4 @@\n-  res.json({ user_id: user.uuid, username: user.name });\n+  res.json({ userId: user.id || 1042, user_id: user.uuid, username: user.name });\n",
        confidence: 0.92,
        is_validated: true,
        ai_disclaimer: "AI-GENERATED • REQUIRES HUMAN REVIEW",
        instructions: ["Apply dual-key adapter patch."]
      },
      review_status: "PENDING",
      requires_human_review: true,
      ai_disclaimer: "Human review required."
    }
  ],
  compatibility_patches: [
    {
      id: "patch-collision-semantic-auth-bypass",
      file_path: "server.js",
      risk_id: "collision-semantic-auth-bypass",
      target_branch: "feature/api-refactor",
      source_branch: "feature/auth",
      strategy_name: "Middleware Pipeline Inversion & Security Preserving Dispatcher",
      summary: "Mounts authMiddleware strictly before the async stream handler so that all requests are validated before dispatch.",
      reconciled_code: "const express = require('express');\nconst { authMiddleware } = require('./middleware/auth');\nconst { handleRequest } = require('./handlers/requestHandler');\nconst app = express();\n\napp.use(express.json());\napp.use('/v1', authMiddleware);\napp.use('/v1', (req, res, next) => handleRequest(req, res, next));\n\nmodule.exports = app;\n",
      unified_diff: "--- a/server.js\n+++ b/server.js\n@@ -2,6 +2,7 @@\n const express = require('express');\n+const { authMiddleware } = require('./middleware/auth');\n const { handleRequest } = require('./handlers/requestHandler');\n const app = express();\n \n app.use(express.json());\n+app.use('/v1', authMiddleware);\n app.use('/v1', (req, res, next) => handleRequest(req, res, next));\n",
      git_apply_command: "git apply --check server.js.patch && git apply server.js.patch",
      why_this_resolves: "Guarantees token validation occurs before async streaming handles request payloads.",
      confidence: 0.96,
      is_validated: true,
      ai_disclaimer: "AI-GENERATED • REQUIRES HUMAN REVIEW • REQUIRES TESTING"
    }
  ],
  risk_summary: {
    CRITICAL: 1,
    HIGH: 1,
    MEDIUM: 0,
    LOW: 0
  },
  active_branch_a: "feature/auth",
  active_branch_b: "feature/api-refactor",
  analyzed_at: "2026-10-05T13:00:00Z",
  is_demo: true,
  rate_limited: false
};
