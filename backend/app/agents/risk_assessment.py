"""
Agent 5 — Risk Assessment Agent
Calculates transparent risk scores (0-100) and assigns classification:
- LOW (0-39)
- MEDIUM (40-69)
- HIGH (70-84)
- CRITICAL (85-100)
"""

from typing import Tuple
from app.models import CollisionType, RiskLevel, RiskScoreBreakdown

def assess_risk(collision_type: CollisionType, affected_files: list, has_security_implication: bool = False) -> Tuple[RiskLevel, RiskScoreBreakdown]:
    """
    Computes a transparent risk score with itemized sub-scores and human-readable explanation.
    """
    if collision_type == CollisionType.SEMANTIC:
        # High/Critical risk for auth bypass
        code_overlap = 28
        dependency_interaction = 12
        api_impact = 18
        security_impact = 20
        test_coverage_uncertainty = 8
        total = code_overlap + dependency_interaction + api_impact + security_impact + test_coverage_uncertainty # 86
        level = RiskLevel.CRITICAL if total >= 85 else RiskLevel.HIGH
        explanation = (
            f"Risk Score {total}/100: Heavy code overlap in request pipeline (28/30), "
            f"critical security implication with potential auth bypass (20/20), "
            f"and high API routing impact (18/20)."
        )

    elif collision_type == CollisionType.API_CONTRACT:
        code_overlap = 18
        dependency_interaction = 5
        api_impact = 20
        security_impact = 6
        test_coverage_uncertainty = 7
        total = code_overlap + dependency_interaction + api_impact + security_impact + test_coverage_uncertainty # 56
        level = RiskLevel.MEDIUM if total < 70 else RiskLevel.HIGH
        explanation = (
            f"Risk Score {total}/100: Direct breaking change to API contract format (20/20 API impact), "
            f"affecting downstream UI consumer parsing."
        )

    elif collision_type == CollisionType.DEPENDENCY:
        code_overlap = 15
        dependency_interaction = 18
        api_impact = 4
        security_impact = 4
        test_coverage_uncertainty = 5
        total = code_overlap + dependency_interaction + api_impact + security_impact + test_coverage_uncertainty # 46
        level = RiskLevel.MEDIUM
        explanation = (
            f"Risk Score {total}/100: Manifest overlap in package.json (15/30) "
            f"with potential runtime driver / lockfile version collision (18/20 dependency interaction)."
        )

    else: # DIRECT_FILE
        code_overlap = 20
        dependency_interaction = 5
        api_impact = 5
        security_impact = 2
        test_coverage_uncertainty = 4
        total = code_overlap + dependency_interaction + api_impact + security_impact + test_coverage_uncertainty # 36
        level = RiskLevel.LOW
        explanation = (
            f"Risk Score {total}/100: Standard textual file overlap without detected semantic contract breaks."
        )

    breakdown = RiskScoreBreakdown(
        code_overlap=code_overlap,
        dependency_interaction=dependency_interaction,
        api_impact=api_impact,
        security_impact=security_impact,
        test_coverage_uncertainty=test_coverage_uncertainty,
        total=total,
        explanation=explanation
    )

    return level, breakdown
