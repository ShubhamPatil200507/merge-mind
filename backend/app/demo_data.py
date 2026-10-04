"""
MergeMind Demo Repository Data.
A realistic microservices/monorepo project ("nexus-api") with 4 developers, 4 feature branches,
18 commits, 3 PRs, realistic diffs, and intentional subtle collisions (including the core semantic conflict).
"""

from typing import List, Dict, Any
from app.models import CommitInfo

DEMO_REPO_NAME = "hyperlink-io/nexus-api"

DEMO_BRANCHES = [
    "main",
    "feature/auth",
    "feature/api-refactor",
    "feature/dashboard-v2",
    "feature/db-migration"
]

DEMO_PULL_REQUESTS: List[Dict[str, Any]] = [
    {
        "id": 101,
        "number": 101,
        "title": "feat(auth): Add JWT authentication middleware & route protection",
        "author": "alex-rivera",
        "author_name": "Alex Rivera",
        "author_avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        "source_branch": "feature/auth",
        "target_branch": "main",
        "created_at": "2026-10-02T10:15:00Z",
        "updated_at": "2026-10-03T14:20:00Z",
        "status": "open",
        "description": "Implements JWT token validation in request pipeline to protect all `/v1/*` secure resources. Injects `req.user` context and updates security integration tests.",
        "changed_files_count": 4,
        "additions": 142,
        "deletions": 18
    },
    {
        "id": 102,
        "number": 102,
        "title": "refactor(api): Streamline request handling pipeline & async throughput",
        "author": "sarah-chen",
        "author_name": "Sarah Chen",
        "author_avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
        "source_branch": "feature/api-refactor",
        "target_branch": "main",
        "created_at": "2026-10-02T11:45:00Z",
        "updated_at": "2026-10-03T16:10:00Z",
        "status": "open",
        "description": "Refactors express middleware flow in `server.js` and modularizes `requestHandler.js` for non-blocking stream processing. Enhances benchmark RPS by 35%.",
        "changed_files_count": 3,
        "additions": 98,
        "deletions": 45
    },
    {
        "id": 103,
        "number": 103,
        "title": "feat(dashboard): User Profile v2 Integration & Telemetry Card",
        "author": "marcus-vance",
        "author_name": "Marcus Vance",
        "author_avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
        "source_branch": "feature/dashboard-v2",
        "target_branch": "main",
        "created_at": "2026-10-03T09:00:00Z",
        "updated_at": "2026-10-04T08:30:00Z",
        "status": "open",
        "description": "Migrates frontend dashboard to ingest User Profile contract v2. Expects payload with numeric `userId` and timestamp formatted as milliseconds.",
        "changed_files_count": 4,
        "additions": 115,
        "deletions": 28
    }
]

DEMO_COMMITS: List[CommitInfo] = [
    # Main branch baseline commits
    CommitInfo(
        sha="c001a11",
        message="feat(core): initial express server setup with basic health check",
        author="Alex Rivera",
        timestamp="2026-09-28T09:00:00Z",
        branch="main",
        files_changed=["server.js", "package.json", "config/app.js"],
        additions=80,
        deletions=0,
        diff_snippet="""// server.js
const express = require('express');
const app = express();
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(3000);"""
    ),
    CommitInfo(
        sha="c002b22",
        message="feat(user): add base user repository and routes",
        author="Sarah Chen",
        timestamp="2026-09-29T14:30:00Z",
        branch="main",
        files_changed=["routes/user.js", "models/user.js"],
        additions=95,
        deletions=5,
        diff_snippet="""// routes/user.js
router.get('/v1/users/:id', async (req, res) => {
  const user = await getUser(req.params.id);
  res.json({ userId: user.id, username: user.name });
});"""
    ),
    CommitInfo(
        sha="c003c33",
        message="chore(ci): setup Jest testing harness and npm scripts",
        author="Elena Rostova",
        timestamp="2026-09-30T11:00:00Z",
        branch="main",
        files_changed=["package.json", "jest.config.js"],
        additions=45,
        deletions=2,
        diff_snippet="""// package.json
"scripts": {
  "test": "jest --detectOpenHandles",
  "test:unit": "jest tests/unit",
  "test:integration": "jest tests/integration"
}"""
    ),

    # Feature/Auth branch commits (Developer A: Alex Rivera)
    CommitInfo(
        sha="a101f34",
        message="feat(auth): create JWT authentication middleware utility",
        author="Alex Rivera",
        timestamp="2026-10-02T10:30:00Z",
        branch="feature/auth",
        files_changed=["middleware/auth.js", "package.json"],
        additions=68,
        deletions=0,
        pr_number=101,
        diff_snippet="""// middleware/auth.js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: missing token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: invalid token' });
  }
}
module.exports = { authMiddleware };"""
    ),
    CommitInfo(
        sha="a102e56",
        message="feat(auth): wire authMiddleware into server.js request pipeline",
        author="Alex Rivera",
        timestamp="2026-10-02T13:40:00Z",
        branch="feature/auth",
        files_changed=["server.js"],
        additions=14,
        deletions=2,
        pr_number=101,
        diff_snippet="""@@ server.js @@
 const express = require('express');
+const { authMiddleware } = require('./middleware/auth');
 const app = express();
 app.use(express.json());
+
+// Protect all API endpoints before dispatching to handlers
+app.use('/v1', authMiddleware);
+app.use('/v1/users', userRoutes);
"""
    ),
    CommitInfo(
        sha="a103d78",
        message="test(auth): add unit and integration test coverage for JWT verification",
        author="Alex Rivera",
        timestamp="2026-10-02T16:15:00Z",
        branch="feature/auth",
        files_changed=["tests/auth.test.js", "tests/integration/auth_pipeline.test.js"],
        additions=60,
        deletions=0,
        pr_number=101,
        diff_snippet="""// tests/auth.test.js
describe('authMiddleware', () => {
  it('rejects unauthenticated requests to /v1 routes with 401', async () => {
    const res = await request(app).get('/v1/users/42');
    expect(res.status).toBe(401);
  });
});"""
    ),

    # Feature/API-Refactor branch commits (Developer B: Sarah Chen)
    CommitInfo(
        sha="b201f99",
        message="refactor(api): create asynchronous requestHandler stream manager",
        author="Sarah Chen",
        timestamp="2026-10-02T11:50:00Z",
        branch="feature/api-refactor",
        files_changed=["handlers/requestHandler.js", "config/app.js"],
        additions=75,
        deletions=12,
        pr_number=102,
        diff_snippet="""// handlers/requestHandler.js
function handleRequest(req, res, targetRoute) {
  // Direct dispatch optimization for high concurrency
  return targetRoute(req, res);
}
module.exports = { handleRequest };"""
    ),
    CommitInfo(
        sha="b202e88",
        message="refactor(server): restructure express middleware flow for async throughput",
        author="Sarah Chen",
        timestamp="2026-10-02T15:20:00Z",
        branch="feature/api-refactor",
        files_changed=["server.js"],
        additions=22,
        deletions=15,
        pr_number=102,
        diff_snippet="""@@ server.js @@
 const express = require('express');
+const { handleRequest } = require('./handlers/requestHandler');
 const app = express();
+
+// Optimization: mount router early to bypass heavy middleware tree for speed
+app.use('/v1', (req, res, next) => handleRequest(req, res, next));
 app.use(express.json());
-app.use('/v1/users', userRoutes);
"""
    ),
    CommitInfo(
        sha="b203d77",
        message="test(api): benchmark throughput and update API pipeline tests",
        author="Sarah Chen",
        timestamp="2026-10-02T18:00:00Z",
        branch="feature/api-refactor",
        files_changed=["tests/api.test.js"],
        additions=40,
        deletions=10,
        pr_number=102,
        diff_snippet="""// tests/api.test.js
describe('handleRequest async performance', () => {
  it('dispatches valid routes with under 5ms latency', async () => {
    const res = await request(app).get('/v1/health');
    expect(res.status).toBe(200);
  });
});"""
    ),

    # Feature/Dashboard-v2 branch commits (Developer C: Marcus Vance)
    CommitInfo(
        sha="d301a22",
        message="feat(dashboard): implement UserProfile widget for v2 contract",
        author="Marcus Vance",
        timestamp="2026-10-03T09:30:00Z",
        branch="feature/dashboard-v2",
        files_changed=["client/components/UserProfile.tsx", "client/services/api.ts", "config/app.js"],
        additions=85,
        deletions=14,
        pr_number=103,
        diff_snippet="""// client/components/UserProfile.tsx
interface UserResponse {
  userId: number; // Expects numeric ID in v2 frontend
  displayName: string;
}
export function UserProfile({ data }: { data: UserResponse }) {
  return <div>User #{data.userId.toFixed(0)}: {data.displayName}</div>;
}"""
    ),
    CommitInfo(
        sha="d302b33",
        message="refactor(client): update API client to format requests with v2 header",
        author="Marcus Vance",
        timestamp="2026-10-03T11:15:00Z",
        branch="feature/dashboard-v2",
        files_changed=["client/services/api.ts"],
        additions=30,
        deletions=14,
        pr_number=103,
        diff_snippet="""// client/services/api.ts
export async function fetchUser(id: number) {
  const res = await fetch(`/v1/users/${id}`);
  const data = await res.json();
  // Expecting userId to be a number:
  if (typeof data.userId !== 'number') {
    throw new TypeError('API contract mismatch: userId must be number');
  }
  return data;
}"""
    ),

    # Feature/DB-Migration branch commits (Developer D: Elena Rostova)
    CommitInfo(
        sha="m401a77",
        message="feat(db): update user schema and add uuid migration",
        author="Elena Rostova",
        timestamp="2026-10-03T14:00:00Z",
        branch="feature/db-migration",
        files_changed=["prisma/schema.prisma", "migrations/20261003_uuid_id.sql", "routes/user.js"],
        additions=55,
        deletions=20,
        diff_snippet="""@@ routes/user.js @@
 router.get('/v1/users/:id', async (req, res) => {
   const user = await getUser(req.params.id);
-  res.json({ userId: user.id, username: user.name });
+  res.json({ user_id: user.uuid, username: user.name }); // Migrated to snake_case string UUID
 });"""
    ),
    CommitInfo(
        sha="m402b88",
        message="chore(deps): bump pg driver to v8.12.0 and prisma to v5.15.0",
        author="Elena Rostova",
        timestamp="2026-10-03T16:45:00Z",
        branch="feature/db-migration",
        files_changed=["package.json"],
        additions=6,
        deletions=6,
        diff_snippet="""@@ package.json @@
-    "pg": "^8.7.1",
+    "pg": "^8.12.0",
-    "@prisma/client": "^5.2.0",
+    "@prisma/client": "^5.15.0",
"""
    ),
    CommitInfo(
        sha="m403c99",
        message="Fix stuff", # Example of vague commit message to test Agent 1
        author="Elena Rostova",
        timestamp="2026-10-03T17:30:00Z",
        branch="feature/db-migration",
        files_changed=["config/database.js"],
        additions=12,
        deletions=3,
        diff_snippet="""@@ config/database.js @@
+// Updated connection pool configuration for pg 8.12 SSL enforcement
 poolConfig.ssl = { rejectUnauthorized: false };
 poolConfig.connectionTimeoutMillis = 5000;
"""
    )
]

# File content snapshots for the Branch Comparison / Diff viewer
FILE_SNAPSHOTS: Dict[str, Dict[str, str]] = {
    "server.js": {
        "main": """const express = require('express');
const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(3000, () => {
  console.log('Nexus API server listening on 3000');
});""",

        "feature/auth": """const express = require('express');
const { authMiddleware } = require('./middleware/auth');
const userRoutes = require('./routes/user');

const app = express();

app.use(express.json());

// Protect all /v1 endpoints before dispatching to handlers
app.use('/v1', authMiddleware);
app.use('/v1/users', userRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(3000, () => {
  console.log('Nexus API server listening on 3000');
});""",

        "feature/api-refactor": """const express = require('express');
const { handleRequest } = require('./handlers/requestHandler');
const userRoutes = require('./routes/user');

const app = express();

// Optimization: mount router early to bypass heavy middleware tree for speed
app.use('/v1', (req, res, next) => handleRequest(req, res, next));

app.use(express.json());
app.use('/v1/users', userRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(3000, () => {
  console.log('Nexus API server listening on 3000');
});"""
    },

    "routes/user.js": {
        "main": """const express = require('express');
const router = express.Router();
const { getUser } = require('../models/user');

router.get('/:id', async (req, res) => {
  const user = await getUser(req.params.id);
  res.json({ userId: user.id, username: user.name });
});

module.exports = router;""",

        "feature/db-migration": """const express = require('express');
const router = express.Router();
const { getUser } = require('../models/user');

router.get('/:id', async (req, res) => {
  const user = await getUser(req.params.id);
  // Breaking API contract change: userId -> user_id (string UUID)
  res.json({ user_id: user.uuid, username: user.name });
});

module.exports = router;"""
    },

    "package.json": {
        "main": """{
  "name": "nexus-api",
  "version": "1.0.0",
  "scripts": {
    "test": "jest",
    "test:integration": "jest tests/integration"
  },
  "dependencies": {
    "express": "^4.19.2",
    "pg": "^8.7.1",
    "@prisma/client": "^5.2.0"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}""",
        "feature/auth": """{
  "name": "nexus-api",
  "version": "1.0.0",
  "scripts": {
    "test": "jest",
    "test:auth": "jest tests/auth.test.js",
    "test:integration": "jest tests/integration"
  },
  "dependencies": {
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.7.1",
    "@prisma/client": "^5.2.0"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}""",
        "feature/db-migration": """{
  "name": "nexus-api",
  "version": "1.0.0",
  "scripts": {
    "test": "jest",
    "test:integration": "jest tests/integration"
  },
  "dependencies": {
    "express": "^4.19.2",
    "pg": "^8.12.0",
    "@prisma/client": "^5.15.0"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}"""
    }
}
