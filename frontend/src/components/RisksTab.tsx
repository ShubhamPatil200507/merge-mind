import React, { useState } from 'react';
import { 
  FileCode, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  GitBranch, 
  Layers, 
  Info, 
  Search, 
  Maximize2,
  AlertCircle
} from 'lucide-react';
import { IntegrationRisk, ReviewStatus } from '../types';

interface RisksTabProps {
  risks: IntegrationRisk[];
  onReviewRisk: (riskId: string, status: ReviewStatus, notes?: string) => void;
  onOpenResolution: (riskId: string) => void;
  onOpenDetailModal: (risk: IntegrationRisk) => void;
  selectedRiskId?: string;
}

export const RisksTab: React.FC<RisksTabProps> = ({
  risks,
  onReviewRisk,
  onOpenResolution,
  onOpenDetailModal,
  selectedRiskId
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(selectedRiskId || 'collision-semantic-auth-bypass');
  const [showScoreModal, setShowScoreModal] = useState<string | null>(null);

  const query = searchQuery.trim().toLowerCase();

  const filteredRisks = risks.filter((r) => {
    if (filterType !== 'ALL' && r.collision_type !== filterType && r.risk_level !== filterType) {
      return false;
    }
    if (filterStatus !== 'ALL' && r.review_status !== filterStatus) {
      return false;
    }
    if (query) {
      const matchTitle = r.title.toLowerCase().includes(query);
      const matchSummary = r.summary.toLowerCase().includes(query);
      const matchFile = r.affected_files.some((f) => f.toLowerCase().includes(query));
      const matchBranch = r.branches.some((b) => b.toLowerCase().includes(query));
      const matchCommit = r.commits.some((c) => c.toLowerCase().includes(query));
      const matchAuthor = r.evidence.some((e) => e.author.toLowerCase().includes(query));
      if (!matchTitle && !matchSummary && !matchFile && !matchBranch && !matchCommit && !matchAuthor) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar (Section 6 & 23 requirement) */}
      <div className="p-3.5 rounded-lg bg-[#161b22] border border-[#30363d] space-y-3 text-xs">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search risks by file name, branch, commit hash, author, or issue keyword..."
            className="w-full pl-9 pr-3.5 py-2 rounded bg-[#0d1117] border border-[#30363d] text-white text-xs font-mono focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-gray-500 hover:text-white text-xs font-mono"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-gray-500 mr-1 text-[11px]">FILTER:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'SEMANTIC', 'API_CONTRACT', 'DEPENDENCY'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  filterType === f
                    ? 'bg-[#21262d] text-white border border-gray-600 font-semibold'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#21262d]/50'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-500">STATE:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1 text-xs font-mono rounded bg-[#0d1117] border border-[#30363d] text-gray-200 focus:outline-none"
            >
              <option value="ALL">All States</option>
              <option value="PENDING">Pending Review</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State (Section 22 requirement) */}
      {filteredRisks.length === 0 && (
        <div className="p-8 rounded-lg bg-[#161b22] border border-[#30363d] text-center text-xs space-y-2">
          <div className="font-mono text-gray-300 font-bold">No integration risks match your search criteria.</div>
          <p className="text-gray-500 max-w-md mx-auto text-[11px]">
            This does not guarantee that the repository is risk-free. Adjust your search filters or re-run analysis after new commits are pushed.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterType('ALL');
              setFilterStatus('ALL');
            }}
            className="px-3 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-gray-300 text-xs font-mono mt-2"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Risks List */}
      <div className="space-y-3">
        {filteredRisks.map((risk) => {
          const isCrit = risk.risk_level === 'CRITICAL';
          const isHigh = risk.risk_level === 'HIGH';
          const isEvidenceOpen = expandedEvidenceId === risk.id;

          return (
            <div
              key={risk.id}
              className={`rounded-lg border transition-colors ${
                risk.review_status === 'REVIEWED'
                  ? 'bg-[#161b22]/70 border-emerald-900/60'
                  : risk.review_status === 'DISMISSED'
                  ? 'bg-[#161b22]/50 border-gray-800 opacity-60'
                  : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              {/* Card Main */}
              <div className="p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border flex items-center gap-1.5 ${
                      isCrit
                        ? 'bg-red-950/80 text-red-300 border-red-800'
                        : isHigh
                        ? 'bg-orange-950/80 text-orange-300 border-orange-800'
                        : 'bg-amber-950/70 text-amber-300 border-amber-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isCrit ? 'bg-red-500' : isHigh ? 'bg-orange-500' : 'bg-amber-500'
                      }`} />
                      {risk.risk_level}
                    </span>

                    <button
                      onClick={() => setShowScoreModal(showScoreModal === risk.id ? null : risk.id)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0d1117] text-gray-300 border border-[#30363d] hover:border-gray-500 transition-colors flex items-center gap-1"
                      title="View calculation breakdown"
                    >
                      Score: {risk.risk_score.total}/100
                      <Info className="w-3 h-3 text-gray-400" />
                    </button>

                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0d1117] text-gray-400 border border-[#30363d]">
                      {risk.collision_type}
                    </span>

                    {risk.review_status === 'REVIEWED' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                        REVIEWED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400">
                    <GitBranch className="w-3 h-3 text-blue-400" />
                    <span>{risk.branches[0]}</span>
                    <span className="text-gray-600">↔</span>
                    <span>{risk.branches[1]}</span>
                  </div>
                </div>

                {/* Score breakdown drawer */}
                {showScoreModal === risk.id && (
                  <div className="p-3 rounded bg-[#0d1117] border border-[#30363d] text-xs font-mono space-y-2">
                    <div className="text-gray-400 text-[11px] flex justify-between">
                      <span>RISK SCORE METRIC BREAKDOWN</span>
                      <span className="text-white font-bold">{risk.risk_score.total} / 100</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
                        <div className="text-gray-500">Code Overlap</div>
                        <div className="text-gray-200 font-bold">{risk.risk_score.code_overlap}/30</div>
                      </div>
                      <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
                        <div className="text-gray-500">Dependency</div>
                        <div className="text-gray-200 font-bold">{risk.risk_score.dependency_interaction}/20</div>
                      </div>
                      <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
                        <div className="text-gray-500">API Impact</div>
                        <div className="text-gray-200 font-bold">{risk.risk_score.api_impact}/20</div>
                      </div>
                      <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
                        <div className="text-gray-500">Security</div>
                        <div className="text-gray-200 font-bold">{risk.risk_score.security_impact}/20</div>
                      </div>
                      <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
                        <div className="text-gray-500">Test Uncertainty</div>
                        <div className="text-gray-200 font-bold">{risk.risk_score.test_coverage_uncertainty}/10</div>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 font-sans">
                      {risk.risk_score.explanation}
                    </p>
                  </div>
                )}

                <h3 className="text-sm font-semibold text-white">
                  {risk.title}
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                  {risk.summary}
                </p>

                {/* Affected Meta */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 pt-1 font-mono">
                  <div>
                    Files: <span className="text-gray-200">{risk.affected_files.join(', ')}</span>
                  </div>
                  <span className="text-gray-600">|</span>
                  <div>
                    Components: <span className="text-gray-200">{risk.affected_components.join(', ')}</span>
                  </div>
                  <span className="text-gray-600">|</span>
                  <div>
                    Confidence: <span className="text-gray-200">{Math.round(risk.confidence * 100)}%</span>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="text-[11px] text-gray-400 bg-[#0d1117] p-2 rounded border border-[#30363d] flex items-center gap-2 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{risk.ai_disclaimer}</span>
                </div>
              </div>

              {/* Action Ribbon */}
              <div className="px-4 py-2.5 bg-[#0d1117] border-t border-[#30363d] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedEvidenceId(isEvidenceOpen ? null : risk.id)}
                    className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-gray-200 font-medium border border-[#30363d] transition-colors flex items-center gap-1.5 text-xs font-mono"
                  >
                    <span>{isEvidenceOpen ? 'Hide Evidence' : 'View Evidence'}</span>
                    {isEvidenceOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => onOpenDetailModal(risk)}
                    className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-gray-200 font-medium border border-[#30363d] transition-colors flex items-center gap-1 text-xs font-mono"
                  >
                    <Maximize2 className="w-3 h-3 text-gray-400" />
                    <span>Deep-Dive Detail</span>
                  </button>

                  <button
                    onClick={() => onOpenResolution(risk.id)}
                    className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-blue-400 font-medium border border-blue-900/60 transition-colors flex items-center gap-1.5 text-xs font-mono"
                  >
                    <span>Resolution Plan</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  {risk.review_status !== 'REVIEWED' && (
                    <button
                      onClick={() => onReviewRisk(risk.id, 'REVIEWED', 'Verified by developer')}
                      className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-800 text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Mark Reviewed
                    </button>
                  )}

                  {risk.review_status !== 'DISMISSED' && (
                    <button
                      onClick={() => onReviewRisk(risk.id, 'DISMISSED', 'Dismissed by developer')}
                      className="px-2 py-1 rounded bg-[#161b22] hover:bg-[#21262d] text-gray-400 border border-[#30363d] text-xs transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Dismiss
                    </button>
                  )}

                  {risk.review_status !== 'PENDING' && (
                    <button
                      onClick={() => onReviewRisk(risk.id, 'PENDING')}
                      className="text-gray-500 hover:text-gray-300 text-[11px] underline font-mono"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Evidence Section */}
              {isEvidenceOpen && (
                <div className="p-4 border-t border-[#30363d] bg-[#0d1117] space-y-3">
                  <div className="text-xs font-mono font-semibold uppercase text-gray-400">
                    Commit Diff Evidence ({risk.evidence.length} observations)
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {risk.evidence.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded bg-[#161b22] border border-[#30363d] space-y-1.5 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-blue-400 font-bold">{item.commit_sha}</span>
                          <span className="text-gray-500">{item.branch}</span>
                        </div>
                        <div className="text-gray-200 font-sans text-xs">
                          "{item.commit_message}"
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Author: {item.author}
                        </div>
                        <div className="p-2 rounded bg-[#0d1117] border border-[#30363d] text-gray-300 overflow-x-auto text-[11px]">
                          <code>{item.snippet_or_symbol}</code>
                        </div>
                        <div className="text-[11px] text-gray-400 font-sans pt-1">
                          {item.observation}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded bg-[#161b22] border border-[#30363d] text-xs space-y-1">
                    <div className="text-gray-400 font-mono text-[11px]">TECHNICAL RATIONALE:</div>
                    <p className="text-gray-300 leading-relaxed font-sans">
                      {risk.why_it_exists}
                    </p>
                    <div className="text-red-400 text-[11px] font-mono pt-1">
                      POTENTIAL IMPACT: {risk.potential_impact}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
