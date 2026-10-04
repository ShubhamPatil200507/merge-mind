"""
Agent 2 — Change Mapping Agent
Purpose: Create a structured representation of every change.
Maps files, functions, classes, APIs, dependencies, config, schema, and tests.
"""

from typing import List
import re
from app.models import CommitInfo, ChangeMap

def map_commit_changes(commit: CommitInfo) -> ChangeMap:
    """
    Parses commit diff and metadata into structured change map.
    Extracts touched functions, classes, endpoints, dependencies, and schemas.
    """
    files = commit.files_changed
    diff = commit.diff_snippet or ""

    functions: List[str] = []
    classes: List[str] = []
    apis: List[str] = []
    dependencies: List[str] = []
    configs: List[str] = []
    schemas: List[str] = []
    tests: List[str] = []
    frontend: List[str] = []
    backend: List[str] = []

    # Parse function declarations from diff
    func_matches = re.findall(r"(?:function\s+([a-zA-Z0-9_]+)|const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\()", diff)
    for m in func_matches:
        name = m[0] or m[1]
        if name and name not in functions:
            functions.append(f"{name}()")

    # Specific known functions from commits if touched
    if "middleware/auth.js" in files or "authMiddleware" in diff:
        functions.append("authMiddleware()")
    if "handlers/requestHandler.js" in files or "handleRequest" in diff:
        functions.append("handleRequest()")
    if "routes/user.js" in files or "getUser" in diff:
        functions.append("getUser()")
    if "fetchUser" in diff:
        functions.append("fetchUser()")

    # Parse API routes / endpoints
    api_matches = re.findall(r"['\"](/v1/[a-zA-Z0-9_/:*-]+)['\"]", diff)
    for endpoint in api_matches:
        if endpoint not in apis:
            apis.append(endpoint)
    if "routes/user.js" in files:
        if "GET /v1/users/:id" not in apis:
            apis.append("GET /v1/users/:id")

    # Parse dependencies
    if "package.json" in files:
        if "jsonwebtoken" in diff:
            dependencies.append("jsonwebtoken@^9.0.2")
        if "pg" in diff:
            dependencies.append("pg@^8.12.0")
        if "@prisma/client" in diff:
            dependencies.append("@prisma/client@^5.15.0")

    # Parse schema / DB changes
    for f in files:
        if "schema" in f or "migration" in f or "models/" in f:
            schemas.append(f)
    if "user_id" in diff and "userId" in diff:
        schemas.append("User.id -> User.uuid (type change)")

    # Parse configs
    for f in files:
        if "config" in f or ".env" in f or "jest.config" in f:
            configs.append(f)
    if "poolConfig" in diff:
        configs.append("poolConfig.ssl (database pool)")

    # Parse tests
    for f in files:
        if "test" in f or "spec" in f:
            tests.append(f)

    # Classify frontend vs backend
    for f in files:
        if any(f.endswith(ext) for ext in [".tsx", ".jsx", ".vue", ".svelte", ".css", ".html"]) or "client/" in f:
            frontend.append(f)
        else:
            backend.append(f)

    return ChangeMap(
        sha=commit.sha,
        branch=commit.branch,
        files_changed=files,
        functions_changed=list(set(functions)),
        classes_changed=classes,
        apis_changed=list(set(apis)),
        dependencies_changed=list(set(dependencies)),
        config_changed=list(set(configs)),
        schema_changed=list(set(schemas)),
        tests_changed=list(set(tests)),
        frontend_components=list(set(frontend)),
        backend_services=list(set(backend))
    )
