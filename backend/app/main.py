"""
MergeMind FastAPI Application
Backend server hosting the Multi-Agent Pipeline, GitHub Client, Demo Engine,
Branch Comparison Engine, Sandboxed Test Runner, Review Center, and LLM Provider Settings.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
import os

from app.models import (
    RepositoryAnalysis,
    AnalyzeRepoRequest,
    ReviewActionRequest,
    ReviewStatus,
    IntegrationRisk
)
from app.demo_data import (
    DEMO_REPO_NAME,
    DEMO_BRANCHES,
    DEMO_COMMITS,
    DEMO_PULL_REQUESTS,
    FILE_SNAPSHOTS
)
from app.agents.pipeline import run_agentic_analysis
from app.github_client import fetch_github_repository, fetch_branch_comparison
from app.test_runner import run_sandboxed_test, TestExecutionResult
from app.db.database import update_risk_review, get_latest_reviews, get_audit_trail
from app.agents.compatibility_reconciliation import validate_patch

app = FastAPI(
    title="MergeMind — AI GitHub Integration Advisor API",
    version="1.0.0",
    description="Agentic multi-stage pipeline detecting hidden integration and semantic risks."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Persistent in-memory session cache for reviews and settings
CURRENT_ANALYSIS: Optional[RepositoryAnalysis] = None
RUNTIME_SETTINGS: Dict[str, str] = {
    "provider": os.getenv("LLM_PROVIDER", "mock"),
    "model": os.getenv("LLM_MODEL", "gpt-4o-mini"),
    "api_key": os.getenv("LLM_API_KEY", ""),
    "base_url": os.getenv("LLM_BASE_URL", "")
}

class SettingsUpdateRequest(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None

class TestRunRequest(BaseModel):
    command: str

class CompareBranchesRequest(BaseModel):
    repo_url: Optional[str] = None
    branch_a: str
    branch_b: str
    token: Optional[str] = None
    use_demo: bool = False

class PatchValidationRequest(BaseModel):
    file_path: str
    unified_diff: str
    reconciled_code: Optional[str] = ""

async def get_demo_analysis(branch_a: Optional[str] = None, branch_b: Optional[str] = None) -> RepositoryAnalysis:
    global CURRENT_ANALYSIS
    analysis = await run_agentic_analysis(
        repo_name=DEMO_REPO_NAME,
        branches=DEMO_BRANCHES,
        commits=DEMO_COMMITS,
        pull_requests=DEMO_PULL_REQUESTS,
        target_branch_a=branch_a or "feature/auth",
        target_branch_b=branch_b or "feature/api-refactor",
        is_demo=True,
        provider_override=RUNTIME_SETTINGS.get("provider")
    )

    # Re-apply any stored reviews from database
    db_reviews = get_latest_reviews()
    for risk in analysis.detected_risks:
        if risk.id in db_reviews:
            risk.review_status = db_reviews[risk.id]["status"]
            risk.review_notes = db_reviews[risk.id].get("notes")

    CURRENT_ANALYSIS = analysis
    return analysis

@app.get("/")
def root():
    return {
        "service": "MergeMind — AI GitHub Integration Advisor",
        "status": "online",
        "version": "1.0.0",
        "engine": "llm_reasoning" if RUNTIME_SETTINGS.get("api_key") else "deterministic_rule_based",
        "active_provider": RUNTIME_SETTINGS.get("provider"),
        "agents": [
            "1. AST & Normalized Code Parser Engine",
            "2. Commit Understanding Agent",
            "3. Change Mapping Agent",
            "4. Collision Detection Agent (12 Categories)",
            "5. Semantic Risk Agent (100-Point Scoring)",
            "6. Resolution Planning Agent",
            "7. Compatibility & Reconciliation Engine",
            "8. Test Recommendation & Sandboxed Runner"
        ]
    }

@app.get("/api/health")
@app.get("/health")
def health():
    return {"status": "ok", "timestamp": "2026-10-04T13:30:00Z"}

@app.get("/api/demo", response_model=RepositoryAnalysis)
@app.get("/demo", response_model=RepositoryAnalysis)
async def demo_analysis(branch_a: Optional[str] = None, branch_b: Optional[str] = None):
    """
    Returns pre-configured demo repository with 4 developers, 4 branches, 18 commits,
    and highlighted semantic collisions.
    """
    return await get_demo_analysis(branch_a, branch_b)

@app.post("/api/analyze", response_model=RepositoryAnalysis)
@app.post("/analyze", response_model=RepositoryAnalysis)
async def analyze_repository(req: AnalyzeRepoRequest):
    """
    Runs multi-agent analysis on either the demo repository or a live GitHub repository.
    Strictly reports failures without silent demo fallback.
    """
    if req.use_demo or not req.repo_url:
        return await get_demo_analysis(req.branch_a, req.branch_b)

    # Live GitHub retrieval
    repo_data, error = await fetch_github_repository(req.repo_url, req.token)
    if error or not repo_data:
        raise HTTPException(
            status_code=400,
            detail={
                "error": error or "Could not connect to live GitHub repository.",
                "stage": "repository_ingestion",
                "recovery_action": "Verify repository URL ('owner/repo'), provide a valid GitHub PAT for private repositories or rate limits, or select Demo Mode."
            }
        )

    commits = repo_data["commits"]
    if len(commits) < 2:
        raise HTTPException(
            status_code=400,
            detail={
                "error": f"Repository '{repo_data['name']}' has fewer than 2 commits. MergeMind requires commit history to analyze parallel branch changes.",
                "stage": "commit_retrieval",
                "recovery_action": "Select a repository with multiple branches or commits, or select Demo Mode."
            }
        )

    analysis = await run_agentic_analysis(
        repo_name=repo_data["name"],
        branches=repo_data["branches"],
        commits=commits,
        pull_requests=repo_data.get("pull_requests", []),
        target_branch_a=req.branch_a,
        target_branch_b=req.branch_b,
        is_demo=False,
        warning_message=repo_data.get("warning_message"),
        rate_limited=repo_data.get("rate_limited", False),
        provider_override=RUNTIME_SETTINGS.get("provider")
    )
    
    global CURRENT_ANALYSIS
    CURRENT_ANALYSIS = analysis
    return analysis

@app.post("/api/compare", response_model=RepositoryAnalysis)
@app.post("/compare", response_model=RepositoryAnalysis)
async def compare_branches(req: CompareBranchesRequest):
    """
    Compares two branches specifically, computing merge base and cross-branch collisions.
    """
    if req.use_demo or not req.repo_url:
        return await get_demo_analysis(req.branch_a, req.branch_b)

    # Perform real branch comparison via GitHub Compare API
    compare_data, error = await fetch_branch_comparison(
        req.repo_url, req.branch_a, req.branch_b, req.token
    )
    if error or not compare_data:
        # Fall back to analyzing repo with targeted branches
        return await analyze_repository(AnalyzeRepoRequest(
            repo_url=req.repo_url,
            branch_a=req.branch_a,
            branch_b=req.branch_b,
            token=req.token,
            use_demo=False
        ))

    # Ingest commits from compare API
    repo_meta, _ = await fetch_github_repository(req.repo_url, req.token)
    branches = repo_meta["branches"] if repo_meta else [req.branch_a, req.branch_b]
    prs = repo_meta["pull_requests"] if repo_meta else []

    commits = compare_data.get("commits", [])
    if len(commits) < 2 and repo_meta:
        commits = repo_meta["commits"]

    analysis = await run_agentic_analysis(
        repo_name=req.repo_url,
        branches=branches,
        commits=commits,
        pull_requests=prs,
        target_branch_a=req.branch_a,
        target_branch_b=req.branch_b,
        is_demo=False,
        warning_message=repo_meta.get("warning_message") if repo_meta else None,
        rate_limited=repo_meta.get("rate_limited", False) if repo_meta else False,
        provider_override=RUNTIME_SETTINGS.get("provider")
    )

    global CURRENT_ANALYSIS
    CURRENT_ANALYSIS = analysis
    return analysis

@app.get("/api/risks", response_model=List[IntegrationRisk])
@app.get("/risks", response_model=List[IntegrationRisk])
async def get_risks():
    """Returns detected risks from the current active analysis."""
    global CURRENT_ANALYSIS
    if not CURRENT_ANALYSIS:
        await get_demo_analysis()
    return CURRENT_ANALYSIS.detected_risks if CURRENT_ANALYSIS else []

@app.get("/api/risks/{risk_id}", response_model=IntegrationRisk)
@app.get("/risks/{risk_id}", response_model=IntegrationRisk)
async def get_risk_by_id(risk_id: str):
    """Returns details for a specific detected risk."""
    global CURRENT_ANALYSIS
    if not CURRENT_ANALYSIS:
        await get_demo_analysis()
    if CURRENT_ANALYSIS:
        for r in CURRENT_ANALYSIS.detected_risks:
            if r.id == risk_id:
                return r
    raise HTTPException(status_code=404, detail=f"Risk '{risk_id}' not found.")

@app.post("/api/review")
@app.post("/review")
def review_risk(req: ReviewActionRequest):
    """
    Human-in-the-loop review endpoint. Marks a risk as reviewed or dismissed and persists to SQLite.
    """
    update_risk_review(req.risk_id, req.status, req.notes)

    global CURRENT_ANALYSIS
    if CURRENT_ANALYSIS:
        for r in CURRENT_ANALYSIS.detected_risks:
            if r.id == req.risk_id:
                r.review_status = req.status
                r.review_notes = req.notes
                break

    return {
        "success": True,
        "risk_id": req.risk_id,
        "new_status": req.status
    }

@app.post("/api/patches/{patch_id}/validate")
@app.post("/patches/{patch_id}/validate")
def validate_patch_endpoint(patch_id: str, req: PatchValidationRequest):
    """
    Validates a compatibility patch against syntax and temporary git worktree.
    """
    is_valid, msg = validate_patch(req.file_path, req.unified_diff, req.reconciled_code or "")
    return {
        "patch_id": patch_id,
        "is_valid": is_valid,
        "validation_message": msg
    }

@app.post("/api/test/run", response_model=TestExecutionResult)
@app.post("/test/run", response_model=TestExecutionResult)
async def run_test_endpoint(req: TestRunRequest):
    """
    Secure sandboxed test execution endpoint.
    Runs approved commands in an isolated process with zero backend secrets.
    """
    return await run_sandboxed_test(req.command)

@app.get("/api/audit-trail")
@app.get("/audit-trail")
def audit_trail():
    """Returns audit log of repository analyses and developer reviews from SQLite."""
    return {
        "audit_trail": get_audit_trail()
    }

@app.get("/api/settings")
@app.get("/settings")
def get_settings():
    """
    Returns current LLM provider and engine settings (masks API key).
    """
    raw_key = RUNTIME_SETTINGS.get("api_key", "")
    masked_key = f"{raw_key[:4]}...{raw_key[-4:]}" if len(raw_key) > 8 else ("Configured" if raw_key else "Not configured")
    is_active = bool(raw_key) and RUNTIME_SETTINGS.get("provider") != "mock"

    return {
        "provider": RUNTIME_SETTINGS.get("provider", "mock"),
        "model": RUNTIME_SETTINGS.get("model", "gpt-4o-mini"),
        "has_api_key": bool(raw_key),
        "masked_api_key": masked_key,
        "base_url": RUNTIME_SETTINGS.get("base_url", ""),
        "engine_mode": "AI-Powered LLM Reasoning" if is_active else "Deterministic Rule-Based Analysis",
        "is_ai_active": is_active
    }

@app.post("/api/settings")
@app.post("/settings")
def update_settings(req: SettingsUpdateRequest):
    """
    Updates active LLM provider configuration in runtime memory.
    """
    if req.provider is not None:
        RUNTIME_SETTINGS["provider"] = req.provider.strip()
        os.environ["LLM_PROVIDER"] = req.provider.strip()
    if req.model is not None:
        RUNTIME_SETTINGS["model"] = req.model.strip()
        os.environ["LLM_MODEL"] = req.model.strip()
    if req.api_key is not None:
        RUNTIME_SETTINGS["api_key"] = req.api_key.strip()
        os.environ["LLM_API_KEY"] = req.api_key.strip()
    if req.base_url is not None:
        RUNTIME_SETTINGS["base_url"] = req.base_url.strip()
        os.environ["LLM_BASE_URL"] = req.base_url.strip()

    return {"status": "updated", "settings": get_settings()}
