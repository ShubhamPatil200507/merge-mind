import React, { useState } from 'react';
import { 
  Search, 
  ArrowRight,
  GitBranch, 
  FileCode,
  CheckCircle2,
  AlertTriangle
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
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [activeRiskId, setActiveRiskId] = useState<string>(selectedRiskId || risks[0]?.id || '');

  const query = searchQuery.trim().toLowerCase();

  const filteredRisks = risks.filter((r) => {
    if (filterSeverity !== 'ALL' && r.risk_level !== filterSeverity) return false;
    if (filterType !== 'ALL' && r.collision_type !== filterType) return false;
    if (query) {
      const matchTitle = r.title.toLowerCase().includes(query);
      const matchSummary = r.summary.toLowerCase().includes(query);
      const matchFiles = r.affected_files.some(f => f.toLowerCase().includes(query));
      if (!matchTitle && !matchSummary && !matchFiles) return false;
    }
    return true;
  });

  const selectedRisk = risks.find(r => r.id === activeRiskId) || filteredRisks[0] || risks[0];

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
      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#929298] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by file name, API route, branch, or issue keyword..."
            className="w-full pl-9 pr-3 py-1.5 rounded-[6px] bg-[#F7F7F5] border border-[#E2E2DE] text-[#18181B] text-xs font-mono focus:outline-none focus:border-[#2563EB] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-[#6B6B70]">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(lvl => (
            <button
              key={lvl}
              onClick={() => setFilterSeverity(lvl)}
              className={`px-2 py-1 rounded-[4px] transition-colors ${
                filterSeverity === lvl
                  ? 'bg-[#18181B] text-white font-medium'
                  : 'bg-[#F1F1EF] text-[#6B6B70] hover:bg-[#E2E2DE]'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Engineering Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Left Column: Finding Index (Table style) */}
        <div className="lg:col-span-5 bg-white border border-[#E2E2DE] rounded-[8px] overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-[#E2E2DE] bg-[#FAFAFA] flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-[#18181B]">FINDINGS ({filteredRisks.length})</span>
            <span className="text-[#929298]">Select finding to inspect</span>
          </div>

          <div className="divide-y divide-[#E2E2DE] max-h-[700px] overflow-y-auto">
            {filteredRisks.map(r => {
              const isSelected = r.id === selectedRisk?.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setActiveRiskId(r.id)}
                  className={`p-3.5 cursor-pointer transition-colors text-xs ${
                    isSelected ? 'bg-[#F1F1EF] border-l-2 border-[#2563EB]' : 'hover:bg-[#F8F8F6]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-1.5 py-0.2 rounded-[4px] border text-[10px] font-mono font-semibold ${getSeverityBadge(r.risk_level)}`}>
                      {r.risk_level}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-[#18181B]">
                      {r.risk_score.total}/100
                    </span>
                  </div>

                  <div className="font-medium text-[#18181B] mt-1 line-clamp-1">
                    {r.title}
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-[#6B6B70]">
                    <span>{r.collision_type}</span>
                    <span>•</span>
                    <span className="truncate">{r.affected_files[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep-Dive Inspection Panel */}
        {selectedRisk && (
          <div className="lg:col-span-7 bg-white border border-[#E2E2DE] rounded-[8px] p-5 space-y-5">
            {/* Finding Header */}
            <div className="border-b border-[#E2E2DE] pb-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-[4px] border text-xs font-mono font-semibold ${getSeverityBadge(selectedRisk.risk_level)}`}>
                    {selectedRisk.risk_level}
                  </span>
                  <span className="font-mono text-xs text-[#6B6B70] px-2 py-0.5 rounded bg-[#F1F1EF]">
                    {selectedRisk.collision_type}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-[#6B6B70]">Risk Score: </span>
                  <span className="text-sm font-mono font-bold text-[#18181B]">{selectedRisk.risk_score.total}/100</span>
                </div>
              </div>

              <h2 className="text-base font-semibold text-[#18181B] tracking-tight">
                {selectedRisk.title}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#6B6B70]">
                <span>Branches: <strong className="text-[#18181B]">{selectedRisk.branches.join(' ↔ ')}</strong></span>
                <span>•</span>
                <span>Files: <strong className="text-[#18181B]">{selectedRisk.affected_files.join(', ')}</strong></span>
              </div>
            </div>

            {/* Why It Exists & Technical Summary */}
            <div className="space-y-3 text-xs leading-relaxed">
              <div>
                <h3 className="font-mono font-semibold uppercase text-[11px] text-[#6B6B70] mb-1">
                  Root Cause & Semantic Overlap
                </h3>
                <p className="text-[#18181B] bg-[#F7F7F5] border border-[#E2E2DE] rounded-[6px] p-3">
                  {selectedRisk.why_it_exists}
                </p>
              </div>

              <div>
                <h3 className="font-mono font-semibold uppercase text-[11px] text-[#6B6B70] mb-1">
                  Potential Runtime Impact
                </h3>
                <p className="text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-[6px] p-3">
                  {selectedRisk.potential_impact}
                </p>
              </div>
            </div>

            {/* Evidence Diff Presentation */}
            <div className="space-y-2">
              <h3 className="font-mono font-semibold uppercase text-[11px] text-[#6B6B70]">
                Code Evidence & Commit Hunks
              </h3>
              <div className="space-y-2">
                {selectedRisk.evidence.map((ev, idx) => (
                  <div key={idx} className="border border-[#E2E2DE] rounded-[6px] overflow-hidden text-xs">
                    <div className="bg-[#F1F1EF] px-3 py-1.5 border-b border-[#E2E2DE] flex items-center justify-between font-mono text-[11px] text-[#6B6B70]">
                      <span>{ev.branch} • commit <code className="text-[#18181B]">{ev.commit_sha}</code></span>
                      <span>{ev.author}</span>
                    </div>
                    <div className="p-2.5 font-mono text-[11px] bg-[#18181B] text-[#E2E2DE] overflow-x-auto">
                      <pre><code>{ev.snippet_or_symbol}</code></pre>
                    </div>
                    <div className="px-3 py-1.5 bg-[#FAFAFA] text-[11px] text-[#6B6B70] border-t border-[#E2E2DE]">
                      {ev.observation}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="border-t border-[#E2E2DE] pt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onReviewRisk(selectedRisk.id, 'REVIEWED')}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium border transition-colors ${
                    selectedRisk.review_status === 'REVIEWED'
                      ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                      : 'bg-white border-[#D9D9D4] text-[#27272A] hover:bg-[#F1F1EF]'
                  }`}
                >
                  {selectedRisk.review_status === 'REVIEWED' ? '✓ Marked Reviewed' : 'Mark Reviewed'}
                </button>
                <button
                  onClick={() => onReviewRisk(selectedRisk.id, 'DISMISSED')}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium border transition-colors ${
                    selectedRisk.review_status === 'DISMISSED'
                      ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                      : 'bg-white border-[#D9D9D4] text-[#27272A] hover:bg-[#F1F1EF]'
                  }`}
                >
                  Dismiss
                </button>
              </div>

              <button
                onClick={() => onOpenResolution(selectedRisk.id)}
                className="px-3.5 py-1.5 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <span>View Reconciliation Patch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
