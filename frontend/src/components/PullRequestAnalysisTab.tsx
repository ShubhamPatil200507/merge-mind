import React, { useState } from 'react';
import { 
  GitPullRequest, 
  GitBranch, 
  CheckCircle2, 
  ArrowRight, 
  GitCommit
} from 'lucide-react';
import { RepositoryAnalysis } from '../types';

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
      <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-8 text-center text-xs font-mono text-[#6B6B70]">
        No active pull requests identified in repository.
      </div>
    );
  }

  const selectedPr = prs.find((p) => p.number === selectedPrId) || prs[0];

  // Find risks related to this PR
  const relatedRisks = analysis.detected_risks.filter((r) =>
    r.branches.includes(selectedPr.source_branch) ||
    r.branches.includes(selectedPr.target_branch)
  );

  const getSeverityBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]';
      case 'HIGH':
        return 'bg-[#FFF7ED] border-[#FFEDD5] text-[#9A3412]';
      case 'MEDIUM':
        return 'bg-[#FEFCE8] border-[#FEF08A] text-[#854D0E]';
      default:
        return 'bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Context */}
      <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <h1 className="text-base font-semibold text-[#18181B] tracking-tight">
            Pull Request Semantic Compatibility Matrix
          </h1>
          <p className="text-xs text-[#6B6B70] mt-0.5">
            Evaluates whether parallel pull requests can merge into <code className="font-mono">{selectedPr.target_branch}</code> without breaking API contracts or middleware execution order.
          </p>
        </div>
        <div className="font-mono text-xs text-[#6B6B70]">
          {prs.length} pull requests tracked
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: PR List */}
        <div className="lg:col-span-4 bg-white border border-[#E2E2DE] rounded-[8px] overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-[#E2E2DE] bg-[#FAFAFA] font-mono text-xs font-semibold text-[#18181B]">
            PULL REQUESTS
          </div>
          <div className="divide-y divide-[#E2E2DE]">
            {prs.map((p) => {
              const isSelected = p.number === selectedPr.number;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPrId(p.number)}
                  className={`p-3.5 cursor-pointer text-xs transition-colors ${
                    isSelected ? 'bg-[#F1F1EF] border-l-2 border-[#2563EB]' : 'hover:bg-[#F8F8F6]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-medium text-[#2563EB]">#{p.number}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[4px] bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
                      {p.status}
                    </span>
                  </div>
                  <div className="font-medium text-[#18181B] mt-1 line-clamp-1">
                    {p.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 font-mono text-[11px] text-[#6B6B70]">
                    <span>{p.source_branch}</span>
                    <span>→</span>
                    <span>{p.target_branch}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected PR Evaluation */}
        <div className="lg:col-span-8 bg-white border border-[#E2E2DE] rounded-[8px] p-5 space-y-5">
          {/* PR Details */}
          <div className="border-b border-[#E2E2DE] pb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#2563EB] font-semibold">PR #{selectedPr.number}</span>
              <span className="text-xs font-mono text-[#6B6B70]">Author: {selectedPr.author_name || selectedPr.author}</span>
            </div>
            <h2 className="text-base font-semibold text-[#18181B]">
              {selectedPr.title}
            </h2>
            <p className="text-xs text-[#6B6B70] leading-relaxed">
              {selectedPr.description}
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-[#6B6B70] pt-1">
              <span>Branch: <strong className="text-[#18181B]">{selectedPr.source_branch}</strong></span>
              <span>Diff: <span className="text-[#16803C]">+{selectedPr.additions}</span> <span className="text-[#DC2626]">-{selectedPr.deletions}</span></span>
              <span>Files: {selectedPr.changed_files_count}</span>
            </div>
          </div>

          {/* Related Risks Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-mono font-semibold uppercase text-xs text-[#18181B]">
                Cross-Branch Risks Identified with this PR ({relatedRisks.length})
              </h3>
            </div>

            {relatedRisks.length === 0 ? (
              <div className="p-4 rounded-[6px] bg-[#F0FDF4] border border-[#DCFCE7] text-xs text-[#166534] font-mono">
                ✓ No cross-branch collisions detected for this pull request.
              </div>
            ) : (
              <div className="border border-[#E2E2DE] rounded-[6px] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F1F1EF] border-b border-[#E2E2DE] font-mono text-[11px] text-[#6B6B70]">
                    <tr>
                      <th className="py-2 px-3 font-medium">Severity</th>
                      <th className="py-2 px-3 font-medium">Type</th>
                      <th className="py-2 px-3 font-medium">Collision Summary</th>
                      <th className="py-2 px-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E2DE]">
                    {relatedRisks.map((r) => (
                      <tr key={r.id} className="hover:bg-[#F8F8F6]">
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex px-1.5 py-0.2 rounded-[4px] border text-[10px] font-mono font-semibold ${getSeverityBadge(r.risk_level)}`}>
                            {r.risk_level}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#6B6B70] whitespace-nowrap">
                          {r.collision_type}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-[#18181B]">{r.title}</div>
                          <div className="text-[11px] text-[#6B6B70] line-clamp-1">{r.summary}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => onSelectRisk(r.id)}
                            className="text-[#2563EB] hover:underline font-mono text-xs"
                          >
                            Inspect →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
