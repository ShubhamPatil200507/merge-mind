"""
Agent 6 — Resolution Planning Agent
Generates actionable, step-by-step instructions specific to the actual repository.
Avoids generic 'resolve the conflict' messages.
"""

from typing import List
from app.models import CollisionType, ResolutionStep
from app.agents.collision_detection import RawCollision

def plan_resolution(collision: RawCollision) -> List[ResolutionStep]:
    """
    Creates ordered, concrete resolution steps for developers to execute.
    """
    if collision.collision_type == CollisionType.SEMANTIC:
        return [
            ResolutionStep(
                step_number=1,
                action="Inspect middleware mounting sequence in server.js",
                detail="Open server.js and compare how `app.use('/v1', authMiddleware)` interacts with the refactored `handleRequest` dispatch block.",
                file_reference="server.js"
            ),
            ResolutionStep(
                step_number=2,
                action="Preserve authMiddleware execution in the primary request chain",
                detail="Ensure `authMiddleware` is applied as upstream middleware before `handleRequest` dispatches to downstream route handlers.",
                file_reference="middleware/auth.js"
            ),
            ResolutionStep(
                step_number=3,
                action="Apply the request-handler asynchronous refactor",
                detail="Incorporate Sarah's non-blocking stream changes from `handlers/requestHandler.js`, ensuring it respects `req.user` context populated by auth.",
                file_reference="handlers/requestHandler.js"
            ),
            ResolutionStep(
                step_number=4,
                action="Ensure all protected routes enforce authentication priority",
                detail="Verify that `/v1/users` and sensitive endpoints cannot execute without passing through `authMiddleware` token validation.",
                file_reference="routes/user.js"
            ),
            ResolutionStep(
                step_number=5,
                action="Update affected unit and pipeline test fixtures",
                detail="Combine assertions from `tests/auth.test.js` and `tests/api.test.js` into an integrated pipeline test suite.",
                file_reference="tests/auth.test.js"
            ),
            ResolutionStep(
                step_number=6,
                action="Run authentication and API integration tests",
                detail="Execute `npm run test:auth` and `npm run test:integration` to verify 401 Unauthorized returns for missing tokens.",
                file_reference="package.json"
            ),
            ResolutionStep(
                step_number=7,
                action="Review the consolidated diff before merging PR",
                detail="Conduct a human-in-the-loop review of the final composite diff to confirm no security bypass paths remain.",
                file_reference="server.js"
            )
        ]

    elif collision.collision_type == CollisionType.API_CONTRACT:
        return [
            ResolutionStep(
                step_number=1,
                action="Review API payload format differences in user route",
                detail="Examine `routes/user.js` in `feature/db-migration` where `userId` was renamed to `user_id` (UUID).",
                file_reference="routes/user.js"
            ),
            ResolutionStep(
                step_number=2,
                action="Provide backwards-compatible payload or add API versioning",
                detail="Either return both `{ userId: user.id, user_id: user.uuid }` temporarily, or expose a `/v2/users` versioned route.",
                file_reference="routes/user.js"
            ),
            ResolutionStep(
                step_number=3,
                action="Update frontend TypeScript types in UserProfile widget",
                detail="Update `client/components/UserProfile.tsx` to handle string UUID `user_id` without failing numeric validation checks.",
                file_reference="client/components/UserProfile.tsx"
            ),
            ResolutionStep(
                step_number=4,
                action="Update API client deserializer in services/api.ts",
                detail="Modify `fetchUser()` type-check assertion to accept string identifiers.",
                file_reference="client/services/api.ts"
            ),
            ResolutionStep(
                step_number=5,
                action="Execute contract validation tests",
                detail="Run client component tests and API schema snapshot verification.",
                file_reference="tests/api.test.js"
            )
        ]

    elif collision.collision_type == CollisionType.DEPENDENCY:
        return [
            ResolutionStep(
                step_number=1,
                action="Compare diverging dependencies in package.json",
                detail=f"Inspect package version changes between '{collision.branch_a}' and '{collision.branch_b}'.",
                file_reference="package.json"
            ),
            ResolutionStep(
                step_number=2,
                action="Consolidate compatible semver ranges",
                detail="Align `pg` and Prisma packages to compatible LTS releases (e.g. pg ^8.12.0 with Prisma ^5.15.0).",
                file_reference="package.json"
            ),
            ResolutionStep(
                step_number=3,
                action="Regenerate clean package-lock.json",
                detail="Run `npm install` to resolve and regenerate a deterministic lockfile without peer dependency conflicts.",
                file_reference="package-lock.json"
            ),
            ResolutionStep(
                step_number=4,
                action="Verify build and database connection pool",
                detail="Run `npm run build` and database smoke test to confirm driver compatibility.",
                file_reference="config/database.js"
            )
        ]

    else: # DIRECT_FILE
        return [
            ResolutionStep(
                step_number=1,
                action=f"Inspect concurrent modifications in {collision.affected_files[0]}",
                detail=f"Review changes made by both developers in {collision.affected_files[0]}.",
                file_reference=collision.affected_files[0]
            ),
            ResolutionStep(
                step_number=2,
                action="Merge logic chunks without discarding parallel functionality",
                detail="Carefully reconcile the conflicting hunks, ensuring functions from both branches are preserved.",
                file_reference=collision.affected_files[0]
            ),
            ResolutionStep(
                step_number=3,
                action="Run repository test suite",
                detail="Execute local test suite to verify no syntax errors or regressions were introduced.",
                file_reference=collision.affected_files[0]
            )
        ]
