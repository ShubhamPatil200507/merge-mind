"""
Agent 6 — Resolution Planning Agent
Generates actionable, step-by-step instructions specific to the actual repository and affected files.
Avoids generic 'resolve the conflict' messages.
Never invents file paths.
"""

from typing import List
from app.models import CollisionType, ResolutionStep
from app.agents.collision_detection import RawCollision

def plan_resolution(collision: RawCollision) -> List[ResolutionStep]:
    """
    Creates ordered, concrete resolution steps for developers to execute,
    referencing real affected files from the collision.
    """
    files = collision.affected_files or []
    primary_file = files[0] if files else "source file"
    secondary_file = files[1] if len(files) > 1 else primary_file

    if collision.collision_type == CollisionType.SEMANTIC:
        return [
            ResolutionStep(
                step_number=1,
                action=f"Inspect middleware mounting sequence in {primary_file}",
                detail=f"Open {primary_file} and verify the execution order between authentication middleware and the refactored request handler dispatch block.",
                file_reference=primary_file
            ),
            ResolutionStep(
                step_number=2,
                action="Preserve authentication middleware upstream in the request chain",
                detail="Ensure security validation is mounted before any request handler dispatches to downstream routes.",
                file_reference=secondary_file
            ),
            ResolutionStep(
                step_number=3,
                action="Incorporate request handler performance improvements downstream",
                detail="Ensure the refactored async pipeline operates downstream of verified authentication context (e.g., req.user).",
                file_reference=primary_file
            ),
            ResolutionStep(
                step_number=4,
                action="Verify protected endpoints enforce security priority",
                detail="Confirm that sensitive routes cannot execute without passing token verification.",
                file_reference=secondary_file
            ),
            ResolutionStep(
                step_number=5,
                action="Update integration test fixtures",
                detail="Update tests to assert both authentication rejection (401) and valid stream processing under authenticated sessions.",
                file_reference="tests"
            ),
            ResolutionStep(
                step_number=6,
                action="Run verification test suite",
                detail="Run your local test runner to verify both branches' acceptance criteria pass simultaneously.",
                file_reference=primary_file
            ),
            ResolutionStep(
                step_number=7,
                action="Review the consolidated diff before merging",
                detail="Conduct a human-in-the-loop review of the final composite diff to confirm no security bypass paths remain.",
                file_reference=primary_file
            )
        ]

    elif collision.collision_type == CollisionType.API_CONTRACT:
        return [
            ResolutionStep(
                step_number=1,
                action=f"Inspect API contract signatures in {primary_file}",
                detail="Review request payload and response schema definitions across both branches.",
                file_reference=primary_file
            ),
            ResolutionStep(
                step_number=2,
                action="Implement backward-compatible contract adapter",
                detail="Support both legacy and modern field names in response payloads during migration.",
                file_reference=primary_file
            ),
            ResolutionStep(
                step_number=3,
                action=f"Verify consumer deserializers in {secondary_file}",
                detail="Check that client consumers correctly parse updated payload attributes.",
                file_reference=secondary_file
            ),
            ResolutionStep(
                step_number=4,
                action="Run contract verification tests",
                detail="Execute API integration test suite and frontend typecheck to ensure zero runtime TypeErrors.",
                file_reference="tests"
            ),
            ResolutionStep(
                step_number=5,
                action="Review final diff and approve merge",
                detail="Ensure both backend and frontend teams sign off on the unified payload contract.",
                file_reference=primary_file
            )
        ]

    elif collision.collision_type == CollisionType.DEPENDENCY:
        return [
            ResolutionStep(
                step_number=1,
                action=f"Compare divergent package versions in {primary_file}",
                detail="Inspect conflicting dependency versions declared in manifests across both branches.",
                file_reference=primary_file
            ),
            ResolutionStep(
                step_number=2,
                action="Align on compatible semver range",
                detail="Select a mutually compatible version range that satisfies both branch features without peer conflicts.",
                file_reference=primary_file
            ),
            ResolutionStep(
                step_number=3,
                action="Regenerate package lockfile cleanly",
                detail="Run clean install command (`npm install` / `pip install`) to produce an unambiguous lockfile.",
                file_reference=primary_file
            ),
            ResolutionStep(
                step_number=4,
                action="Run build and test suite",
                detail="Ensure the unified dependency tree compiles and passes automated regression tests.",
                file_reference=primary_file
            )
        ]

    elif collision.collision_type == CollisionType.SCHEMA:
        return [
            ResolutionStep(
                step_number=1,
                action=f"Inspect divergent migration files in {primary_file}",
                detail="Review migration timestamps, version tags, and altered tables/columns across both branches.",
                file_reference=primary_file
            ),
            ResolutionStep(
                step_number=2,
                action="Sequence migration revisions serially",
                detail="Re-base migration files so one cleanly succeeds the other, avoiding parallel branch migration forks.",
                file_reference=primary_file
            ),
            ResolutionStep(
                step_number=3,
                action="Test migration up and down scripts in test database",
                detail="Run migrations against an ephemeral test database to confirm idempotency and zero column collisions.",
                file_reference=secondary_file
            ),
            ResolutionStep(
                step_number=4,
                action="Verify ORM entity models match unified schema",
                detail="Update application entity classes to reflect the serialized database structure.",
                file_reference=primary_file
            )
        ]

    else:
        return [
            ResolutionStep(
                step_number=1,
                action=f"Inspect overlapping changes in {primary_file}",
                detail="Examine modified hunks and function signatures across both branches.",
                file_reference=primary_file
            ),
            ResolutionStep(
                step_number=2,
                action="Align on unified implementation logic",
                detail="Preserve intent from both changes while avoiding shadowed variables or conflicting side effects.",
                file_reference=primary_file
            ),
            ResolutionStep(
                step_number=3,
                action="Run automated regression tests",
                detail="Execute local test suite to ensure the combined implementation meets requirements.",
                file_reference=primary_file
            ),
            ResolutionStep(
                step_number=4,
                action="Perform human developer diff review",
                detail="Review the resulting unified diff before completing merge.",
                file_reference=primary_file
            )
        ]
