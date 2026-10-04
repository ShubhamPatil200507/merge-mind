from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from enum import Enum

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class CollisionType(str, Enum):
    DIRECT_FILE = "DIRECT_FILE"
    FUNCTION = "FUNCTION"
    STRUCTURAL = "STRUCTURAL"
    API_CONTRACT = "API_CONTRACT"
    DEPENDENCY = "DEPENDENCY"
    SCHEMA = "SCHEMA"
    SEMANTIC = "SEMANTIC"
    CONFIGURATION = "CONFIGURATION"
    EXECUTION_ORDER = "EXECUTION_ORDER"
    STATE_DATA_FLOW = "STATE_DATA_FLOW"
    TEST_INCOMPATIBILITY = "TEST_INCOMPATIBILITY"
    PERFORMANCE_REGRESSION = "PERFORMANCE_REGRESSION"
    SEMANTIC_OVERLAP = "SEMANTIC_OVERLAP"

class ReviewStatus(str, Enum):
    PENDING = "PENDING"
    REVIEWED = "REVIEWED"
    DISMISSED = "DISMISSED"

class CommitInfo(BaseModel):
    sha: str
    message: str
    author: str
    timestamp: str
    branch: str
    files_changed: List[str] = []
    additions: int = 0
    deletions: int = 0
    diff_snippet: Optional[str] = None
    pr_number: Optional[int] = None

class CommitUnderstanding(BaseModel):
    sha: str
    branch: str
    intent: str
    category: str # "security", "refactoring", "feature", "bugfix", "dependency", "database", "api"
    affected_components: List[str]
    risk_level: RiskLevel
    confidence: float
    raw_message_trusted: bool = False
    inferred_reasoning: str

class ChangeMap(BaseModel):
    sha: str
    branch: str
    files_changed: List[str] = []
    functions_changed: List[str] = []
    classes_changed: List[str] = []
    apis_changed: List[str] = []
    dependencies_changed: List[str] = []
    config_changed: List[str] = []
    schema_changed: List[str] = []
    tests_changed: List[str] = []
    frontend_components: List[str] = []
    backend_services: List[str] = []

class FileSnapshot(BaseModel):
    path: str
    language: str
    content: str
    blob_sha: Optional[str] = None
    size: Optional[int] = None
    lines: Optional[int] = None

class RepositorySnapshot(BaseModel):
    repository: str
    branch: str
    commit_sha: str
    parent_sha: Optional[str] = None
    merge_base_sha: Optional[str] = None
    files: Dict[str, FileSnapshot] = Field(default_factory=dict)

class BranchComparison(BaseModel):
    base_branch: str
    target_branch: str
    merge_base: str
    changed_files_a: List[str] = Field(default_factory=list)
    changed_files_b: List[str] = Field(default_factory=list)
    commits_a: List[CommitInfo] = Field(default_factory=list)
    commits_b: List[CommitInfo] = Field(default_factory=list)
    files_a: Dict[str, FileSnapshot] = Field(default_factory=dict)
    files_b: Dict[str, FileSnapshot] = Field(default_factory=dict)

class EvidenceItem(BaseModel):
    commit_sha: str
    commit_message: str
    author: str
    branch: str
    changed_files: List[str]
    snippet_or_symbol: str
    observation: str

class RiskScoreBreakdown(BaseModel):
    code_overlap: int = Field(..., ge=0, le=30, description="Max 30")
    dependency_interaction: int = Field(..., ge=0, le=20, description="Max 20")
    api_impact: int = Field(..., ge=0, le=20, description="Max 20")
    security_impact: int = Field(..., ge=0, le=20, description="Max 20")
    test_coverage_uncertainty: int = Field(..., ge=0, le=10, description="Max 10")
    total: int = Field(..., ge=0, le=100)
    explanation: str

class ResolutionStep(BaseModel):
    step_number: int
    action: str
    detail: str
    file_reference: Optional[str] = None

class TestRecommendation(BaseModel):
    tooling_detected: str = "Standard Test Runner"
    test_commands: List[str] = []
    test_areas: List[str] = []
    reasoning: str = ""
    framework_detected: Optional[str] = None
    test_runner: Optional[str] = None
    recommended_commands: Optional[List[str]] = None
    verification_areas: Optional[List[str]] = None

class CompatibilityPatch(BaseModel):
    id: str
    file_path: str
    risk_id: Optional[str] = None
    target_branch: Optional[str] = "main"
    source_branch: Optional[str] = "feature"
    strategy_name: Optional[str] = None
    summary: Optional[str] = None
    compatibility_strategy: Optional[str] = None
    summary_of_changes: Optional[str] = None
    reconciled_code: str
    unified_diff: str
    git_apply_command: Optional[str] = None
    why_this_resolves: Optional[str] = None
    confidence: Optional[float] = 0.9
    is_validated: Optional[bool] = True
    ai_disclaimer: Optional[str] = "AI-GENERATED • REQUIRES HUMAN REVIEW • REQUIRES TESTING"
    instructions: List[str] = []

class IntegrationRisk(BaseModel):
    id: str
    title: str
    collision_type: CollisionType
    risk_level: RiskLevel
    risk_score: RiskScoreBreakdown
    branches: List[str]
    commits: List[str]
    summary: str
    why_it_exists: str
    affected_files: List[str]
    affected_components: List[str]
    evidence: List[EvidenceItem]
    potential_impact: str
    confidence: float # 0.0 - 1.0
    recommended_steps: List[ResolutionStep]
    test_recommendation: TestRecommendation
    compatibility_patch: Optional[CompatibilityPatch] = None
    review_status: ReviewStatus = ReviewStatus.PENDING
    review_notes: Optional[str] = None
    requires_human_review: bool = True
    ai_disclaimer: str = "Potential risk identified through semantic analysis. Requires developer verification before merging."

class BranchOverview(BaseModel):
    name: str
    commit_count: int
    last_commit_message: str
    last_commit_author: str
    last_commit_date: str
    has_active_pr: bool
    pr_number: Optional[int] = None
    pr_title: Optional[int] = None

class AgentTraceStep(BaseModel):
    step_number: int
    agent_name: str
    action: str
    status: str = "completed"
    duration_ms: int = 120
    output_summary: str

class RepositoryAnalysis(BaseModel):
    repository_name: str
    branches: List[str]
    commits: List[CommitInfo]
    pull_requests: List[Dict[str, Any]]
    understandings: List[CommitUnderstanding]
    change_maps: List[ChangeMap]
    detected_risks: List[IntegrationRisk]
    compatibility_patches: List[CompatibilityPatch] = []
    agent_trace: List[AgentTraceStep] = []
    risk_summary: Dict[str, int] # e.g. {"CRITICAL": 1, "HIGH": 2, "MEDIUM": 2, "LOW": 3}
    active_branch_a: Optional[str] = None
    active_branch_b: Optional[str] = None
    analyzed_at: str
    is_demo: bool = False
    rate_limited: bool = False
    warning_message: Optional[str] = None

class ReviewActionRequest(BaseModel):
    risk_id: str
    status: ReviewStatus
    notes: Optional[str] = None

class AnalyzeRepoRequest(BaseModel):
    repo_url: Optional[str] = None # e.g. "facebook/react" or "org/repo"
    token: Optional[str] = None
    branch_a: Optional[str] = None
    branch_b: Optional[str] = None
    use_demo: bool = False
