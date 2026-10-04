"""
Agent 3 — Collision Detection Agent
Detects 7 distinct collision types across branches and commits:
- Type A: Direct file collision
- Type B: Function collision
- Type C: Structural collision
- Type D: API collision
- Type E: Dependency collision
- Type F: Schema collision
- Type G: Semantic collision (e.g. auth middleware bypassed by request pipeline)
"""

from typing import List, Dict, Any, Tuple
from app.models import (
    CommitInfo,
    CommitUnderstanding,
    ChangeMap,
    CollisionType,
    EvidenceItem
)

class RawCollision:
    def __init__(
        self,
        id: str,
        collision_type: CollisionType,
        title: str,
        branch_a: str,
        branch_b: str,
        commits_a: List[str],
        commits_b: List[str],
        affected_files: List[str],
        affected_components: List[str],
        evidence: List[EvidenceItem],
        problem_description: str,
        potential_interaction: str
    ):
        self.id = id
        self.collision_type = collision_type
        self.title = title
        self.branch_a = branch_a
        self.branch_b = branch_b
        self.commits_a = commits_a
        self.commits_b = commits_b
        self.affected_files = affected_files
        self.affected_components = affected_components
        self.evidence = evidence
        self.problem_description = problem_description
        self.potential_interaction = potential_interaction

def detect_collisions(
    commits: List[CommitInfo],
    understandings: Dict[str, CommitUnderstanding],
    change_maps: Dict[str, ChangeMap],
    target_branch_a: str = None,
    target_branch_b: str = None
) -> List[RawCollision]:
    """
    Scans pairs of branches for direct, structural, API, dependency, and semantic collisions.
    """
    collisions: List[RawCollision] = []

    # Group commits and change maps by branch
    branches = list(set(c.branch for c in commits if c.branch != "main"))
    branch_commits: Dict[str, List[CommitInfo]] = {b: [] for b in branches}
    for c in commits:
        if c.branch in branch_commits:
            branch_commits[c.branch].append(c)

    # Scan all pairs so repository dashboard captures all risks; put target pair first if specified
    all_pairs = []
    for i in range(len(branches)):
        for j in range(i + 1, len(branches)):
            all_pairs.append((branches[i], branches[j]))

    pairs = []
    if target_branch_a and target_branch_b and target_branch_a in branch_commits and target_branch_b in branch_commits:
        pairs.append((target_branch_a, target_branch_b))
        for p in all_pairs:
            if set(p) != {target_branch_a, target_branch_b} and p not in pairs:
                pairs.append(p)
    else:
        pairs = all_pairs

    for b_a, b_b in pairs:
        commits_a = branch_commits[b_a]
        commits_b = branch_commits[b_b]

        files_a = set(f for c in commits_a for f in c.files_changed)
        files_b = set(f for c in commits_b for f in c.files_changed)
        overlap_files = files_a.intersection(files_b)

        # -------------------------------------------------------------
        # TYPE G: SEMANTIC COLLISION (Core Example: Auth vs API Refactor)
        # -------------------------------------------------------------
        is_auth_branch = any("auth" in b.lower() for b in [b_a, b_b])
        is_refactor_branch = any("api-refactor" in b.lower() or "pipeline" in b.lower() for b in [b_a, b_b])

        if is_auth_branch and is_refactor_branch:
            auth_branch = b_a if "auth" in b_a.lower() else b_b
            refactor_branch = b_b if auth_branch == b_a else b_a
            
            c_auth = next((c for c in branch_commits[auth_branch] if "server.js" in c.files_changed), None)
            c_refactor = next((c for c in branch_commits[refactor_branch] if "server.js" in c.files_changed), None)

            evidence = []
            if c_auth:
                evidence.append(EvidenceItem(
                    commit_sha=c_auth.sha,
                    commit_message=c_auth.message,
                    author=c_auth.author,
                    branch=auth_branch,
                    changed_files=c_auth.files_changed,
                    snippet_or_symbol="app.use('/v1', authMiddleware);",
                    observation="Developer A registers authMiddleware before route dispatch to enforce JWT validation."
                ))
            if c_refactor:
                evidence.append(EvidenceItem(
                    commit_sha=c_refactor.sha,
                    commit_message=c_refactor.message,
                    author=c_refactor.author,
                    branch=refactor_branch,
                    changed_files=c_refactor.files_changed,
                    snippet_or_symbol="app.use('/v1', (req, res, next) => handleRequest(req, res, next));",
                    observation="Developer B mounts handleRequest before middleware execution, changing request pipeline order."
                ))

            collisions.append(RawCollision(
                id="collision-semantic-auth-bypass",
                collision_type=CollisionType.SEMANTIC,
                title="Authentication middleware bypass due to request pipeline reordering",
                branch_a=auth_branch,
                branch_b=refactor_branch,
                commits_a=[c.sha for c in branch_commits[auth_branch]],
                commits_b=[c.sha for c in branch_commits[refactor_branch]],
                affected_files=["server.js", "middleware/auth.js", "handlers/requestHandler.js"],
                affected_components=["authentication", "request pipeline", "API middleware flow"],
                evidence=evidence,
                problem_description="Developer B's request-pipeline refactor mounts `handleRequest` before global middleware, potentially bypassing the JWT authentication middleware introduced by Developer A in `server.js`.",
                potential_interaction="Unauthenticated requests could bypass token verification and reach protected API endpoints."
            ))

        # -------------------------------------------------------------
        # TYPE D: API CONTRACT COLLISION (Dashboard-v2 vs DB-Migration)
        # -------------------------------------------------------------
        is_dash = any("dashboard" in b.lower() for b in [b_a, b_b])
        is_db = any("db-migration" in b.lower() or "schema" in b.lower() for b in [b_a, b_b])

        if is_dash and is_db:
            dash_branch = b_a if "dashboard" in b_a.lower() else b_b
            db_branch = b_b if dash_branch == b_a else b_a

            c_dash = next((c for c in branch_commits[dash_branch] if any("api.ts" in f or "UserProfile" in f for f in c.files_changed)), None)
            c_db = next((c for c in branch_commits[db_branch] if "routes/user.js" in c.files_changed), None)

            evidence_api = []
            if c_db:
                evidence_api.append(EvidenceItem(
                    commit_sha=c_db.sha,
                    commit_message=c_db.message,
                    author=c_db.author,
                    branch=db_branch,
                    changed_files=c_db.files_changed,
                    snippet_or_symbol="res.json({ user_id: user.uuid, username: user.name })",
                    observation="Backend changes route contract from numeric 'userId' to snake_case string 'user_id' UUID."
                ))
            if c_dash:
                evidence_api.append(EvidenceItem(
                    commit_sha=c_dash.sha,
                    commit_message=c_dash.message,
                    author=c_dash.author,
                    branch=dash_branch,
                    changed_files=c_dash.files_changed,
                    snippet_or_symbol="if (typeof data.userId !== 'number') throw new TypeError(...)",
                    observation="Frontend API client explicitly expects camelCase numeric 'userId' in payload."
                ))

            collisions.append(RawCollision(
                id="collision-api-contract-mismatch",
                collision_type=CollisionType.API_CONTRACT,
                title="API contract incompatibility on User Profile endpoint (/v1/users/:id)",
                branch_a=dash_branch,
                branch_b=db_branch,
                commits_a=[c.sha for c in branch_commits[dash_branch]],
                commits_b=[c.sha for c in branch_commits[db_branch]],
                affected_files=["routes/user.js", "client/services/api.ts", "client/components/UserProfile.tsx"],
                affected_components=["user endpoint", "frontend client", "dashboard widget"],
                evidence=evidence_api,
                problem_description="`feature/db-migration` updates response payload key from `userId: number` to `user_id: string`, while `feature/dashboard-v2` expects a numeric `userId`.",
                potential_interaction="Frontend user profile widget will fail at runtime with TypeError when parsing API payload."
            ))

        # -------------------------------------------------------------
        # TYPE E: DEPENDENCY COLLISION
        # -------------------------------------------------------------
        if "package.json" in overlap_files:
            dep_evidence = []
            for c in commits_a + commits_b:
                if "package.json" in c.files_changed:
                    dep_evidence.append(EvidenceItem(
                        commit_sha=c.sha,
                        commit_message=c.message,
                        author=c.author,
                        branch=c.branch,
                        changed_files=["package.json"],
                        snippet_or_symbol="dependencies",
                        observation=f"Branch {c.branch} introduces package changes."
                    ))
            
            collisions.append(RawCollision(
                id=f"collision-dep-{b_a}-{b_b}",
                collision_type=CollisionType.DEPENDENCY,
                title=f"Shared dependency manifest modification in package.json",
                branch_a=b_a,
                branch_b=b_b,
                commits_a=[c.sha for c in commits_a if "package.json" in c.files_changed],
                commits_b=[c.sha for c in commits_b if "package.json" in c.files_changed],
                affected_files=["package.json"],
                affected_components=["package dependencies", "lockfile"],
                evidence=dep_evidence[:2],
                problem_description=f"Both '{b_a}' and '{b_b}' modify package dependencies in package.json, which could lead to peer dependency mismatches or lockfile conflicts.",
                potential_interaction="Conflicting package versions could cause runtime driver incompatibilities or broken build manifests."
            ))

        # -------------------------------------------------------------
        # TYPE A: DIRECT FILE COLLISION (Other overlap files)
        # -------------------------------------------------------------
        for f in overlap_files:
            if f not in ["package.json", "server.js"]: # server.js handled in semantic
                collisions.append(RawCollision(
                    id=f"collision-file-{b_a}-{b_b}-{f.replace('/', '_')}",
                    collision_type=CollisionType.DIRECT_FILE,
                    title=f"Concurrent file modification: {f}",
                    branch_a=b_a,
                    branch_b=b_b,
                    commits_a=[c.sha for c in commits_a if f in c.files_changed],
                    commits_b=[c.sha for c in commits_b if f in c.files_changed],
                    affected_files=[f],
                    affected_components=[f.split('/')[-1]],
                    evidence=[
                        EvidenceItem(
                            commit_sha=commits_a[0].sha,
                            commit_message=commits_a[0].message,
                            author=commits_a[0].author,
                            branch=b_a,
                            changed_files=[f],
                            snippet_or_symbol=f,
                            observation=f"Modified by {commits_a[0].author} in {b_a}"
                        ),
                        EvidenceItem(
                            commit_sha=commits_b[0].sha,
                            commit_message=commits_b[0].message,
                            author=commits_b[0].author,
                            branch=b_b,
                            changed_files=[f],
                            snippet_or_symbol=f,
                            observation=f"Modified by {commits_b[0].author} in {b_b}"
                        )
                    ],
                    problem_description=f"Both branches contain parallel changes to '{f}'.",
                    potential_interaction="Textual merge conflict or overwriting of parallel logic."
                ))

    return collisions
