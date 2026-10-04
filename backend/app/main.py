"""
MergeMind FastAPI Application
Backend server hosting the 7 Agent Pipeline, GitHub Client, Demo Engine,
Branch Comparison Engine, and Review Center.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional
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

# Persistent in-memory session cache for reviews
CURRENT_ANALYSIS: Optional[RepositoryAnalysis] = None
REVIEW_STORE: Dict[str, Dict[str, Any]] = {}

def get_demo_analysis(branch_a: Optional[str] = None, branch_b: Optional[str] = None) -> RepositoryAnalysis:
    global CURRENT_ANALYSIS
    analysis = run_agentic_analysis(
        repo_name=DEMO_REPO_NAME,
        branches=DEMO_BRANCHES,
        commits=DEMO_COMMITS,
        pull_requests=DEMO_PULL_REQUESTS,
        target_branch_a=branch_a or "feature/auth",
        target_branch_b=branch_b or "feature/api-refactor",
        is_demo=True
    )

    # Re-apply any stored reviews
    for risk in analysis.detected_risks:
        if risk.id in REVIEW_STORE:
            risk.review_status = REVIEW_STORE[risk.id]["status"]
            risk.review_notes = REVIEW_STORE[risk.id].get("notes")

    CURRENT_ANALYSIS = analysis
    return analysis

@app.get("/")
def root():
    return {
        "service": "MergeMind — AI GitHub Integration Advisor",
        "status": "online",
        "version": "1.0.0",
        "agents": [
            "1. Commit Understanding Agent",
            "2. Change Mapping Agent",
            "3. Collision Detection Agent",
            "4. Semantic Risk Agent",
            "5. Risk Assessment Agent",
            "6. Resolution Planning Agent",
            "7. Test Recommendation Agent"
        ]
    }

@app.get("/api/health")
@app.get("/health")
def health():
    return {"status": "ok", "timestamp": "2026-10-04T13:30:00Z"}

@app.get("/api/demo", response_model=RepositoryAnalysis)
@app.get("/demo", response_model=RepositoryAnalysis)
def demo_analysis(branch_a: Optional[str] = None, branch_b: Optional[str] = None):
    """
    Returns the rich pre-configured demo repository with 4 developers, 4 branches,
    18 commits, and the highlighted semantic auth-bypass collision.
    """
    return get_demo_analysis(branch_a, branch_b)

@app.post("/api/analyze", response_model=RepositoryAnalysis)
@app.post("/analyze", response_model=RepositoryAnalysis)
async def analyze_repository(req: AnalyzeRepoRequest):
    """
    Runs multi-agent analysis on either the demo repository or a live GitHub repository.
    """
    if req.use_demo or not req.repo_url:
        return get_demo_analysis(req.branch_a, req.branch_b)

    # Live GitHub retrieval
    repo_data, error = await fetch_github_repository(req.repo_url, req.token)
    if error or not repo_data:
        # Graceful fallback: return demo analysis with explanatory warning
        demo = get_demo_analysis(req.branch_a, req.branch_b)
        demo.warning_message = error or "Could not connect to live repository. Showing Demo Repository."
        return demo

    # If repo has very few commits, augment with demo structure or run on real commits
    commits = repo_data["commits"]
    if len(commits) < 2:
        demo = get_demo_analysis(req.branch_a, req.branch_b)
        demo.warning_message = f"Repository '{repo_data['name']}' has insufficient parallel commit history. Loaded demo comparison for illustration."
        return demo

    analysis = run_agentic_analysis(
        repo_name=repo_data["name"],
        branches=repo_data["branches"],
        commits=commits,
        pull_requests=repo_data["pull_requests"],
        target_branch_a=req.branch_a,
        target_branch_b=req.branch_b,
        is_demo=False
    )
    return analysis

@app.post("/api/review")
@app.post("/review")
def review_risk(req: ReviewActionRequest):
    """
    Human-in-the-loop review endpoint. Marks a risk as reviewed or dismissed.
    """
    REVIEW_STORE[req.risk_id] = {
        "status": req.status,
        "notes": req.notes
    }

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
    
    # Generic mock for other files
    return {
        "filename": filename,
        "branch_a": branch_a,
        "branch_b": branch_b,
        "content_main": f"// Baseline version of {filename}\nexport default function module() {{}}",
        "content_a": f"// {branch_a} version of {filename}\n// Parallel modifications applied",
        "content_b": f"// {branch_b} version of {filename}\n// Concurrent changes applied"
    }
