export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type CollisionType =
  | 'DIRECT_FILE'
  | 'FUNCTION'
  | 'STRUCTURAL'
  | 'API_CONTRACT'
  | 'DEPENDENCY'
  | 'SCHEMA'
  | 'SEMANTIC'
  | 'CONFIGURATION'
  | 'EXECUTION_ORDER'
  | 'STATE_DATA_FLOW'
  | 'TEST_INCOMPATIBILITY'
  | 'PERFORMANCE_REGRESSION'
  | 'SEMANTIC_OVERLAP';

export type ReviewStatus = 'PENDING' | 'REVIEWED' | 'DISMISSED';

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  timestamp: string;
  branch: string;
  files_changed: string[];
  additions: number;
  deletions: number;
  diff_snippet?: string;
  pr_number?: number;
}

export interface CommitUnderstanding {
  sha: string;
  branch: string;
  intent: string;
  category: string;
  affected_components: string[];
  risk_level: RiskLevel;
  confidence: number;
  raw_message_trusted: boolean;
  inferred_reasoning: string;
}

export interface ChangeMap {
  sha: string;
  branch: string;
  files_changed: string[];
  functions_changed: string[];
  classes_changed: string[];
  apis_changed: string[];
  dependencies_changed: string[];
  config_changed: string[];
  schema_changed: string[];
  tests_changed: string[];
  frontend_components: string[];
  backend_services?: string[];
}

export interface EvidenceItem {
  commit_sha: string;
  commit_message: string;
  author: string;
  branch: string;
  changed_files: string[];
  snippet_or_symbol: string;
  observation: string;
}

export interface RiskScoreBreakdown {
  code_overlap: number;
  dependency_interaction: number;
  api_impact: number;
  security_impact: number;
  test_coverage_uncertainty: number;
  total: number;
  explanation: string;
}

export interface ResolutionStep {
  step_number: number;
  action: string;
  detail: string;
  file_reference?: string;
}

export interface TestRecommendation {
  framework_detected?: string;
  tooling_detected?: string;
  test_runner?: string;
  recommended_commands?: string[];
  test_commands?: string[];
  verification_areas?: string[];
  test_areas?: string[];
  reasoning: string;
}

export interface CompatibilityPatch {
  id: string;
  risk_id?: string;
  file_path: string;
  target_branch?: string;
  source_branch?: string;
  strategy_name?: string;
  summary?: string;
  compatibility_strategy?: string;
  summary_of_changes?: string;
  reconciled_code: string;
  unified_diff: string;
  instructions?: string[];
  git_apply_command?: string;
  why_this_resolves?: string;
  confidence?: number;
  is_validated?: boolean;
  ai_disclaimer?: string;
}

export interface IntegrationRisk {
  id: string;
  title: string;
  collision_type: CollisionType;
  risk_level: RiskLevel;
  risk_score: RiskScoreBreakdown;
  branches: string[];
  commits: string[];
  summary: string;
  why_it_exists: string;
  affected_files: string[];
  affected_components: string[];
  evidence: EvidenceItem[];
  potential_impact: string;
  confidence: number;
  recommended_steps: ResolutionStep[];
  test_recommendation: TestRecommendation;
  compatibility_patch?: CompatibilityPatch;
  review_status: ReviewStatus;
  review_notes?: string;
  requires_human_review: boolean;
  ai_disclaimer: string;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  author: string;
  author_name?: string;
  author_avatar?: string;
  source_branch: string;
  target_branch: string;
  created_at: string;
  updated_at: string;
  status: string;
  description: string;
  changed_files_count: number;
  additions: number;
  deletions: number;
}

export interface AgentTraceStep {
  step_number: number;
  agent_name: string;
  action: string;
  status: string;
  duration_ms: number;
  output_summary: string;
}

export interface RepositoryAnalysis {
  repository_name: string;
  branches: string[];
  commits: CommitInfo[];
  pull_requests: PullRequest[];
  understandings: CommitUnderstanding[];
  change_maps: ChangeMap[];
  detected_risks: IntegrationRisk[];
  compatibility_patches: CompatibilityPatch[];
  agent_trace?: AgentTraceStep[];
  risk_summary: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  active_branch_a?: string;
  active_branch_b?: string;
  analyzed_at: string;
  is_demo: boolean;
  rate_limited: boolean;
  warning_message?: string;
}

export interface TestExecutionResult {
  command: string;
  status: 'completed' | 'failed' | 'timeout' | 'sandboxed_unavailable' | 'forbidden';
  exit_code?: number;
  stdout: string;
  stderr: string;
  duration_ms: number;
  is_sandboxed: boolean;
  disclaimer: string;
}

export interface LLMSettings {
  provider: string;
  model: string;
  has_api_key: boolean;
  masked_api_key: string;
  base_url?: string;
  engine_mode: string;
  is_ai_active: boolean;
}
