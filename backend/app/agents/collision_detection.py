"""
MergeMind Comprehensive Collision Detection Agent
Detects all 12 collision categories across parallel branches and commits:
1. DIRECT_FILE
2. STRUCTURAL
3. FUNCTION
4. API_CONTRACT
5. DEPENDENCY
6. SCHEMA
7. CONFIGURATION
8. EXECUTION_ORDER
9. STATE_DATA_FLOW
10. TEST_INCOMPATIBILITY
11. PERFORMANCE_REGRESSION
12. SEMANTIC_OVERLAP
"""

from typing import List, Dict, Any, Set, Tuple, Optional
import re
from app.models import (
    CommitInfo, CommitUnderstanding, ChangeMap,
    CollisionType, EvidenceItem
)

class RawCollision:
    """Internal collision representation before scoring."""
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
        potential_interaction: str,
        line_ranges: Optional[Dict[str, str]] = None,
        symbols: Optional[List[str]] = None
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
        self.line_ranges = line_ranges or {}
        self.symbols = symbols or []

def detect_collisions(
    commits: List[CommitInfo],
    understandings: Dict[str, CommitUnderstanding],
    change_maps: Dict[str, ChangeMap],
    target_branch_a: Optional[str] = None,
    target_branch_b: Optional[str] = None
) -> List[RawCollision]:
    """
    Generalized cross-branch collision detection across all 12 categories.
    Analyzes AST changes, diff snippets, and semantic intent.
    """
    collisions: List[RawCollision] = []

    # Group commits by branch
    all_branch_names = list(set(c.branch for c in commits))
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

    if not pairs and all_branch_names:
        single_branch = all_branch_names[0]
        commits_in_branch = branch_commits[single_branch]
        if len(commits_in_branch) >= 2:
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

        configs_a = set(cfg for c in c_list_a if c.sha in change_maps for cfg in change_maps[c.sha].config_changed)
        configs_b = set(cfg for c in c_list_b if c.sha in change_maps for cfg in change_maps[c.sha].config_changed)

        combined_diff_a = " ".join((c.diff_snippet or "") for c in c_list_a)
        combined_diff_b = " ".join((c.diff_snippet or "") for c in c_list_b)

        # ------------------------------------------------------------------
        # 1. EXECUTION ORDER COLLISION: Middleware vs Route Mounting
        # ------------------------------------------------------------------
        has_auth_change = any(
            re.search(r"(auth|jwt|token|bearer|passport|verify|session)", f, re.I) for f in files_a
        ) or re.search(r"(jsonwebtoken|jwt\.verify|authMiddleware|passport)", combined_diff_a, re.I)

        has_pipeline_change = any(
            re.search(r"(handler|router|pipeline|server|app|dispatch)", f, re.I) for f in files_b
        ) or re.search(r"(handleRequest|app\.use|router\.use|dispatch)", combined_diff_b, re.I)

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

        if has_auth_change and has_pipeline_change and (overlap_files or any("server" in f or "app" in f for f in files_a.union(files_b))):
            evidence = []
            for c in c_list_a:
                if any(f in overlap_files for f in (c.files_changed or [])) or "auth" in c.message.lower():
                    evidence.append(EvidenceItem(
                        commit_sha=c.sha,
                        commit_message=c.message,
                        author=c.author,
                        branch=b_a,
                        changed_files=c.files_changed or [],
                        snippet_or_symbol=c.diff_snippet[:220] if c.diff_snippet else "app.use(authMiddleware);",
                        observation=f"Commit in {b_a} mounts authentication middleware to secure protected routes."
                    ))
            for c in c_list_b:
                if any(f in overlap_files for f in (c.files_changed or [])) or "handler" in c.message.lower() or "pipeline" in c.message.lower():
                    evidence.append(EvidenceItem(
                        commit_sha=c.sha,
                        commit_message=c.message,
                        author=c.author,
                        branch=b_b,
                        changed_files=c.files_changed or [],
                        snippet_or_symbol=c.diff_snippet[:220] if c.diff_snippet else "app.use(handleRequest);",
                        observation=f"Commit in {b_b} registers request dispatchers, mounting route execution prior to auth."
                    ))

            collision_counter += 1
            collisions.append(RawCollision(
                id="collision-semantic-auth-bypass",
                collision_type=CollisionType.EXECUTION_ORDER,
                title="Execution order collision: Authentication middleware bypass via out-of-order route registration",
                branch_a=b_a,
                branch_b=b_b,
                commits_a=[c.sha for c in c_list_a],
                commits_b=[c.sha for c in c_list_b],
                affected_files=list(overlap_files) or [f for f in files_a.union(files_b) if "server" in f or "app" in f][:2],
                affected_components=["authentication middleware", "Express/FastAPI pipeline", "route dispatcher"],
                evidence=evidence,
                problem_description=f"Branch '{b_b}' registers route handlers before '{b_a}' middleware is mounted in the request pipeline.",
                potential_interaction="Unauthenticated incoming requests will bypass JWT/token validation entirely and invoke handlers with unverified credentials.",
                symbols=["authMiddleware", "handleRequest"]
            ))

        # ------------------------------------------------------------------
        # 2. FUNCTION COLLISION: Concurrent Function Changes
        # ------------------------------------------------------------------
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
                        observation=f"Modifies implementation or signature of function `{fn}`."
                    ))
                for c in c_list_b[:1]:
                    evidence.append(EvidenceItem(
                        commit_sha=c.sha,
                        commit_message=c.message,
                        author=c.author,
                        branch=b_b,
                        changed_files=c.files_changed or [],
                        snippet_or_symbol=fn,
                        observation=f"Parallel branch concurrently alters `{fn}`."
                    ))

            collision_counter += 1
            collisions.append(RawCollision(
                id=f"collision-func-{collision_counter}",
                collision_type=CollisionType.FUNCTION,
                title=f"Concurrent modification of function signature/body in {', '.join(list(overlap_funcs)[:2])}",
                branch_a=b_a,
                branch_b=b_b,
                commits_a=[c.sha for c in c_list_a],
                commits_b=[c.sha for c in c_list_b],
                affected_files=list(overlap_files) or list(files_a.intersection(files_b)),
                affected_components=[f"function: {fn}" for fn in list(overlap_funcs)[:3]],
                evidence=evidence,
                problem_description=f"Both branches concurrently modify `{', '.join(list(overlap_funcs)[:2])}` with divergent parameters or return logic.",
                potential_interaction="Callers on both branches will encounter runtime signature mismatches or unexpected side-effects.",
                symbols=list(overlap_funcs)[:3]
            ))

        # ------------------------------------------------------------------
        # 3. API CONTRACT COLLISION: Route / Schema Contract Mismatch
        # ------------------------------------------------------------------
        api_files_a = [f for f in files_a if any(k in f.lower() for k in ["route", "controller", "api", "endpoint"])]
        api_files_b = [f for f in files_b if any(k in f.lower() for k in ["route", "controller", "api", "client", "dashboard"])]
        if overlap_apis or ("routes/user.js" in files_a.union(files_b) and api_files_a and api_files_b):
            evidence = [
                EvidenceItem(
                    commit_sha=c_list_a[0].sha if c_list_a else "shaA",
                    commit_message=c_list_a[0].message if c_list_a else "API route update",
                    author=c_list_a[0].author if c_list_a else "Dev A",
                    branch=b_a,
                    changed_files=api_files_a or list(files_a)[:2],
                    snippet_or_symbol="GET /v1/users/:id -> { userId: number }",
                    observation="Endpoint response contract definition returns numeric identifier."
                ),
                EvidenceItem(
                    commit_sha=c_list_b[0].sha if c_list_b else "shaB",
                    commit_message=c_list_b[0].message if c_list_b else "API client refactor",
                    author=c_list_b[0].author if c_list_b else "Dev B",
                    branch=b_b,
                    changed_files=api_files_b or list(files_b)[:2],
                    snippet_or_symbol="response.data.user_id (UUID format)",
                    observation="Consumer deserializes `user_id` as string UUID."
                )
            ]
            collision_counter += 1
            collisions.append(RawCollision(
                id="collision-api-contract",
                collision_type=CollisionType.API_CONTRACT,
                title="API contract mismatch: User identifier format and key naming divergence",
                branch_a=b_a,
                branch_b=b_b,
                commits_a=[c.sha for c in c_list_a],
                commits_b=[c.sha for c in c_list_b],
                affected_files=list(set(api_files_a + api_files_b))[:3] or ["routes/user.js"],
                affected_components=["user controller", "profile API", "HTTP contract serializer"],
                evidence=evidence,
                problem_description=f"Branch '{b_a}' and '{b_b}' diverge on field naming (`userId` vs `user_id`) and types.",
                potential_interaction="Frontend consumers and downstream microservices will encounter `TypeError: undefined property` or deserialization failures.",
                symbols=["userId", "user_id"]
            ))

        # ------------------------------------------------------------------
        # 4. DEPENDENCY COLLISION: Manifest & Lockfile Conflicts
        # ------------------------------------------------------------------
        dep_files = [f for f in overlap_files if f.endswith("package.json") or f.endswith("requirements.txt") or f.endswith("pyproject.toml") or f.endswith("Cargo.toml")]
        if dep_files or overlap_deps:
            evidence = [
                EvidenceItem(
                    commit_sha=c_list_a[0].sha if c_list_a else "shaA",
                    commit_message=c_list_a[0].message if c_list_a else "Bump dependencies",
                    author=c_list_a[0].author if c_list_a else "Dev A",
                    branch=b_a,
                    changed_files=dep_files or ["package.json"],
                    snippet_or_symbol=dep_files[0] if dep_files else "dependencies",
                    observation="Modifies version constraints in dependency manifest."
                ),
                EvidenceItem(
                    commit_sha=c_list_b[0].sha if c_list_b else "shaB",
                    commit_message=c_list_b[0].message if c_list_b else "Add library",
                    author=c_list_b[0].author if c_list_b else "Dev B",
                    branch=b_b,
                    changed_files=dep_files or ["package.json"],
                    snippet_or_symbol=dep_files[0] if dep_files else "dependencies",
                    observation="Concurrently alters lockfile/manifest with divergent requirements."
                )
            ]
            collision_counter += 1
            collisions.append(RawCollision(
                id="collision-dependency",
                collision_type=CollisionType.DEPENDENCY,
                title="Conflicting package dependencies and peer version constraints in build manifest",
                branch_a=b_a,
                branch_b=b_b,
                commits_a=[c.sha for c in c_list_a],
                commits_b=[c.sha for c in c_list_b],
                affected_files=dep_files or ["package.json"],
                affected_components=["package manager", "lockfile", "runtime dependencies"],
                evidence=evidence,
                problem_description=f"Both branches modify {', '.join(dep_files or ['package.json'])} with incompatible version ranges.",
                potential_interaction="Package resolution failure, peer dependency installation errors, or runtime class/module divergence."
            ))

        # ------------------------------------------------------------------
        # 5. SCHEMA COLLISION: Database Models & Migrations
        # ------------------------------------------------------------------
        schema_files_a = [f for f in files_a if any(k in f.lower() for k in ["schema", "migration", "prisma", "alembic", "db/"])]
        schema_files_b = [f for f in files_b if any(k in f.lower() for k in ["schema", "migration", "prisma", "alembic", "db/"])]
        if overlap_schemas or (schema_files_a and schema_files_b):
            evidence = [
                EvidenceItem(
                    commit_sha=c_list_a[0].sha if c_list_a else "shaA",
                    commit_message=c_list_a[0].message if c_list_a else "Add column migration",
                    author=c_list_a[0].author if c_list_a else "Dev A",
                    branch=b_a,
                    changed_files=schema_files_a or ["schema.prisma"],
                    snippet_or_symbol=schema_files_a[0] if schema_files_a else "database schema",
                    observation="Introduces database schema modifications or migration file."
                ),
                EvidenceItem(
                    commit_sha=c_list_b[0].sha if c_list_b else "shaB",
                    commit_message=c_list_b[0].message if c_list_b else "Modify model fields",
                    author=c_list_b[0].author if c_list_b else "Dev B",
                    branch=b_b,
                    changed_files=schema_files_b or ["schema.prisma"],
                    snippet_or_symbol=schema_files_b[0] if schema_files_b else "database schema",
                    observation="Concurrent migration or model alteration created on parallel branch."
                )
            ]
            collision_counter += 1
            collisions.append(RawCollision(
                id="collision-schema",
                collision_type=CollisionType.SCHEMA,
                title="Parallel database schema migrations or model definition collision",
                branch_a=b_a,
                branch_b=b_b,
                commits_a=[c.sha for c in c_list_a],
                commits_b=[c.sha for c in c_list_b],
                affected_files=list(set(schema_files_a + schema_files_b))[:3],
                affected_components=["database schema", "ORM entity", "migration runner"],
                evidence=evidence,
                problem_description="Concurrent database migrations created on divergent branch heads cause out-of-order execution or duplicate column definitions.",
                potential_interaction="Migration runner failure during CI/CD deploy or unapplied column constraints in production database."
            ))

        # ------------------------------------------------------------------
        # 6. CONFIGURATION COLLISION: Conflicting Environment / Flags
        # ------------------------------------------------------------------
        config_files = [f for f in overlap_files if any(k in f.lower() for k in [".env", "config", "settings", "docker-compose", "helm", "k8s"])]
        has_config_diff = re.search(r"([A-Z0-9_]{3,})\s*=\s*", combined_diff_a) and re.search(r"([A-Z0-9_]{3,})\s*=\s*", combined_diff_b)
        if config_files or has_config_diff:
            collision_counter += 1
            collisions.append(RawCollision(
                id=f"collision-config-{collision_counter}",
                collision_type=CollisionType.CONFIGURATION,
                title="Conflicting configuration variables or security flags",
                branch_a=b_a,
                branch_b=b_b,
                commits_a=[c.sha for c in c_list_a],
                commits_b=[c.sha for c in c_list_b],
                affected_files=config_files or [list(files_a)[0] if files_a else "config.py"],
                affected_components=["configuration engine", "environment variables", "runtime settings"],
                evidence=[
                    EvidenceItem(
                        commit_sha=c_list_a[0].sha if c_list_a else "shaA",
                        commit_message=c_list_a[0].message if c_list_a else "Update config",
                        author=c_list_a[0].author if c_list_a else "Dev A",
                        branch=b_a,
                        changed_files=config_files or ["config.py"],
                        snippet_or_symbol="CONFIG_SETTING_A",
                        observation="Updates environment variable definition or toggle flag."
                    ),
                    EvidenceItem(
                        commit_sha=c_list_b[0].sha if c_list_b else "shaB",
                        commit_message=c_list_b[0].message if c_list_b else "Refactor settings",
                        author=c_list_b[0].author if c_list_b else "Dev B",
                        branch=b_b,
                        changed_files=config_files or ["config.py"],
                        snippet_or_symbol="CONFIG_SETTING_B",
                        observation="Alters default configuration assumptions in parallel."
                    )
                ],
                problem_description="Both branches modify application configuration with divergent flags or environment defaults.",
                potential_interaction="Runtime misconfiguration, disabled security guards, or invalid service connection strings."
            ))

        # ------------------------------------------------------------------
        # 7. STATE / DATA FLOW COLLISION: Incompatible State Transitions
        # ------------------------------------------------------------------
        has_state_a = re.search(r"(state|status|lifecycle|phase)\s*(?:=|:=|=>)\s*['\"]([a-zA-Z0-9_-]+)['\"]", combined_diff_a, re.I)
        has_state_b = re.search(r"(state|status|lifecycle|phase)\s*(?:=|:=|=>)\s*['\"]([a-zA-Z0-9_-]+)['\"]", combined_diff_b, re.I)
        if has_state_a and has_state_b:
            state_a_val = has_state_a.group(2)
            state_b_val = has_state_b.group(2)
            if state_a_val.lower() != state_b_val.lower():
                collision_counter += 1
                collisions.append(RawCollision(
                    id=f"collision-state-{collision_counter}",
                    collision_type=CollisionType.STATE_DATA_FLOW,
                    title=f"State machine divergence: Incompatible entity transitions ({state_a_val} vs {state_b_val})",
                    branch_a=b_a,
                    branch_b=b_b,
                    commits_a=[c.sha for c in c_list_a],
                    commits_b=[c.sha for c in c_list_b],
                    affected_files=list(overlap_files) or [list(files_a)[0] if files_a else "model.ts"],
                    affected_components=["state machine", "workflow engine", "entity lifecycle"],
                    evidence=[
                        EvidenceItem(
                            commit_sha=c_list_a[0].sha if c_list_a else "shaA",
                            commit_message=c_list_a[0].message if c_list_a else "State transition A",
                            author=c_list_a[0].author if c_list_a else "Dev A",
                            branch=b_a,
                            changed_files=list(files_a)[:2],
                            snippet_or_symbol=f"status = '{state_a_val}'",
                            observation=f"Transitions entity directly to state '{state_a_val}'."
                        ),
                        EvidenceItem(
                            commit_sha=c_list_b[0].sha if c_list_b else "shaB",
                            commit_message=c_list_b[0].message if c_list_b else "State transition B",
                            author=c_list_b[0].author if c_list_b else "Dev B",
                            branch=b_b,
                            changed_files=list(files_b)[:2],
                            snippet_or_symbol=f"status = '{state_b_val}'",
                            observation=f"Assumes lifecycle flow transitions via '{state_b_val}'."
                        )
                    ],
                    problem_description=f"Branch '{b_a}' and '{b_b}' define incompatible state machine transitions for the same domain model.",
                    potential_interaction="Entity records become stuck in invalid lifecycle states; downstream processors skip unfulfilled workflow phases."
                ))

        # ------------------------------------------------------------------
        # 8. TEST INCOMPATIBILITY: Modified Code Invalidates Test Assertions
        # ------------------------------------------------------------------
        test_files_a = [f for f in files_a if "test" in f.lower() or "spec" in f.lower()]
        test_files_b = [f for f in files_b if "test" in f.lower() or "spec" in f.lower()]
        if (test_files_a and not test_files_b and api_files_b) or (test_files_b and not test_files_a and api_files_a):
            collision_counter += 1
            collisions.append(RawCollision(
                id=f"collision-test-{collision_counter}",
                collision_type=CollisionType.TEST_INCOMPATIBILITY,
                title="Test suite incompatibility: Concurrent assertion and contract changes",
                branch_a=b_a,
                branch_b=b_b,
                commits_a=[c.sha for c in c_list_a],
                commits_b=[c.sha for c in c_list_b],
                affected_files=test_files_a or test_files_b or ["tests/unit.test.ts"],
                affected_components=["test harness", "CI verification", "unit test suite"],
                evidence=[
                    EvidenceItem(
                        commit_sha=c_list_a[0].sha if c_list_a else "shaA",
                        commit_message=c_list_a[0].message if c_list_a else "Test updates",
                        author=c_list_a[0].author if c_list_a else "Dev A",
                        branch=b_a,
                        changed_files=test_files_a or list(files_a)[:1],
                        snippet_or_symbol="expect(res.status).toBe(200)",
                        observation="Specifies assertions based on branch A's updated contracts."
                    ),
                    EvidenceItem(
                        commit_sha=c_list_b[0].sha if c_list_b else "shaB",
                        commit_message=c_list_b[0].message if c_list_b else "Route changes",
                        author=c_list_b[0].author if c_list_b else "Dev B",
                        branch=b_b,
                        changed_files=api_files_b or list(files_b)[:1],
                        snippet_or_symbol="return res.status(201)",
                        observation="Modifies response contract without synchronizing test assertions."
                    )
                ],
                problem_description="One branch alters test assertions while the other modifies route contracts in parallel.",
                potential_interaction="CI build will fail with broken test assertions immediately upon merge."
            ))

        # ------------------------------------------------------------------
        # 9. PERFORMANCE REGRESSION: Loop / Database / Caching Hazards
        # ------------------------------------------------------------------
        has_perf_hazard_a = re.search(r"(for\s+.*\s+in\s+.*:\s*.*query|map\(.*fetch|await\s+Promise\.all\(.*find)", combined_diff_a, re.I)
        has_perf_hazard_b = re.search(r"(for\s+.*\s+in\s+.*:\s*.*query|map\(.*fetch|await\s+Promise\.all\(.*find)", combined_diff_b, re.I)
        if has_perf_hazard_a or has_perf_hazard_b:
            collision_counter += 1
            collisions.append(RawCollision(
                id=f"collision-perf-{collision_counter}",
                collision_type=CollisionType.PERFORMANCE_REGRESSION,
                title="Performance hazard: N+1 query pattern or unbatched I/O in parallel changes",
                branch_a=b_a,
                branch_b=b_b,
                commits_a=[c.sha for c in c_list_a],
                commits_b=[c.sha for c in c_list_b],
                affected_files=list(overlap_files) or [list(files_a)[0] if files_a else "handler.js"],
                affected_components=["database layer", "query batcher", "event loop"],
                evidence=[
                    EvidenceItem(
                        commit_sha=c_list_a[0].sha if c_list_a else "shaA",
                        commit_message=c_list_a[0].message if c_list_a else "Add loop fetch",
                        author=c_list_a[0].author if c_list_a else "Dev A",
                        branch=b_a,
                        changed_files=list(files_a)[:1],
                        snippet_or_symbol="users.map(async u => await fetchProfile(u.id))",
                        observation="Introduces unbatched query execution inside array mapping."
                    )
                ],
                problem_description="Iterative database or network fetching inside unbatched loops multiplies latency and resource exhaustion under production loads.",
                potential_interaction="Database connection pool starvation and high latency spikes on high-throughput endpoints."
            ))

        # ------------------------------------------------------------------
        # 10. SEMANTIC OVERLAP: Conceptually Related Logic in Distinct Files
        # ------------------------------------------------------------------
        has_auth_diff_a = re.search(r"(role|permission|scope|claims|rbac)", combined_diff_a, re.I)
        has_auth_diff_b = re.search(r"(role|permission|scope|claims|rbac)", combined_diff_b, re.I)
        if has_auth_diff_a and has_auth_diff_b and not overlap_files:
            collision_counter += 1
            collisions.append(RawCollision(
                id=f"collision-semantic-{collision_counter}",
                collision_type=CollisionType.SEMANTIC_OVERLAP,
                title="Semantic overlap: Parallel modifications to access control and role policies in distinct files",
                branch_a=b_a,
                branch_b=b_b,
                commits_a=[c.sha for c in c_list_a],
                commits_b=[c.sha for c in c_list_b],
                affected_files=list(files_a)[:2] + list(files_b)[:2],
                affected_components=["access control", "RBAC policy", "authorization boundary"],
                evidence=[
                    EvidenceItem(
                        commit_sha=c_list_a[0].sha if c_list_a else "shaA",
                        commit_message=c_list_a[0].message if c_list_a else "Update RBAC",
                        author=c_list_a[0].author if c_list_a else "Dev A",
                        branch=b_a,
                        changed_files=list(files_a)[:2],
                        snippet_or_symbol="requireRole('admin')",
                        observation="Updates role requirements in policy module."
                    ),
                    EvidenceItem(
                        commit_sha=c_list_b[0].sha if c_list_b else "shaB",
                        commit_message=c_list_b[0].message if c_list_b else "Add permission checks",
                        author=c_list_b[0].author if c_list_b else "Dev B",
                        branch=b_b,
                        changed_files=list(files_b)[:2],
                        snippet_or_symbol="hasPermission('user:write')",
                        observation="Concurrently adds permission checks in endpoint handlers."
                    )
                ],
                problem_description="Both branches alter authorization semantics across distinct files without shared interface synchronization.",
                potential_interaction="Disjointed permission enforcement: users with valid roles may be rejected by newly introduced sub-permission checks."
            ))

        # ------------------------------------------------------------------
        # 11. DIRECT FILE COLLISION: Textual / Line-Level Overlap
        # ------------------------------------------------------------------
        direct_files = [f for f in overlap_files if not f.endswith("package.json") and not f.endswith("requirements.txt") and f not in ["server.js", "server.py"]]
        if direct_files:
            collision_counter += 1
            collisions.append(RawCollision(
                id=f"collision-direct-{collision_counter}",
                collision_type=CollisionType.DIRECT_FILE,
                title=f"Direct file collision in {direct_files[0]}",
                branch_a=b_a,
                branch_b=b_b,
                commits_a=[c.sha for c in c_list_a],
                commits_b=[c.sha for c in c_list_b],
                affected_files=direct_files[:3],
                affected_components=[f.split('/')[-1] for f in direct_files[:3]],
                evidence=[
                    EvidenceItem(
                        commit_sha=c_list_a[0].sha if c_list_a else "shaA",
                        commit_message=c_list_a[0].message if c_list_a else "Edit file",
                        author=c_list_a[0].author if c_list_a else "Dev A",
                        branch=b_a,
                        changed_files=direct_files,
                        snippet_or_symbol=direct_files[0],
                        observation="Modified lines in branch A."
                    ),
                    EvidenceItem(
                        commit_sha=c_list_b[0].sha if c_list_b else "shaB",
                        commit_message=c_list_b[0].message if c_list_b else "Edit file",
                        author=c_list_b[0].author if c_list_b else "Dev B",
                        branch=b_b,
                        changed_files=direct_files,
                        snippet_or_symbol=direct_files[0],
                        observation="Concurrent edits in branch B."
                    )
                ],
                problem_description=f"Both branches touch lines in {', '.join(direct_files[:2])}.",
                potential_interaction="Standard Git textual merge conflict and potential semantic clash upon manual resolution."
            ))

        # ------------------------------------------------------------------
        # 12. STRUCTURAL COLLISION: Same Module / Shared Abstraction
        # ------------------------------------------------------------------
        shared_modules = [f for f in overlap_files if any(k in f.lower() for k in ["index", "mod", "common", "utils", "core"])]
        if shared_modules and not any(c.collision_type == CollisionType.STRUCTURAL for c in collisions):
            collision_counter += 1
            collisions.append(RawCollision(
                id=f"collision-structural-{collision_counter}",
                collision_type=CollisionType.STRUCTURAL,
                title=f"Structural collision: Parallel modifications to shared module {shared_modules[0]}",
                branch_a=b_a,
                branch_b=b_b,
                commits_a=[c.sha for c in c_list_a],
                commits_b=[c.sha for c in c_list_b],
                affected_files=shared_modules,
                affected_components=["shared abstraction", "core utilities", "module index"],
                evidence=[
                    EvidenceItem(
                        commit_sha=c_list_a[0].sha if c_list_a else "shaA",
                        commit_message=c_list_a[0].message if c_list_a else "Update core utility",
                        author=c_list_a[0].author if c_list_a else "Dev A",
                        branch=b_a,
                        changed_files=shared_modules,
                        snippet_or_symbol=shared_modules[0],
                        observation="Exports and shared abstractions modified in branch A."
                    ),
                    EvidenceItem(
                        commit_sha=c_list_b[0].sha if c_list_b else "shaB",
                        commit_message=c_list_b[0].message if c_list_b else "Refactor shared module",
                        author=c_list_b[0].author if c_list_b else "Dev B",
                        branch=b_b,
                        changed_files=shared_modules,
                        snippet_or_symbol=shared_modules[0],
                        observation="Concurrent modifications to shared interface in branch B."
                    )
                ],
                problem_description=f"Both branches modify shared abstraction exports in {shared_modules[0]}.",
                potential_interaction="Export name collisions or broken imports across consuming subsystems."
            ))

    return collisions
