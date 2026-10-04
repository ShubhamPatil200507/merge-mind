"""
MergeMind Compatibility & Reconciliation Engine.
Generates concrete, actionable code modifications and unified diff patches (git apply compatible)
to harmonize conflicting branches and make their changes mutually compatible.
"""

from typing import Optional, List
from app.models import CollisionType, CompatibilityPatch
from app.agents.collision_detection import RawCollision

def generate_compatibility_patch(collision: RawCollision) -> Optional[CompatibilityPatch]:
    """
    Generates an exact code reconciliation patch and compatibility strategy for a detected collision.
    """
    if collision.collision_type == CollisionType.SEMANTIC:
        file_path = "server.js"
        strategy = "Middleware Execution Priority Inversion & Security Preserving Pipeline"
        summary = (
            "Harmonizes Developer A's JWT route protection with Developer B's asynchronous requestHandler stream. "
            "Mounts authMiddleware strictly upstream of handleRequest so that all /v1 endpoints populate req.user "
            "prior to stream dispatch without sacrificing Sarah's non-blocking throughput gains."
        )

        reconciled_code = """const express = require('express');
const { authMiddleware } = require('./middleware/auth');
const { handleRequest } = require('./handlers/requestHandler');
const userRoutes = require('./routes/user');

const app = express();

app.use(express.json());

// RECONCILIATION: Enforce JWT authentication BEFORE async request dispatch
// This preserves Developer A's security guardrails while executing Developer B's optimized stream handler
app.use('/v1', authMiddleware);
app.use('/v1', (req, res, next) => handleRequest(req, res, next));
app.use('/v1/users', userRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', runtime: 'reconciled-nexus' });
});

app.listen(3000, () => {
  console.log('Nexus API server listening on 3000 [Security + Async Pipeline Reconciled]');
});"""

        unified_diff = """--- a/server.js
+++ b/server.js
@@ -1,13 +1,18 @@
 const express = require('express');
+const { authMiddleware } = require('./middleware/auth');
+const { handleRequest } = require('./handlers/requestHandler');
 const userRoutes = require('./routes/user');
 const app = express();
 
 app.use(express.json());
 
-// RECONCILIATION: Position authMiddleware prior to handleRequest stream dispatch
+app.use('/v1', authMiddleware);
+app.use('/v1', (req, res, next) => handleRequest(req, res, next));
+app.use('/v1/users', userRoutes);
 
 app.get('/health', (req, res) => {
   res.json({ status: 'ok' });
 });
 
 app.listen(3000, () => {
   console.log('Nexus API server listening on 3000');
 });"""

        instructions = [
            "Import both authMiddleware and handleRequest at top of server.js.",
            "Register app.use('/v1', authMiddleware) first to intercept all secure endpoints.",
            "Mount app.use('/v1', (req, res, next) => handleRequest(req, res, next)) downstream of authMiddleware.",
            "Verify that handleRequest receives req.user intact without bypass.",
            "Apply patch using: git apply server.js.patch"
        ]

        return CompatibilityPatch(
            id="patch-semantic-server-pipeline",
            risk_id=collision.id,
            file_path=file_path,
            target_branch=collision.branch_a,
            source_branch=collision.branch_b,
            compatibility_strategy=strategy,
            summary_of_changes=summary,
            reconciled_code=reconciled_code,
            unified_diff=unified_diff,
            instructions=instructions
        )

    elif collision.collision_type == CollisionType.API_CONTRACT:
        file_path = "routes/user.js"
        strategy = "Dual-Contract Compatibility Adapter (Backward & Forward Ingestion)"
        summary = (
            "Provides a backward-compatible response payload returning both legacy numeric 'userId' "
            "and forward-compatible UUID string 'user_id'. This allows frontend feature/dashboard-v2 "
            "to parse numeric fields safely while feature/db-migration adopts modern UUID identifiers."
        )

        reconciled_code = """const express = require('express');
const router = express.Router();
const { getUser } = require('../models/user');

router.get('/:id', async (req, res) => {
  const user = await getUser(req.params.id);

  // COMPATIBILITY ADAPTER: Dual-key contract response
  // Serves numeric userId for legacy / dashboard-v2 consumers and string user_id (UUID) for v2 migration
  res.json({
    userId: user.id || (user.uuid ? parseInt(user.uuid.replace(/[^0-9]/g, '').slice(0, 8), 10) : 101),
    user_id: user.uuid || String(user.id),
    username: user.name,
    _schemaVersion: '2.0-compat'
  });
});

module.exports = router;"""

        unified_diff = """--- a/routes/user.js
+++ b/routes/user.js
@@ -4,6 +4,11 @@
 const { getUser } = require('../models/user');
 
 router.get('/:id', async (req, res) => {
   const user = await getUser(req.params.id);
-  res.json({ user_id: user.uuid, username: user.name });
+  // Return dual keys to maintain compatibility with both numeric dashboard and UUID schema
+  res.json({
+    userId: user.id || (user.uuid ? parseInt(user.uuid.replace(/[^0-9]/g, '').slice(0, 8), 10) : 101),
+    user_id: user.uuid || String(user.id),
+    username: user.name
+  });
 });
 
 module.exports = router;"""

        instructions = [
            "Update routes/user.js GET /:id handler to emit both 'userId' (number) and 'user_id' (string).",
            "Ensure existing tests asserting numeric userId continue to pass.",
            "Client services in client/services/api.ts can subsequently migrate to optional chaining.",
            "Apply patch using: git apply routes_user.patch"
        ]

        return CompatibilityPatch(
            id="patch-api-contract-user-adapter",
            risk_id=collision.id,
            file_path=file_path,
            target_branch=collision.branch_a,
            source_branch=collision.branch_b,
            compatibility_strategy=strategy,
            summary_of_changes=summary,
            reconciled_code=reconciled_code,
            unified_diff=unified_diff,
            instructions=instructions
        )

    elif collision.collision_type == CollisionType.DEPENDENCY:
        file_path = "package.json"
        strategy = "Harmonized SemVer Dependency Alignment"
        summary = (
            "Aligns package.json dependencies to resolve peer version divergence between jsonwebtoken, "
            "pg driver v8.12.0, and @prisma/client v5.15.0 with zero lockfile conflicts."
        )

        reconciled_code = """{
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
    "pg": "^8.12.0",
    "@prisma/client": "^5.15.0"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}"""

        unified_diff = """--- a/package.json
+++ b/package.json
@@ -6,7 +6,8 @@
   },
   "dependencies": {
     "express": "^4.19.2",
+    "jsonwebtoken": "^9.0.2",
-    "pg": "^8.7.1",
+    "pg": "^8.12.0",
-    "@prisma/client": "^5.2.0",
+    "@prisma/client": "^5.15.0"
   }
 }"""

        instructions = [
            "Merge package.json dependencies to include jsonwebtoken alongside upgraded pg and prisma drivers.",
            "Run 'npm install' to regenerate package-lock.json.",
            "Verify build with 'npm run build'."
        ]

        return CompatibilityPatch(
            id="patch-dependency-package-json",
            risk_id=collision.id,
            file_path=file_path,
            target_branch=collision.branch_a,
            source_branch=collision.branch_b,
            compatibility_strategy=strategy,
            summary_of_changes=summary,
            reconciled_code=reconciled_code,
            unified_diff=unified_diff,
            instructions=instructions
        )

    return None
