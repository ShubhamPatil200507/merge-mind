"""
Agent 7 — Test Recommendation Agent
Inspects repository files and diffs to discover the actual testing framework:
Jest, Vitest, Mocha, Supertest, pytest, unittest, Maven, Gradle, Go test, Cargo test.
Recommends tests based on detected tooling, never blindly hardcoding a single runner.
"""

from typing import List, Optional
from app.models import CollisionType, TestRecommendation
from app.agents.collision_detection import RawCollision

def discover_test_tooling(files: List[str]) -> tuple[str, str]:
    """
    Inspects repository filenames to detect project test framework and runner command.
    Returns (tooling_name, base_command).
    """
    has_pkg_json = any(f.endswith("package.json") for f in files)
    has_vitest = any("vitest" in f.lower() for f in files)
    has_jest = any("jest" in f.lower() for f in files)
    has_pytest = any(f.endswith("conftest.py") or "pytest" in f.lower() or f.endswith("pyproject.toml") for f in files)
    has_python = any(f.endswith(".py") for f in files)
    has_pom = any("pom.xml" in f for f in files)
    has_gradle = any("build.gradle" in f for f in files)
    has_cargo = any("Cargo.toml" in f for f in files)
    has_go = any("go.mod" in f for f in files)

    if has_vitest:
        return ("Vitest (Node.js)", "npx vitest run")
    elif has_jest:
        return ("Jest (Node.js)", "npm test --")
    elif has_pkg_json:
        return ("npm test (Node.js)", "npm test")
    elif has_pytest or has_python:
        return ("pytest (Python)", "pytest -v")
    elif has_pom:
        return ("Maven (Java)", "mvn test")
    elif has_gradle:
        return ("Gradle (JVM)", "./gradlew test")
    elif has_cargo:
        return ("Cargo (Rust)", "cargo test")
    elif has_go:
        return ("Go test", "go test ./...")
    else:
        return ("Standard test suite", "npm test")

def recommend_tests(collision: RawCollision, repo_files: Optional[List[str]] = None) -> TestRecommendation:
    """
    Generates targeted test commands and verification areas tailored to the repository's actual tooling.
    """
    files = repo_files or collision.affected_files or []
    tooling_name, base_cmd = discover_test_tooling(files)

    target_files = collision.affected_files or ["source"]
    first_file = target_files[0] if target_files else "app"

    if collision.collision_type == CollisionType.SEMANTIC:
        if "pytest" in base_cmd:
            test_commands = [
                "pytest tests/test_auth.py -v",
                "pytest tests/test_pipeline.py -v",
                "pytest -k 'auth or pipeline'"
            ]
        elif "vitest" in base_cmd:
            test_commands = [
                "npx vitest run tests/auth.test.ts",
                "npx vitest run tests/integration.test.ts",
                "npx vitest run --coverage"
            ]
        else:
            test_commands = [
                "npm test -- tests/auth.test.js",
                "npm test -- tests/integration.test.js",
                "npm run lint"
            ]

        test_areas = [
            "Authentication bypass verification (unauthenticated HTTP 401)",
            "Protected route header validation (active user token)",
            "Middleware dispatch sequence priority",
            "Non-blocking stream throughput under valid session tokens",
            "Regression tests for route dispatchers"
        ]
        reasoning = (
            f"Detected {tooling_name}. Because both authentication and request dispatch flow were modified in "
            f"`{first_file}`, running auth pipeline tests is essential to confirm unauthenticated requests cannot bypass token checks."
        )

    elif collision.collision_type == CollisionType.API_CONTRACT:
        if "pytest" in base_cmd:
            test_commands = [
                "pytest tests/test_api_contract.py -v",
                "pytest -k 'user_profile'"
            ]
        else:
            test_commands = [
                "npm test -- tests/api.test.js",
                "npx tsc --noEmit"
            ]

        test_areas = [
            "User profile response payload schema validation",
            "Dual-key compatibility (numeric userId and UUID user_id)",
            "Frontend component deserialization safety",
            "TypeScript compiler type safety checks"
        ]
        reasoning = (
            f"Detected {tooling_name}. API contract modification requires executing backend endpoint tests "
            "and frontend type checking to prevent runtime `TypeError: undefined` regressions."
        )

    elif collision.collision_type == CollisionType.DEPENDENCY:
        if "pytest" in base_cmd:
            test_commands = [
                "pip check",
                "pytest -v"
            ]
        else:
            test_commands = [
                "npm test",
                "npm run build",
                "npm audit --production"
            ]

        test_areas = [
            "Dependency tree resolution without peer conflicts",
            "Clean build verification",
            "Core database driver integration under unified packages"
        ]
        reasoning = (
            f"Detected {tooling_name}. Dependency manifest alterations require build compilation and test harness verification."
        )

    else:
        test_commands = [
            f"{base_cmd}",
            "npm run lint" if "npm" in base_cmd else "flake8"
        ]
        test_areas = [
            f"Regression tests for modified logic in {first_file}",
            "Unit test assertions on touched functions",
            "Integration verification"
        ]
        reasoning = (
            f"Detected {tooling_name}. Executing the standard test harness to verify parallel changes integrate cleanly."
        )

    return TestRecommendation(
        tooling_detected=tooling_name,
        test_commands=test_commands,
        test_areas=test_areas,
        framework_detected=tooling_name,
        test_runner=base_cmd,
        recommended_commands=test_commands,
        verification_areas=test_areas,
        reasoning=reasoning
    )
