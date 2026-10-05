import React from 'react';
import { 
  GitBranch, 
  ArrowRight, 
  FolderGit2, 
  Play,
  FileCode,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';

interface LandingPageProps {
  onAnalyzeRepo: () => void;
  onTryDemo: () => void;
  onGoToDashboard: () => void;
  hasLoadedRepo: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onAnalyzeRepo,
  onTryDemo,
  onGoToDashboard,
  hasLoadedRepo
}) => {
  return (
    <div className="space-y-8 py-4 max-w-4xl mx-auto text-xs">
      {/* Product Header */}
      <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-6 sm:p-8 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#F1F1EF] border border-[#E2E2DE] font-mono text-[11px] text-[#18181B]">
          <GitBranch className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>MergeMind Integration Advisor</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#18181B] leading-tight">
          Detect runtime collisions & API contract breaks across parallel Git branches.
        </h1>

        <p className="text-sm text-[#6B6B70] leading-relaxed max-w-2xl">
          Standard Git merge conflict detection only checks line-by-line textual overlaps. MergeMind evaluates concurrent branches to surface runtime execution reordering, breaking API contract changes, and dependency divergence before merges occur.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            onClick={onAnalyzeRepo}
            className="px-4 py-2 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs transition-colors flex items-center gap-1.5"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Connect Repository</span>
          </button>

          <button
            onClick={onTryDemo}
            className="px-4 py-2 rounded-[6px] bg-white hover:bg-[#F1F1EF] text-[#27272A] border border-[#D9D9D4] font-medium text-xs transition-colors flex items-center gap-1.5"
          >
            <Play className="w-3 h-3 text-[#2563EB] fill-[#2563EB]" />
            <span>Explore Demo (nexus-api)</span>
          </button>

          {hasLoadedRepo && (
            <button
              onClick={onGoToDashboard}
              className="px-4 py-2 rounded-[6px] bg-[#F1F1EF] hover:bg-[#E2E2DE] text-[#18181B] font-medium text-xs transition-colors flex items-center gap-1.5"
            >
              <span>Active Overview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Engineering Architectural Matrix */}
      <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-5 space-y-4">
        <div className="font-mono text-xs font-semibold uppercase text-[#18181B] border-b border-[#E2E2DE] pb-2">
          CONCURRENT BRANCH RESOLUTION FLOW
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 bg-[#F7F7F5] border border-[#E2E2DE] rounded-[6px] space-y-1">
            <div className="font-semibold text-[#2563EB]">Branch A: feature/auth</div>
            <div className="text-[11px] text-[#6B6B70]">Adds JWT security middleware on /v1</div>
          </div>

          <div className="p-3 bg-[#F7F7F5] border border-[#E2E2DE] rounded-[6px] space-y-1">
            <div className="font-semibold text-[#854D0E]">Branch B: feature/api-refactor</div>
            <div className="text-[11px] text-[#6B6B70]">Restructures express stream dispatcher</div>
          </div>

          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[6px] space-y-1">
            <div className="font-semibold text-[#991B1B]">Merge Collision Detected</div>
            <div className="text-[11px] text-[#991B1B]">B passes textually, but bypasses A's auth guard</div>
          </div>
        </div>

        <p className="text-[#6B6B70] text-xs leading-relaxed">
          Standard Git reports zero conflict markers. MergeMind outputs a concrete, unified diff patch (compatible with <code className="font-mono text-[#18181B]">git apply</code>) that reconciles the middleware pipeline order.
        </p>
      </div>

      {/* Value Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-4 space-y-1.5">
          <div className="font-mono font-semibold text-xs text-[#18181B]">
            Contract Breaking Changes
          </div>
          <p className="text-[#6B6B70] text-xs leading-relaxed">
            Flags schema, key naming, and payload type mismatches between producers and downstream consumers.
          </p>
        </div>

        <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-4 space-y-1.5">
          <div className="font-mono font-semibold text-xs text-[#18181B]">
            Reconciliation Patches
          </div>
          <p className="text-[#6B6B70] text-xs leading-relaxed">
            Synthesizes concrete source diffs with compatibility adapters rather than abstract recommendations.
          </p>
        </div>

        <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-4 space-y-1.5">
          <div className="font-mono font-semibold text-xs text-[#18181B]">
            Human Review Controls
          </div>
          <p className="text-[#6B6B70] text-xs leading-relaxed">
            Zero autonomous commits or automatic mutations. Developers inspect, test, and approve all changes.
          </p>
        </div>
      </div>
    </div>
  );
};
