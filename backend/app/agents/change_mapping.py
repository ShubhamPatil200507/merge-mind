"""
Agent 2 — Change Mapping Agent
Purpose: Create a structured normalized AST representation of every change.
Parses functions, classes, APIs, dependencies, configurations, schemas, and tests
using language-aware AST parsers on real file contents or commit diffs.
"""

from typing import List, Set, Dict, Optional
from app.models import CommitInfo, ChangeMap
from app.parsers.ast_parser import parse_source_file

def map_commit_changes(
    commit: CommitInfo,
    file_snapshots: Optional[Dict[str, str]] = None
) -> ChangeMap:
    """
    Parses commit diff and touched files into a structured, normalized ChangeMap.
    Uses real file contents from snapshots when available, falling back to diff snippets.
    Uses AST analysis for Python and tokenized tree parsing for JavaScript / TypeScript.
    """
    files = commit.files_changed or []
    diff = commit.diff_snippet or ""
    snapshots = file_snapshots or {}

    all_functions: Set[str] = set()
    all_classes: Set[str] = set()
    all_apis: Set[str] = set()
    all_dependencies: Set[str] = set()
    all_configs: Set[str] = set()
    all_schemas: Set[str] = set()
    all_tests: Set[str] = set()
    frontend_files: List[str] = []
    backend_files: List[str] = []

    # 1. Parse each changed file using language-specific AST engine
    for f in files:
        # Use full file content from snapshot if present, else diff snippet
        content_to_parse = snapshots.get(f, diff)
        ast_result = parse_source_file(f, content_to_parse)
        all_functions.update(ast_result.functions)
        all_classes.update(ast_result.classes)
        all_apis.update(ast_result.apis)
        all_dependencies.update(ast_result.dependencies)
        all_schemas.update(ast_result.schemas)
        all_tests.update(ast_result.tests)

        if any(f.endswith(ext) for ext in [".tsx", ".jsx", ".vue", ".svelte", ".css", ".html"]) or "client/" in f:
            frontend_files.append(f)
        else:
            backend_files.append(f)

        if "config" in f.lower() or ".env" in f.lower() or f.endswith(".json") or f.endswith(".yaml") or f.endswith(".yml"):
            all_configs.add(f)

    # 2. Extract AST directly from diff content for touched blocks
    if diff:
        diff_ast = parse_source_file("diff_snippet.js", diff)
        all_functions.update(diff_ast.functions)
        all_classes.update(diff_ast.classes)
        all_apis.update(diff_ast.apis)

    return ChangeMap(
        sha=commit.sha,
        branch=commit.branch,
        files_changed=files,
        functions_changed=sorted(list(all_functions)),
        classes_changed=sorted(list(all_classes)),
        apis_changed=sorted(list(all_apis)),
        dependencies_changed=sorted(list(all_dependencies)),
        config_changed=sorted(list(all_configs)),
        schema_changed=sorted(list(all_schemas)),
        tests_changed=sorted(list(all_tests)),
        frontend_components=frontend_files,
        backend_modules=backend_files
    )
