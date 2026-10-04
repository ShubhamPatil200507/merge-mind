import React, { useState } from 'react';
import { 
  GitPullRequest, 
  GitBranch, 
  ShieldAlert, 
  CheckCircle2, 
  FileCode, 
  ArrowRight, 
  Terminal, 
  AlertTriangle,
  GitCommit
} from 'lucide-react';
import { RepositoryAnalysis, PullRequest, IntegrationRisk } from '../types';

interface PullRequestAnalysisTabProps {
  analysis: RepositoryAnalysis;
  onSelectRisk: (riskId: string) => void;
  onOpenResolution: (riskId: string) => void;
}

export const PullRequestAnalysisTab: React.FC<PullRequestAnalysisTabProps> = ({
  analysis,
  onSelectRisk,
  onOpenResolution
}) => {
  const prs = analysis.pull_requests || [];
  const [selectedPrId, setSelectedPrId] = useState<number>(prs[0]?.number || 101);

  if (prs.length === 0) {
    return (
      <div className="p-8 rounded-lg bg-[#161b22] border border-[#30363d] text-center text-xs font-mono text-gray-500">
        No active pull requests identified in repository.
      </div>
    );
  }

  const selectedPr = prs.find((p) => p.number === selectedPrId) || prs[0];

  // Find risks related to this PR's source branch
  const relatedRisks = analysis.detected_risks.filter((r) =>
    r.branches.includes(selectedPr.source_branch) ||
    r.branches.includes(selectedPr.target_branch)
  );

  // Commits belonging to this PR branch
  const prCommits = analysis.commits.filter((c) =>
    c.branch === selectedPr.source_branch || c.pr_number === selectedPr.number
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div>
          <div className="font-mono font-semibold text-white flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-emerald-400" />
            <span>PULL REQUEST SEMANTIC COMPATIBILITY MATRIX</span>
          </div>
          <div className="text-gray-400 text-xs">
            Assesses whether concurrent pull requests can merge into the target branch without behavioral conflict.
          </div>
        </div>
        <div className="font-mono text-gray-400 text-[11px] px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d]">
          {prs.length} Open Pull Requests Monitored
        </div>
      </div>

      {/* PR Selector Ribbon */}
      <div className="p-2 rounded-lg bg-[#161b22] border border-[#30363d] flex items-center gap-2 overflow-x-auto text-xs font-mono">
        <span className="text-gray-500 text-[11px] px-2">SELECT PR:</span>
        {prs.map((pr) => {
          const isSelected = selectedPr.number === pr.number;
          return (
            <button
              key={pr.number}
              onClick={() => setSelectedPrId(pr.number)}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#21262d] text-white border border-blue-500 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="text-emerald-400">#{pr.number}</span>
              <span className="max-w-[200px] truncate">{pr.title}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Cols: PR Overview & Semantic Risk Analysis */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="p-5 rounded-lg bg-[#161b22] border border-[#30363d] space-y-4 text-xs">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#30363d]">
              <div>
                <div className="flex items-center gap-2 font-mono text-[11px] mb-1">
                  <span className="text-emerald-400 font-bold">PR #{selectedPr.number}</span>
                  <span className="text-gray-500">|</span>
                  <span className="text-gray-300">{selectedPr.author_name || selectedPr.author}</span>
                  <span className="text-gray-500">|</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#0d1117] text-gray-400 border border-[#30363d]">
                    {selectedPr.status.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white">
                  {selectedPr.title}
                </h3>
              </div>

              <div className="font-mono text-[11px] bg-[#0d1117] px-3 py-1.5 rounded border border-[#30363d] text-gray-300">
                <code>{selectedPr.source_branch}</code> → <code>{selectedPr.target_branch}</code>
              </div>
            </div>

            <p className="text-gray-300 text-xs leading-relaxed font-sans">
              {selectedPr.description}
            </p>

            {/* Cross-PR Semantic Interactions */}
            <div className="space-y-2 pt-2">
              <div className="font-mono text-gray-400 text-xs font-semibold uppercase flex items-center justify-between">
                <span>CONCURRENT INTEGRATION RISKS FOR PR #{selectedPr.number} ({relatedRisks.length})</span>
              </div>

              {relatedRisks.length > 0 ? (
                <div className="space-y-2.5">
                  {relatedRisks.map((risk) => {
                    const otherBranch = risk.branches.find((b) => b !== selectedPr.source_branch) || risk.branches[1];
                    const otherPr = prs.find((p) => p.source_branch === otherBranch);

                    return (
                      <div
                        key={risk.id}
                        className="p-4 rounded bg-[#0d1117] border border-[#30363d] space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-950/80 text-red-300 border border-red-800">
                              {risk.risk_level}
                            </span>
                            <span className="font-mono text-xs text-gray-300">
                              Collides with {otherPr ? `PR #${otherPr.number} (${otherPr.title})` : `branch ${otherBranch}`}
                            </span>
                          </div>

                          <span className="font-mono text-[11px] text-gray-400">
                            Confidence: {Math.round(risk.confidence * 100)}%
                          </span>
                        </div>

                        <h4 className="text-xs font-semibold text-white">
                          {risk.title}
                        </h4>

                        <p className="text-xs text-gray-400 leading-relaxed font-sans">
                          {risk.summary}
                        </p>

                        <div className="p-2.5 rounded bg-[#161b22] border border-[#30363d] text-[11px] font-mono text-gray-400 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            Target Files: <span className="text-blue-300">{risk.affected_files.join(', ')}</span>
                          </div>

                          <button
                            onClick={() => onOpenResolution(risk.id)}
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                          >
                            <span>Inspect Resolution Plan</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded bg-[#0d1117] border border-[#30363d] text-center text-gray-500 font-mono text-xs">
                  No cross-PR behavioral risks detected for this pull request.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: PR Commits & Test Recommendations */}
        <div className="space-y-4">
          {/* Commits */}
          <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] space-y-3 text-xs font-mono">
            <div className="border-b border-[#30363d] pb-2 font-semibold text-white flex items-center justify-between">
              <span>COMMITS IN THIS PR ({prCommits.length})</span>
              <span className="text-gray-500 text-[10px]">Source: {selectedPr.source_branch}</span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {prCommits.map((c) => (
                <div key={c.sha} className="p-2 rounded bg-[#0d1117] space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-blue-400 font-bold">{c.sha}</span>
                    <span className="text-gray-500 text-[10px]">{c.author}</span>
                  </div>
                  <div className="text-gray-300 text-xs font-sans truncate">
                    "{c.message}"
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Tests for PR */}
          <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] space-y-2.5 text-xs font-mono">
            <div className="border-b border-[#30363d] pb-2 font-semibold text-white flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>TEST VERIFICATION BEFORE MERGE</span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              {relatedRisks[0]?.test_recommendation ? (
                <>
                  <div className="text-gray-400">Tooling: {relatedRisks[0].test_recommendation.tooling_detected}</div>
                  <div className="space-y-1 pt-1">
                    {relatedRisks[0].test_recommendation.test_commands.map((cmd) => (
                      <div key={cmd} className="p-1.5 rounded bg-[#0d1117] border border-[#30363d] text-emerald-400">
                        $ {cmd}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-gray-500 italic">Run repository standard CI suite.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
