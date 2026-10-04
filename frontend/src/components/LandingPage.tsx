import React from 'react';
import { 
  GitBranch, 
  ShieldAlert, 
  ArrowRight, 
  Terminal, 
  CheckCircle2, 
  GitCommit, 
  FolderGit2, 
  Layers, 
  Code2,
  Play
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
    <div className="space-y-12 py-6 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161b22] border border-[#30363d] text-xs font-mono text-gray-300">
          <GitBranch className="w-3.5 h-3.5 text-blue-400" />
          <span>MergeMind — AI GitHub Integration Advisor</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-mono leading-tight">
          Detect hidden integration risks before they become bugs.
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-gray-400 leading-relaxed font-sans">
          Git tells developers when code conflicts textually. MergeMind analyzes parallel branches, pull requests, and commit diffs to detect when code conflicts in <strong>runtime behavior, security flow, and API contracts</strong>.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            onClick={onAnalyzeRepo}
            className="px-5 py-2.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white font-medium text-xs font-mono transition-colors flex items-center gap-2 shadow-sm"
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Analyze a Repository</span>
          </button>

          <button
            onClick={onTryDemo}
            className="px-5 py-2.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-[#30363d] font-medium text-xs font-mono transition-colors flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
            <span>Try Demo (nexus-api)</span>
          </button>

          {hasLoadedRepo && (
            <button
              onClick={onGoToDashboard}
              className="px-5 py-2.5 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-blue-400 border border-blue-900/60 font-medium text-xs font-mono transition-colors flex items-center gap-2"
            >
              <span>View Active Repository</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Visual Architectural Flow (Section 4 requirement) */}
      <div className="p-6 rounded-xl bg-[#161b22] border border-[#30363d] space-y-4">
        <div className="text-center">
          <div className="text-xs font-mono text-gray-500 uppercase tracking-wider">
            HOW MERGEMIND PROTECTS CONCURRENT DEVELOPMENT
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center font-mono text-xs text-center">
          {/* Node 1: Dev A */}
          <div className="p-4 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1">
            <div className="text-blue-400 font-bold">Developer A</div>
            <div className="text-gray-400 text-[11px]">feature/auth</div>
            <div className="text-gray-500 text-[10px]">Adds JWT middleware</div>
          </div>

          <div className="hidden md:flex justify-center text-gray-600 font-bold">→</div>

          {/* Node 2: MergeMind Engine */}
          <div className="p-5 rounded-lg bg-[#161b22] border-2 border-blue-500/60 space-y-2 shadow-lg">
            <div className="text-white font-bold font-mono text-sm">MergeMind</div>
            <div className="text-[11px] text-gray-300">Behavioral Collision Detection</div>
            <div className="pt-1 flex justify-center gap-1">
              <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 text-[10px] font-bold">Risk Detection</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold">Resolution Plan</span>
            </div>
          </div>

          <div className="hidden md:flex justify-center text-gray-600 font-bold">←</div>

          {/* Node 3: Dev B */}
          <div className="p-4 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1">
            <div className="text-purple-400 font-bold">Developer B</div>
            <div className="text-gray-400 text-[11px]">feature/api-refactor</div>
            <div className="text-gray-500 text-[10px]">Refactors request stream</div>
          </div>
        </div>

        <div className="p-3 rounded bg-[#0d1117] border border-[#30363d] text-center text-xs text-gray-400 font-sans">
          Conventional Git sees no textual merge conflict. MergeMind detects that Developer B's refactor inadvertently bypasses Developer A's security middleware and outputs a concrete reconciliation patch.
        </div>
      </div>

      {/* Core Value Capabilities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
        <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>Semantic Risk Detection</span>
          </div>
          <p className="text-gray-400 font-sans text-xs leading-relaxed">
            Identifies API contract mismatches, execution reordering, schema breaking changes, and version collisions across parallel branches.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-bold">
            <Code2 className="w-4 h-4" />
            <span>Code Reconciliation Patches</span>
          </div>
          <p className="text-gray-400 font-sans text-xs leading-relaxed">
            Generates exact, proposed source modifications and unified git diff patches (<code>git apply</code> compatible) to make branches mutually compatible.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Human Control & Verification</span>
          </div>
          <p className="text-gray-400 font-sans text-xs leading-relaxed">
            AI recommends; developers decide. Zero automated code modification or autonomous commits. Human review is mandatory.
          </p>
        </div>
      </div>
    </div>
  );
};
