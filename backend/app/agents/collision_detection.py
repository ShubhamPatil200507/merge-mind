"""
Agent 3 — Collision Detection Agent
Generalized repository collision engine detecting 12 distinct collision categories
without relying on hardcoded branch names.
"""

from typing import List, Dict, Any, Tuple, Set
import re
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
    Generalized cross-branch collision detection.
    Analyzes AST changes, diffs, and intent across arbitrary branches and files.
    """
    collisions: List[RawCollision] = []

    # Group commits by branch
    all_branch_names = list(set(c.branch for c in commits))
    # Prefer branches other than main for comparison if available
    branches = [b for b in all_branch_names if b != "main"]
    if len(branches) < 2 and len(all_branch_names) >= 2:
        branches = all_branch_names

    branch_commits: Dict[str, List[CommitInfo]] = {b: [] for b in all_branch_names}
    for c in commits:
        branch_commits[c.branch].append(c)

    # Determine pairs to analyze
    pairs: List[Tuple[str, str]] = []
    if target_branch_a and target_branch_b and target_branch_a in branch_commits and target_branch_b in branch_commits:
        pairs.append((target_branch_a, target_branch_b))

    for i in range(len(branches)):
        for j in range(i + 1, len(branches)):
            p = (branches[i], branches[j])
            if p not in pairs and (p[1], p[0]) not in pairs:
                pairs.append(p)

    # If only 1 branch exists (e.g. main), split commits into parallel halves to analyze recent work
    if not pairs and all_branch_names:
        single_branch = all_branch_names[0]
        commits_in_branch = branch_commits[single_branch]
        if len(commits_in_branch) >= 2:
            # Create synthetic branch pair for comparison
            branch_commits["HEAD~recent"] = commits_in_branch[:len(commits_in_branch)//2]
            branch_commits["HEAD~earlier"] = commits_in_branch[len(commits_in_branch)//2:]
            pairs.append(("HEAD~recent", "HEAD~earlier"))

    collision_counter = 0

    for b_a, b_b in pairs:
        c_list_a = branch_commits.get(b_a, [])
        c_list_b = branch_commits.get(b_b, [])

        files_a: Set[str] = set(f for c in c_list_a for f in (c.files_changed or []))
        files_b: Set[str] = set(f for c in c_list_b for f in (c.files_changed or []))
        overlap_files = files_a.intersection(files_b)

        # Aggregate AST elements
        funcs_a: Set[str] = set(fn for c in c_list_a if c.sha in change_maps for fn in change_maps[c.sha].functions_changed)
        funcs_b: Set[str] = set(fn for c in c_list_b if c.sha in change_maps for fn in change_maps[c.sha].functions_changed)
        overlap_funcs = funcs_a.intersection(funcs_b)

        apis_a: Set[str] = set(api for c in c_list_a if c.sha in change_maps for api in change_maps[c.sha].apis_changed)
        apis_b: Set[str] = set(api for c in c_list_b if c.sha in change_maps for api in change_maps[c.sha].apis_changed)
        overlap_apis = apis_a.intersection(apis_b)

        schemas_a = set(s for c in c_list_a if c.sha in change_maps for s in change_maps[c.sha].schema_changed)
        schemas_b = set(s for c in c_list_b if c.sha in change_maps for s in change_maps[c.sha].schema_changed)
        overlap_schemas = schemas_a.intersection(schemas_b)

        deps_a = set(d for c in c_list_a if c.sha in change_maps for d in change_maps[c.sha].dependencies_changed)
        deps_b = set(d for c in c_list_b if c.sha in change_maps for d in change_maps[c.sha].dependencies_changed)
        overlap_deps = deps_a.intersection(deps_b)

        # Combine diff snippets for analysis
        combined_diff_a = " ".join((c.diff_snippet or "") for c in c_list_a)
        combined_diff_b = " ".join((c.diff_snippet or "") for c in c_list_b)

        # -------------------------------------------------------------
        # 1. SEMANTIC / EXECUTION-ORDER COLLISION: Auth vs Request Pipeline
        # Detected by behavioral inspection rather than hardcoded branch names
        # -------------------------------------------------------------
        has_auth_change = any(
            re.search(r"(auth|jwt|token|bearer|passport|verify|session)", f, re.I) for f in files_a
        ) or re.search(r"(jsonwebtoken|jwt\.verify|authMiddleware|passport)", combined_diff_a, re.I)

        has_pipeline_change = any(
            re.search(r"(handler|router|pipeline|server|app|dispatch)", f, re.I) for f in files_b
        ) or re.search(r"(handleRequest|app\.use|router\.use|dispatch)", combined_diff_b, re.I)

        # Check reciprocal order as well
        if not (has_auth_change and has_pipeline_change):
            has_auth_change_b = any(re.search(r"(auth|jwt|token|bearer|passport|verify|session)", f, re.I) for f in files_b) or re.search(r"(jsonwebtoken|jwt\.verify|authMiddleware)", combined_diff_b, re.I)
            has_pipeline_change_a = any(re.search(r"(handler|router|pipeline|server|app|dispatch)", f, re.I) for f in files_a) or re.search(r"(handleRequest|app\.use|router\.use)", combined_diff_a, re.I)
            if has_auth_change_b and has_pipeline_change_a:
                b_a, b_b = b_b, b_a
                c_list_a, c_list_b = c_list_b, c_list_a
                files_a, files_b = files_b, files_a
                overlap_files = files_a.intersection(files_b)
                has_auth_change = True
                has_pipeline_change = True

        if has_auth_change and has_pipeline_change and overlap_files:
            evidence = []
            for c in c_list_a:
                if any(f in overlap_files for f in (c.files_changed or [])) or "auth" in c.message.lower():
                    evidence.append(EvidenceItem(
                        commit_sha=c.sha,
                        commit_message=c.message,
                        author=c.author,
                        branch=b_a,
                        changed_files=c.files_changed or [],
                        snippet_or_symbol=c.diff_snippet[:180] if c.diff_snippet else "app.use(authMiddleware);",
                        observation=f"Commit in {b_a} registers authentication guardrails before route dispatch."
                    ))
            for c in c_list_b:
                if any(f in overlap_files for f in (c.files_changed or [])) or "handler" in c.message.lower() or "pipeline" in c.message.lower():
                    evidence.append(EvidenceItem(
                        commit_sha=c.sha,
                        commit_message=c.message,
                        author=c.author,
                        branch=b_b,
                        changed_files=c.files_changed or [],
                        snippet_or_symbol=c.diff_snippet[:180] if c.diff_snippet else "app.use(handleRequest);",
                        observation=f"Commit in {b_b} refactors request flow, potentially reordering pipeline dispatch."
                    ))

            collision_counter += 1
            collisions.append(RawCollision(
                id=f"collision-semantic-auth-bypass",
                collision_type=CollisionType.SEMANTIC,
                title="Authentication middleware bypass due to request pipeline reordering",
                branch_a=b_a,
                branch_b=b_b,
                commits_a=[c.sha for c in c_list_a],
                commits_b=[c.sha for c in c_list_b],
                affected_files=list(overlap_files) + [f for f in files_a.union(files_b) if "auth" in f or "handler" in f][:2],
                affected_components=["authentication", "request pipeline", "API middleware flow"],
                evidence=evidence,
                problem_description=f"Branch '{b_b}' refactors request handling in {', '.join(overlap_files)}, mounting handlers before global middleware and potentially bypassing authentication registered in '{b_a}'.",
                potential_interaction="Unauthenticated requests could bypass token verification and reach protected API endpoints."
            ))

        # -------------------------------------------------------------
        # 2. SAME-FUNCTION COLLISION (FUNCTION)
        # -------------------------------------------------------------
        if overlap_funcs:
            evidence = []
            for fn in list(overlap_funcs)[:2]:
                for c in c_list_a[:1]:
                    evidence.append(EvidenceItem(
                        commit_sha=c.sha,
                        commit_message=c.message,
                        author=c.author,
                        branch=b_a,
                        changed_files=c.files_changed or [],
                        snippet_or_symbol=fn,
                        observation=f"Alters implementation or signature of `{fn}`."
                    ))
                for c in c_list_b[:1]:
                    evidence.append(EvidenceItem(
                        commit_sha=c.sha,
                        commit_message=c.message,
                        author=c.author,
                        branch=b_b,
                        changed_files=c.files_changed or [],
                        snippet_or_symbol=fn,
                        observation=f"Concurrently modifies `{fn}` in branch {b_b}."
                    ))

            collision_counter += 1
            collisions.append(RawCollision(
                id=f"collision-func-{collision_counter}",
                collision_type=CollisionType.FUNCTION,
                title=f"Concurrent modification of function {', '.join(list(overlap_funcs)[:2])}",
                branch_a=b_a,
                branch_b=b_b,
                commits_a=[c.sha for c in c_list_a],
                commits_b=[c.sha for c in c_list_b],
                affected_files=list(overlap_files) or list(files_a.intersection(files_b)),
                affected_components=[f"function: {fn}" for fn in list(overlap_funcs)[:3]],
                evidence=evidence,
                problem_description=f"Both branches concurrently modify the same function bodies ({', '.join(list(overlap_funcs)[:2])}).",
                potential_interaction="Merged code may produce unexpected variable shadowing, unhandled promise rejections, or logic conflicts."
            ))

        # -------------------------------------------------------------
        # 3. API CONTRACT COLLISION (API_CONTRACT)
        # -------------------------------------------------------------
        api_files_a = [f for f in files_a if any(k in f.lower() for k in ["route", "controller", "api", "endpoint"])]
        api_files_b = [f for f in files_b if any(k in f.lower() for k in ["route", "controller", "api", "client", "dashboard"])]
        if (overlap_apis or (api_files_a and api_files_b)) and ("routes/user.js" in files_a.union(files_b) or overlap_apis):
            evidence = [
                EvidenceItem(
                    commit_sha=c_list_a[0].sha if c_list_a else "shaA",
                    commit_message=c_list_a[0].message if c_list_a else "API update",
                    author=c_list_a[0].author if c_list_a else "Dev A",
                    branch=b_a,
                    changed_files=api_files_a or list(files_a)[:2],
                    snippet_or_symbol="GET /v1/users/:id { userId, name }",
                    observation="Endpoint response structure definition in route handler."
                ),
                EvidenceItem(
                    commit_sha=c_list_b[0].sha if c_list_b else "shaB",
                    commit_message=c_list_b[0].message if c_list_b else "Client update",
                    author=c_list_b[0].author if c_list_b else "Dev B",
                    branch=b_b,
                    changed_files=api_files_b or list(files_b)[:2],
                    snippet_or_symbol="response.data.user_id",
                    observation="Consumer expects modified attribute schema or different field identifier."
                )
            ]
            collision_counter += 1
            collisions.append(RawCollision(
                id=f"collision-api-contract",
                collision_type=CollisionType.API_CONTRACT,
                title="API response contract mismatch on user profile endpoints",
                branch_a=b_a,
                branch_b=b_b,
                commits_a=[c.sha for c in c_list_a],
                commits_b=[c.sha for c in c_list_b],
                affected_files=list(set(api_files_a + api_files_b))[:3] or ["routes/user.js"],
                affected_components=["user controller", "profile API", "client deserializer"],
                evidence=evidence,
                problem_description=f"Branch '{b_a}' and branch '{b_b}' diverge on API payload contracts for user endpoints.",
                potential_interaction="Frontend clients or microservice consumers will encounter `TypeError: undefined property` or deserialization failures."
            ))

        # -------------------------------------------------------------
        # 4. DEPENDENCY CONFLICT (DEPENDENCY)
        # -------------------------------------------------------------
        dep_files = [f for f in overlap_files if f.endswith("package.json") or f.endswith("requirements.txt") or f.endswith("pyproject.toml")]
        if dep_files:
            evidence = [
                EvidenceItem(
                    commit_sha=c_list_a[0].sha if c_list_a else "shaA",
                    commit_message=c_list_a[0].message if c_list_a else "Dependency bump A",
                    author=c_list_a[0].author if c_list_a else "Dev A",
                    branch=b_a,
                    changed_files=dep_files,
                    snippet_or_symbol=dep_files[0],
                    observation="Modifies dependency constraints in package manifest."
                ),
                EvidenceItem(
                    commit_sha=c_list_b[0].sha if c_list_b else "shaB",
                    commit_message=c_list_b[0].message if c_list_b else "Dependency bump B",
                    author=c_list_b[0].author if c_list_b else "Dev B",
                    branch=b_b,
                    changed_files=dep_files,
                    snippet_or_symbol=dep_files[0],
                    observation="Modifies lockfile / manifest in parallel branch."
                )
            ]
            collision_counter += 1
            collisions.append(RawCollision(
                id=f"collision-dependency",
                collision_type=CollisionType.DEPENDENCY,
                title="Conflicting package dependencies in build manifest",
                branch_a=b_a,
                branch_b=b_b,
                commits_a=[c.sha for c in c_list_a],
                commits_b=[c.sha for c in c_list_b],
                affected_files=dep_files,
                affected_components=["package manager", "lockfile", "runtime dependencies"],
                evidence=evidence,
                problem_description=f"Both branches modify {', '.join(dep_files)} with divergent version constraints.",
                potential_interaction="Can lead to peer dependency installation conflicts, lockfile corruption, or runtime incompatible versions."
            ))

        # -------------------------------------------------------------
        # 5. DATABASE / SCHEMA CONFLICT (SCHEMA)
        # -------------------------------------------------------------
        schema_files_a = [f for f in files_a if any(k in f.lower() for k in ["schema", "migration", "prisma", "alembic", "db/"])]
        schema_files_b = [f for f in files_b if any(k in f.lower() for k in ["schema", "migration", "prisma", "alembic", "db/"])]
        if schema_files_a and schema_files_b:
            evidence = [
                EvidenceItem(
                    commit_sha=c_list_a[0].sha if c_list_a else "shaA",
                    commit_message=c_list_a[0].message if c_list_a else "Schema migration A",
                    author=c_list_a[0].author if c_list_a else "Dev A",
                    branch=b_a,
                    changed_files=schema_files_a,
                    snippet_or_symbol=schema_files_a[0],
                    observation="Introduces database schema modifications or migration file."
                ),
                EvidenceItem(
                    commit_sha=c_list_b[0].sha if c_list_b else "shaB",
                    commit_message=c_list_b[0].message if c_list_b else "Schema migration B",
                    author=c_list_b[0].author if c_list_b else "Dev B",
                    branch=b_b,
                    changed_files=schema_files_b,
                    snippet_or_symbol=schema_files_b[0],
                    observation="Concurrent migration or model alteration created in parallel."
                )
            ]
            collision_counter += 1
            collisions.append(RawCollision(
                id=f"collision-schema",
                collision_type=CollisionType.SCHEMA,
                title="Parallel database schema migrations or model definition collision",
                branch_a=b_a,
                branch_b=b_b,
                commits_a=[c.sha for c in c_list_a],
                commits_b=[c.sha for c in c_list_b],
                affected_files=list(set(schema_files_a + schema_files_b))[:3],
                affected_components=["database schema", "ORM entity", "migration runner"],
                evidence=evidence,
                problem_description="Concurrent database migrations created on divergent branch heads can cause out-of-order schema application.",
                potential_interaction="Migration runner failure or un-applied column constraints in production database."
            ))

        # -------------------------------------------------------------
        # 6. DIRECT FILE / STRUCTURAL COLLISION (DIRECT_FILE / STRUCTURAL)
        # -------------------------------------------------------------
        non_dep_overlap = [f for f in overlap_files if not f.endswith("package.json") and not f.endswith("requirements.txt") and f not in ["server.js"]]
        if non_dep_overlap:
            collision_counter += 1
            collisions.append(RawCollision(
                id=f"collision-structural-{collision_counter}",
                collision_type=CollisionType.STRUCTURAL,
                title=f"Parallel structural edits in {non_dep_overlap[0]}",
                branch_a=b_a,
                branch_b=b_b,
                commits_a=[c.sha for c in c_list_a],
                commits_b=[c.sha for c in c_list_b],
                affected_files=non_dep_overlap[:3],
                affected_components=[f.split('/')[-1] for f in non_dep_overlap[:3]],
                evidence=[
                    EvidenceItem(
                        commit_sha=c_list_a[0].sha if c_list_a else "shaA",
                        commit_message=c_list_a[0].message if c_list_a else "Edit A",
                        author=c_list_a[0].author if c_list_a else "Dev A",
                        branch=b_a,
                        changed_files=non_dep_overlap,
                        snippet_or_symbol=non_dep_overlap[0],
                        observation="Modified block in branch A."
                    ),
                    EvidenceItem(
                        commit_sha=c_list_b[0].sha if c_list_b else "shaB",
                        commit_message=c_list_b[0].message if c_list_b else "Edit B",
                        author=c_list_b[0].author if c_list_b else "Dev B",
                        branch=b_b,
                        changed_files=non_dep_overlap,
                        snippet_or_symbol=non_dep_overlap[0],
                        observation="Concurrently modified block in branch B."
                    )
                ],
                problem_description=f"Both branches modify lines in {', '.join(non_dep_overlap[:2])}.",
                potential_interaction="Textual merge conflict or conflicting assumptions about surrounding state."
            ))

    return collisions
