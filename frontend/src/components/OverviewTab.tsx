import React, { useState } from 'react';
import { 
  ShieldAlert, 
  GitBranch, 
  GitPullRequest, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Terminal,
  FileCode,
  Users,
  Cpu,
  Clock,
  ChevronDown,
  ChevronUp
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
  const [isTraceExpanded, setIsTraceExpanded] = useState<boolean>(true);
  const topRisk = analysis.detected_risks[0];

  return (
    <div className="space-y-5">
      {/* Technical Summary Header */}
      <div className="rounded-xl bg-[#161b22] border border-[#30363d] p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-gray-300 border border-[#30363d]">
                REPOSITORY ADVISORY SUMMARY
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {analysis.repository_name}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              Cross-Branch Integration & Semantic Risk Analysis
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Standard Git conflict detection checks textual line overlaps. MergeMind evaluates runtime execution order, API contracts, dependency graphs, and schema shifts across active parallel work.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {topRisk && (
              <button
                onClick={() => onSelectRisk(topRisk.id)}
                className="px-3.5 py-2 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Inspect Priority Risk ({topRisk.risk_level})</span>
              </button>
            )}
            <button
              onClick={onGoToComparison}
              className="px-3 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-gray-200 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <GitBranch className="w-3.5 h-3.5 text-blue-400" />
              <span>Compare Branches</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards (High information density, clean typography) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-[#161b22] border border-[#30363d]">
          <div className="text-[11px] text-gray-400 font-mono flex items-center justify-between">
            <span>Critical & High</span>
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {(analysis.risk_summary.CRITICAL || 0) + (analysis.risk_summary.HIGH || 0)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Bypass or contract break</div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#161b22] border border-[#30363d]">
          <div className="text-[11px] text-gray-400 font-mono flex items-center justify-between">
            <span>Medium & Low</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {(analysis.risk_summary.MEDIUM || 0) + (analysis.risk_summary.LOW || 0)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Manifest or schema overlap</div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#161b22] border border-[#30363d]">
          <div className="text-[11px] text-gray-400 font-mono flex items-center justify-between">
            <span>Monitored PRs</span>
            <GitPullRequest className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {analysis.pull_requests.length}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Active parallel pull requests</div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#161b22] border border-[#30363d]">
          <div className="text-[11px] text-gray-400 font-mono flex items-center justify-between">
            <span>Developer Review</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {analysis.detected_risks.filter(r => r.review_status === 'REVIEWED').length} / {analysis.detected_risks.length}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Human signoffs completed</div>
        </div>
      </div>

      {/* Main Split: Detected Risks List & Pull Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left 2 Cols: Detected Risks */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-400">
              Identified Integration Risks ({analysis.detected_risks.length})
            </h3>
            <span className="text-[11px] text-gray-500 font-mono">Ranked by risk score</span>
          </div>

          <div className="space-y-2.5">
            {analysis.detected_risks.map((risk) => {
              const isCrit = risk.risk_level === 'CRITICAL';
              const isHigh = risk.risk_level === 'HIGH';

              return (
                <div
                  key={risk.id}
                  onClick={() => onSelectRisk(risk.id)}
                  className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] hover:border-blue-500/60 transition-colors cursor-pointer group"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                        isCrit
                          ? 'bg-red-950/70 text-red-300 border-red-800'
                          : isHigh
                          ? 'bg-orange-950/70 text-orange-300 border-orange-800'
                          : 'bg-amber-950/60 text-amber-300 border-amber-800'
                      }`}>
                        {risk.risk_level} • Score {risk.risk_score.total}/100
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#21262d] text-gray-300 border border-[#30363d]">
                        {risk.collision_type}
                      </span>

                      {risk.review_status === 'REVIEWED' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                          REVIEWED
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] font-mono text-gray-400">
                      <span>{risk.branches[0]}</span>
                      <span className="mx-1.5 text-gray-600">↔</span>
                      <span>{risk.branches[1]}</span>
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-gray-100 group-hover:text-blue-400 transition-colors">
                    {risk.title}
                  </h4>

                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    {risk.summary}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-[#30363d]/50 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                    <div className="truncate pr-2">
                      Files: <span className="text-gray-300">{risk.affected_files.join(', ')}</span>
                    </div>
                    <span className="text-blue-400 shrink-0 inline-flex items-center gap-1">
                      Details <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Pull Requests */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-400">
              Parallel Pull Requests ({analysis.pull_requests.length})
            </h3>
            {onGoToPrAnalysis && (
              <button
                onClick={onGoToPrAnalysis}
                className="text-[11px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <span>Matrix</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {analysis.pull_requests.map((pr) => (
              <div
                key={pr.id}
                className="p-3.5 rounded-lg bg-[#161b22] border border-[#30363d] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-blue-400 font-semibold">#{pr.number}</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#21262d] text-gray-300 text-[10px] font-mono">
                    {pr.status.toUpperCase()}
                  </span>
                </div>

                <div className="font-medium text-gray-200 text-xs">
                  {pr.title}
                </div>

                <div className="text-[11px] text-gray-400 font-mono">
                  <span>{pr.author_name || pr.author}</span>: <code>{pr.source_branch}</code> → <code>{pr.target_branch}</code>
                </div>

                <div className="pt-2 border-t border-[#30363d]/40 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                  <span>+{pr.additions} / -{pr.deletions} lines</span>
                  <span>{pr.changed_files_count} files</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] text-xs text-gray-400 space-y-2">
            <div className="text-gray-300 font-mono font-medium text-[11px]">Integration Note</div>
            <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
              Pull requests #101 and #102 concurrently modify request routing logic in <code>server.js</code>. Both are syntactically clean in isolation, but merging #102 first silently bypasses #101's auth guard.
            </p>
            {onGoToPrAnalysis && (
              <button
                onClick={onGoToPrAnalysis}
                className="w-full mt-1 py-1.5 px-2 rounded bg-[#21262d] hover:bg-[#30363d] text-gray-200 font-mono text-xs border border-[#30363d] transition-colors flex items-center justify-center gap-1.5"
              >
                <GitPullRequest className="w-3.5 h-3.5 text-blue-400" />
                <span>Deep PR Semantic Analysis</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Agent Execution Pipeline Trace (Section 12, 13, 32 requirement) */}
      {analysis.agent_trace && analysis.agent_trace.length > 0 && (
        <div className="rounded-xl bg-[#161b22] border border-[#30363d] overflow-hidden">
          <div className="p-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
                Multi-Agent Pipeline Execution Trace ({analysis.agent_trace.length} Checkpoints)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                100% COMPLETE
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onGoToPipeline && (
                <button
                  onClick={onGoToPipeline}
                  className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-gray-300 text-xs font-mono border border-[#30363d] transition-colors flex items-center gap-1"
                >
                  <span>DAG Graph</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => setIsTraceExpanded(!isTraceExpanded)}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors"
              >
                {isTraceExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isTraceExpanded && (
            <div className="divide-y divide-[#30363d]/60">
              <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-mono text-gray-500 uppercase tracking-wider bg-[#161b22]">
                <div className="col-span-1">Step</div>
                <div className="col-span-3">Agent</div>
                <div className="col-span-3">Action</div>
                <div className="col-span-1">Duration</div>
                <div className="col-span-4">Runtime Output</div>
              </div>

              {analysis.agent_trace.map((step) => (
                <div
                  key={step.step_number}
                  className="grid grid-cols-12 px-4 py-2.5 text-xs font-mono items-center hover:bg-[#21262d]/40 transition-colors"
                >
                  <div className="col-span-1 text-gray-500">
                    #{step.step_number}
                  </div>
                  <div className="col-span-3 text-white font-medium flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                    <span className="truncate">{step.agent_name}</span>
                  </div>
                  <div className="col-span-3 text-gray-400 truncate pr-2">
                    {step.action}
                  </div>
                  <div className="col-span-1 text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-600" />
                    <span>{step.duration_ms}ms</span>
                  </div>
                  <div className="col-span-4 text-gray-300 truncate">
                    {step.output_summary}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
