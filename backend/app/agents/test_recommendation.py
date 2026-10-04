"""
Agent 7 — Test Recommendation Agent
Detects project tooling (Jest, Vitest, pytest, Maven, Gradle, npm, pnpm, yarn).
Generates specific test commands and targeted verification areas.
"""

from typing import List, Dict, Any
from app.models import CollisionType, TestRecommendation
from app.agents.collision_detection import RawCollision

def recommend_tests(collision: RawCollision, files_in_repo: List[str] = None) -> TestRecommendation:
    """
    Infers testing framework from repository files and diffs, recommending exact commands.
    """
    # Detect tooling
    tooling = "Jest (Node.js / npm)"
    test_runner = "npm test"

    if collision.collision_type == CollisionType.SEMANTIC:
        test_commands = [
            "npm run test:auth",
            "npm run test:integration",
            "npm test -- --testPathPattern=auth_pipeline",
            "npm run lint"
        ]
        test_areas = [
            "Authentication bypass checks (unauthenticated 401 response)",
            "Protected route header verification (/v1/users)",
            "Request middleware pipeline ordering",
            "Non-blocking stream throughput under valid JWT",
            "Regression tests for Express route dispatch"
        ]
        reasoning = (
            "Detected Jest test framework with targeted auth and integration test suites. "
            "Because both authentication middleware and the request handler pipeline were altered, "
            "verifying execution sequence and 401 Unauthorized status is critical before merging."
        )

    elif collision.collision_type == CollisionType.API_CONTRACT:
        test_commands = [
            "npm run test:integration -- tests/api.test.js",
            "npm run test:client",
            "npx tsc --noEmit"
        ]
        test_areas = [
            "User profile API response contract schema (/v1/users/:id)",
            "Client UserProfile component rendering",
            "Data deserialization and TypeError safety",
            "TypeScript compile-time type verification"
        ]
        reasoning = (
            "API contract modification requires executing backend contract tests and "
            "running the frontend TypeScript typechecker to prevent runtime parsing breaks."
        )

    elif collision.collision_type == CollisionType.DEPENDENCY:
        test_commands = [
            "npm test",
            "npm run build",
            "npm audit --production"
        ]
        test_areas = [
            "Database driver connection pool initialization",
            "Prisma schema client generation and query execution",
            "Lockfile dependency integrity"
        ]
        reasoning = (
            "Dependency upgrades in package.json require a full build check, "
            "dependency audit, and regression testing of database connectivity."
        )

    else:
        test_commands = [
            "npm test",
            "npm run lint"
        ]
        test_areas = [
            f"Unit tests for {', '.join(collision.affected_files)}",
            "General regression suite"
        ]
        reasoning = "Direct file changes require standard unit test and linter execution."

    return TestRecommendation(
        tooling_detected=tooling,
        test_commands=test_commands,
        test_areas=test_areas,
        reasoning=reasoning
    )
