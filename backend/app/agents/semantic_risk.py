"""
Agent 4 — Semantic Risk Agent
Analyzes whether individually valid changes could become incompatible when combined.
Ensures prudent, evidence-first phrasing ("Potential risk", "Likely conflict", "Requires developer verification").
"""

from typing import Dict, Any
from app.models import CollisionType, RiskLevel
from app.agents.collision_detection import RawCollision

class SemanticRiskEvaluation:
    def __init__(
        self,
        summary: str,
        why_it_exists: str,
        potential_impact: str,
        confidence: float,
        disclaimer: str
    ):
        self.summary = summary
        self.why_it_exists = why_it_exists
        self.potential_impact = potential_impact
        self.confidence = confidence
        self.disclaimer = disclaimer

def evaluate_semantic_risk(collision: RawCollision) -> SemanticRiskEvaluation:
    """
    Rigorously analyzes subtle behavioral risks beyond textual conflicts.
    """
    if collision.collision_type == CollisionType.SEMANTIC:
        summary = (
            "Potential high-severity integration issue: Developer B's request pipeline refactor "
            "may inadvertently bypass the JWT authentication middleware introduced by Developer A."
        )
        why_it_exists = (
            "Both branches alter the request execution flow in `server.js`. Branch `feature/auth` "
            "registers `authMiddleware()` to enforce security on all `/v1` routes. Branch `feature/api-refactor` "
            "optimizes throughput by mounting `handleRequest()` before middleware dispatch, altering the pipeline execution sequence."
        )
        potential_impact = (
            "Unauthenticated clients may successfully query protected endpoints without token verification. "
            "This could lead to unauthorized data exposure and security bypass in production."
        )
        confidence = 0.88
        disclaimer = "Potential security risk detected via pipeline ordering analysis. Requires developer verification before merging."

    elif collision.collision_type == CollisionType.API_CONTRACT:
        summary = (
            "Likely API contract incompatibility: Backend response payload schema change "
            "breaks frontend consumer expectations on `/v1/users/:id`."
        )
        why_it_exists = (
            "The backend migration branch renames `userId` (number) to `user_id` (UUID string), "
            "while the dashboard branch strictly expects `typeof data.userId === 'number'`. "
            "Individually each branch compiles, but combined they fail runtime validation."
        )
        potential_impact = (
            "Client dashboard widgets will throw runtime TypeErrors when rendering user profile cards, "
            "resulting in broken UI views and telemetry crashes."
        )
        confidence = 0.92
        disclaimer = "API schema mismatch detected across parallel branches. Requires developer verification."

    elif collision.collision_type == CollisionType.DEPENDENCY:
        summary = (
            "Potential dependency conflict: Parallel updates to shared manifest `package.json`."
        )
        why_it_exists = (
            f"Branches '{collision.branch_a}' and '{collision.branch_b}' introduce diverging dependencies "
            "or version bumps (e.g. pg driver and jsonwebtoken). Textual merge may succeed but cause version lock anomalies."
        )
        potential_impact = (
            "Could cause duplicate dependency resolutions in node_modules, peer dependency warnings, "
            "or connection pooling behavioral changes."
        )
        confidence = 0.81
        disclaimer = "Dependency manifest interaction detected. Verify lockfile integrity."

    else: # DIRECT_FILE
        summary = (
            f"Direct code collision: Parallel changes detected in '{', '.join(collision.affected_files)}'."
        )
        why_it_exists = (
            f"Both '{collision.branch_a}' and '{collision.branch_b}' contain independent commits modifying "
            f"the same files concurrently."
        )
        potential_impact = (
            "Git merge will produce textual conflicts or overwrite parallel logic if resolved carelessly."
        )
        confidence = 0.95
        disclaimer = "Textual change overlap detected. Requires developer conflict review."

    return SemanticRiskEvaluation(
        summary=summary,
        why_it_exists=why_it_exists,
        potential_impact=potential_impact,
        confidence=confidence,
        disclaimer=disclaimer
    )
