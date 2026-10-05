import React from 'react';
import { 
  GitBranch, 
  GitPullRequest, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { RepositoryAnalysis } from '../types';

interface OverviewTabProps {
  analysis: RepositoryAnalysis;
  onSelectRisk: (riskId: string) => void;
  onGoToComparison: () => void;
  onGoToPrAnalysis?: () => void;
  onGoToPipeline?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  analysis,
  onSelectRisk,
  onGoToComparison,
  onGoToPrAnalysis,
  onGoToPipeline
}) => {
  const topRisk = analysis.detected_risks[0];

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
      {/* Header Context Banner */}
      <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono text-[#6B6B70]">
              <span>REPOSITORY</span>
              <span>/</span>
              <span className="text-[#18181B] font-semibold">{analysis.repository_name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#18181B] tracking-tight">
              Integration & Risk Summary
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6B70] leading-relaxed">
              Synthesizes parallel branches, pull requests, and commit diffs to surface runtime behavior collisions, API contract mismatches, and execution order shifts.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {topRisk && (
              <button
                onClick={() => onSelectRisk(topRisk.id)}
                className="px-3 py-1.5 rounded-[6px] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <span>Inspect Priority Risk ({topRisk.risk_level})</span>
              </button>
            )}
            <button
              onClick={onGoToComparison}
              className="px-3 py-1.5 rounded-[6px] bg-white hover:bg-[#F1F1EF] border border-[#D9D9D4] text-[#27272A] text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <span>Compare Branches</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-3.5">
          <div className="text-[11px] font-mono text-[#6B6B70] flex items-center justify-between">
            <span>Critical & High</span>
            <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#18181B] mt-1">
            {(analysis.risk_summary.CRITICAL || 0) + (analysis.risk_summary.HIGH || 0)}
          </div>
          <div className="text-[11px] text-[#929298] mt-0.5">Contract & runtime bypasses</div>
        </div>

        <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-3.5">
          <div className="text-[11px] font-mono text-[#6B6B70] flex items-center justify-between">
            <span>Medium & Low</span>
            <span className="w-2 h-2 rounded-full bg-[#CA8A04]"></span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#18181B] mt-1">
            {(analysis.risk_summary.MEDIUM || 0) + (analysis.risk_summary.LOW || 0)}
          </div>
          <div className="text-[11px] text-[#929298] mt-0.5">Manifest or schema overlap</div>
        </div>

        <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-3.5">
          <div className="text-[11px] font-mono text-[#6B6B70] flex items-center justify-between">
            <span>Monitored PRs</span>
            <GitPullRequest className="w-3.5 h-3.5 text-[#6B6B70]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#18181B] mt-1">
            {analysis.pull_requests.length}
          </div>
          <div className="text-[11px] text-[#929298] mt-0.5">Active parallel branches</div>
        </div>

        <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-3.5">
          <div className="text-[11px] font-mono text-[#6B6B70] flex items-center justify-between">
            <span>Human Review</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#18181B] mt-1">
            {analysis.detected_risks.filter(r => r.review_status === 'REVIEWED').length} / {analysis.detected_risks.length}
          </div>
          <div className="text-[11px] text-[#929298] mt-0.5">Signoffs recorded</div>
        </div>
      </div>

      {/* Main Table: Identified Risks (Engineering table design) */}
      <div className="bg-white border border-[#E2E2DE] rounded-[8px] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E2E2DE] flex items-center justify-between bg-[#FAFAFA]">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#18181B]">
            Detected Integration Risks ({analysis.detected_risks.length})
          </h2>
          <span className="text-[11px] font-mono text-[#929298]">Ordered by risk score</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F1F1EF] border-b border-[#E2E2DE] font-mono text-[11px] text-[#6B6B70]">
              <tr>
                <th className="py-2.5 px-4 font-medium">Severity</th>
                <th className="py-2.5 px-4 font-medium">Collision Type</th>
                <th className="py-2.5 px-4 font-medium">Title & Scope</th>
                <th className="py-2.5 px-4 font-medium">Branches</th>
                <th className="py-2.5 px-4 font-medium">Score</th>
                <th className="py-2.5 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E2DE]">
              {analysis.detected_risks.map((risk) => (
                <tr 
                  key={risk.id}
                  onClick={() => onSelectRisk(risk.id)}
                  className="hover:bg-[#F8F8F6] cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] border text-[10px] font-mono font-semibold ${getSeverityBadge(risk.risk_level)}`}>
                      {risk.risk_level}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-[#6B6B70] whitespace-nowrap">
                    {risk.collision_type}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-[#18181B] group-hover:text-[#2563EB] transition-colors">
                      {risk.title}
                    </div>
                    <div className="text-[11px] text-[#6B6B70] mt-0.5 line-clamp-1 font-mono">
                      {risk.affected_files.join(', ')}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#6B6B70] whitespace-nowrap">
                    {risk.branches.join(' ↔ ')}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-[#18181B] whitespace-nowrap">
                    {risk.risk_score.total}/100
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className="text-[#2563EB] font-medium text-xs inline-flex items-center gap-1 group-hover:underline">
                      Inspect
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pull Requests & Pipelines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monitored Pull Requests */}
        <div className="bg-white border border-[#E2E2DE] rounded-[8px] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E2DE] flex items-center justify-between bg-[#FAFAFA]">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#18181B]">
              Monitored Pull Requests
            </h2>
            {onGoToPrAnalysis && (
              <button 
                onClick={onGoToPrAnalysis}
                className="text-[11px] font-mono text-[#2563EB] hover:underline"
              >
                View matrix →
              </button>
            )}
          </div>
          <div className="divide-y divide-[#E2E2DE]">
            {analysis.pull_requests.map((pr) => (
              <div key={pr.id} className="p-3.5 hover:bg-[#F8F8F6] transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-[#2563EB] font-medium">#{pr.number}</span>
                    <span className="text-[#18181B] font-medium truncate">{pr.title}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
                    {pr.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#6B6B70] font-mono">
                  <span>{pr.source_branch} → {pr.target_branch}</span>
                  <span>•</span>
                  <span>+{pr.additions} -{pr.deletions}</span>
                  <span>•</span>
                  <span>{pr.changed_files_count} files</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Execution Details */}
        <div className="bg-white border border-[#E2E2DE] rounded-[8px] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E2DE] flex items-center justify-between bg-[#FAFAFA]">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#18181B]">
              Analysis Pipeline Trace
            </h2>
            {onGoToPipeline && (
              <button 
                onClick={onGoToPipeline}
                className="text-[11px] font-mono text-[#2563EB] hover:underline"
              >
                View pipeline →
              </button>
            )}
          </div>
          <div className="p-3.5 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-[#6B6B70] py-1 border-b border-[#F1F1EF]">
              <span className="flex items-center gap-1.5 text-[#18181B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                1. AST & Normalized Code Parser
              </span>
              <span>0.18s</span>
            </div>
            <div className="flex items-center justify-between text-[#6B6B70] py-1 border-b border-[#F1F1EF]">
              <span className="flex items-center gap-1.5 text-[#18181B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                2. Commit Understanding & Intent Extraction
              </span>
              <span>0.24s</span>
            </div>
            <div className="flex items-center justify-between text-[#6B6B70] py-1 border-b border-[#F1F1EF]">
              <span className="flex items-center gap-1.5 text-[#18181B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                3. Cross-Branch Change Graph Mapping
              </span>
              <span>0.31s</span>
            </div>
            <div className="flex items-center justify-between text-[#6B6B70] py-1 border-b border-[#F1F1EF]">
              <span className="flex items-center gap-1.5 text-[#18181B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                4. Collision Detection (12 Categories)
              </span>
              <span>0.42s</span>
            </div>
            <div className="flex items-center justify-between text-[#6B6B70] py-1">
              <span className="flex items-center gap-1.5 text-[#18181B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                5. Reconciliation Patch Synthesizer
              </span>
              <span>0.28s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
