"""
MergeMind FastAPI Application
Backend server hosting the 7 Agent Pipeline, GitHub Client, Demo Engine,
Branch Comparison Engine, Sandboxed Test Runner, Review Center, and LLM Provider Settings.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional
from pydantic import BaseModel
import os

from app.models import (
    RepositoryAnalysis,
    AnalyzeRepoRequest,
    ReviewActionRequest,
    ReviewStatus
)
from app.demo_data import (
    DEMO_REPO_NAME,
    DEMO_BRANCHES,
    DEMO_COMMITS,
    DEMO_PULL_REQUESTS,
    FILE_SNAPSHOTS
)
from app.agents.pipeline import run_agentic_analysis
from app.github_client import fetch_github_repository
from app.test_runner import run_sandboxed_test, TestExecutionResult
from app.db.database import update_risk_review, get_latest_reviews

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
            "1. Commit Understanding Agent",
            "2. Change Mapping Agent",
            "3. Collision Detection Agent",
            "4. Semantic Risk Agent",
            "5. Risk Assessment Agent",
            "6. Resolution Planning Agent",
            "7. Compatibility & Reconciliation Engine",
            "8. Test Recommendation Agent"
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
    Returns the rich pre-configured demo repository with 4 developers, 4 branches,
    18 commits, and the highlighted semantic auth-bypass collision.
    """
    return await get_demo_analysis(branch_a, branch_b)

@app.post("/api/analyze", response_model=RepositoryAnalysis)
@app.post("/analyze", response_model=RepositoryAnalysis)
async def analyze_repository(req: AnalyzeRepoRequest):
    """
    Runs multi-agent analysis on either the demo repository or a live GitHub repository.
    """
    if req.use_demo or not req.repo_url:
        return await get_demo_analysis(req.branch_a, req.branch_b)

    # Live GitHub retrieval
    repo_data, error = await fetch_github_repository(req.repo_url, req.token)
    if error or not repo_data:
        demo = await get_demo_analysis(req.branch_a, req.branch_b)
        demo.warning_message = error or "Could not connect to live repository. Showing Demo Repository."
        return demo

    commits = repo_data["commits"]
    if len(commits) < 2:
        demo = await get_demo_analysis(req.branch_a, req.branch_b)
        demo.warning_message = f"Repository '{repo_data['name']}' has insufficient parallel commit history. Loaded demo comparison for illustration."
        return demo

    analysis = await run_agentic_analysis(
        repo_name=repo_data["name"],
        branches=repo_data["branches"],
        commits=commits,
        pull_requests=repo_data["pull_requests"],
        target_branch_a=req.branch_a,
        target_branch_b=req.branch_b,
        is_demo=False,
        provider_override=RUNTIME_SETTINGS.get("provider")
    )
    return analysis

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

@app.post("/api/test/run", response_model=TestExecutionResult)
@app.post("/test/run", response_model=TestExecutionResult)
async def run_test_endpoint(req: TestRunRequest):
    """
    Secure sandboxed test execution endpoint.
    Runs approved commands in an isolated process with zero backend secrets.
    """
    return await run_sandboxed_test(req.command)

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

    is_active = bool(RUNTIME_SETTINGS.get("api_key")) and RUNTIME_SETTINGS.get("provider") != "mock"
    return {
        "success": True,
        "provider": RUNTIME_SETTINGS["provider"],
        "model": RUNTIME_SETTINGS["model"],
        "engine_mode": "AI-Powered LLM Reasoning" if is_active else "Deterministic Rule-Based Analysis"
    }

@app.get("/api/file-diff")
@app.get("/file-diff")
def get_file_diff(filename: str, branch_a: str = "feature/auth", branch_b: str = "feature/api-refactor"):
    """
    Returns file content and diff between two branches for the interactive Diff Viewer.
    """
    if filename in FILE_SNAPSHOTS:
        file_data = FILE_SNAPSHOTS[filename]
        content_main = file_data.get("main", "")
        content_a = file_data.get(branch_a, file_data.get("main", ""))
        content_b = file_data.get(branch_b, file_data.get("main", ""))
        return {
            "filename": filename,
            "branch_a": branch_a,
            "branch_b": branch_b,
            "content_main": content_main,
            "content_a": content_a,
            "content_b": content_b
        }

    return {
        "filename": filename,
        "branch_a": branch_a,
        "branch_b": branch_b,
        "content_main": f"// Baseline version of {filename}\nexport default function module() {{}}",
        "content_a": f"// {branch_a} version of {filename}\n// Parallel modifications applied",
        "content_b": f"// {branch_b} version of {filename}\n// Concurrent changes applied"
    }
