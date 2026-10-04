import React from 'react';
import { 
  X, 
  ShieldAlert, 
  GitBranch, 
  FileCode, 
  Check, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle,
  GitCommit
} from 'lucide-react';
import { IntegrationRisk, ReviewStatus } from '../types';

interface RiskDetailModalProps {
  risk: IntegrationRisk | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewRisk: (riskId: string, status: ReviewStatus, notes?: string) => void;
  onOpenResolution: (riskId: string) => void;
}

export const RiskDetailModal: React.FC<RiskDetailModalProps> = ({
  risk,
  isOpen,
  onClose,
  onReviewRisk,
  onOpenResolution
}) => {
  if (!isOpen || !risk) return null;

  const isCrit = risk.risk_level === 'CRITICAL';
  const isHigh = risk.risk_level === 'HIGH';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-xl bg-[#161b22] border border-[#30363d] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
          <div className="flex items-center gap-2.5">
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border flex items-center gap-1.5 ${
              isCrit
                ? 'bg-red-950/80 text-red-300 border-red-800'
                : isHigh
                ? 'bg-orange-950/80 text-orange-300 border-orange-800'
                : 'bg-amber-950/70 text-amber-300 border-amber-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isCrit ? 'bg-red-500' : 'bg-orange-500'}`} />
              {risk.risk_level} RISK
            </span>
            <span className="font-mono text-xs text-gray-400">Score: {risk.risk_score.total}/100</span>
            <span className="text-gray-600">|</span>
            <span className="font-mono text-xs text-blue-400">{risk.collision_type}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* Title & Branches */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs text-gray-400">
              <GitBranch className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-white font-medium">{risk.branches[0]}</span>
              <span className="text-gray-600">↔</span>
              <span className="text-white font-medium">{risk.branches[1]}</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {risk.title}
            </h2>
          </div>

          {/* Problem Statement */}
          <div className="p-4 rounded bg-[#0d1117] border border-[#30363d] space-y-1">
            <div className="font-mono text-[10px] uppercase text-red-400 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Problem Statement</span>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed font-sans">
              {risk.summary}
            </p>
          </div>

          {/* Why it Matters / Potential Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
            <div className="p-3.5 rounded bg-[#0d1117] border border-[#30363d] space-y-1">
              <div className="text-gray-500 text-[10px] uppercase">WHY THIS RISK EXISTS</div>
              <p className="text-gray-300 font-sans text-xs leading-relaxed">
                {risk.why_it_exists}
              </p>
            </div>

            <div className="p-3.5 rounded bg-[#0d1117] border border-[#30363d] space-y-1">
              <div className="text-gray-500 text-[10px] uppercase">POTENTIAL PRODUCTION IMPACT</div>
              <p className="text-red-300/90 font-sans text-xs leading-relaxed">
                {risk.potential_impact}
              </p>
            </div>
          </div>

          {/* Affected Files & Components */}
          <div className="space-y-2">
            <div className="font-mono text-gray-400 text-xs uppercase font-semibold">
              AFFECTED FILES & COMPONENTS
            </div>
            <div className="flex flex-wrap gap-1.5 font-mono">
              {risk.affected_files.map((f) => (
                <span key={f} className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-blue-300 text-xs">
                  {f}
                </span>
              ))}
              {risk.affected_components.map((c) => (
                <span key={c} className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-gray-400 text-xs">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Evidence from Commits & Diff Highlights */}
          <div className="space-y-3">
            <div className="font-mono text-gray-400 text-xs uppercase font-semibold">
              REPOSITORY CODE EVIDENCE ({risk.evidence.length} OBSERVATIONS)
            </div>

            <div className="space-y-3">
              {risk.evidence.map((ev, idx) => (
                <div key={idx} className="p-4 rounded bg-[#0d1117] border border-[#30363d] space-y-2 font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-400 font-bold">{ev.commit_sha}</span>
                    <span className="text-gray-500">{ev.branch} • {ev.author}</span>
                  </div>
                  <div className="text-gray-200 text-xs font-sans">
                    "{ev.commit_message}"
                  </div>
                  <div className="p-3 rounded bg-[#161b22] border border-[#30363d] text-emerald-400 text-xs overflow-x-auto">
                    <code>{ev.snippet_or_symbol}</code>
                  </div>
                  <div className="text-gray-400 text-xs font-sans">
                    Observation: {ev.observation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transparent Score Breakdown */}
          <div className="p-4 rounded bg-[#0d1117] border border-[#30363d] space-y-2 font-mono">
            <div className="flex justify-between text-xs font-semibold text-gray-300">
              <span>TRANSPARENT RISK SCORE: {risk.risk_score.total} / 100</span>
              <span className="text-gray-500">{risk.risk_level} SEVERITY</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
              <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
                <div className="text-gray-500">Overlap</div>
                <div className="text-white font-bold">{risk.risk_score.code_overlap}/30</div>
              </div>
              <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
                <div className="text-gray-500">Dependency</div>
                <div className="text-white font-bold">{risk.risk_score.dependency_interaction}/20</div>
              </div>
              <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
                <div className="text-gray-500">API Impact</div>
                <div className="text-white font-bold">{risk.risk_score.api_impact}/20</div>
              </div>
              <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
                <div className="text-gray-500">Security</div>
                <div className="text-white font-bold">{risk.risk_score.security_impact}/20</div>
              </div>
              <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
                <div className="text-gray-500">Test Uncert.</div>
                <div className="text-white font-bold">{risk.risk_score.test_coverage_uncertainty}/10</div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#30363d] bg-[#0d1117] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onOpenResolution(risk.id);
                onClose();
              }}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
            >
              Open Resolution Plan & Patch
            </button>
          </div>

          <div className="flex items-center gap-2">
            {risk.review_status !== 'REVIEWED' && (
              <button
                onClick={() => onReviewRisk(risk.id, 'REVIEWED', 'Verified in detail inspection')}
                className="px-3 py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-800 transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Sign Off & Mark Reviewed
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] text-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
