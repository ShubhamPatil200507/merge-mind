import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  ArrowRight, 
  GitBranch, 
  Terminal, 
  CheckCircle2, 
  ShieldCheck,
  Code2
} from 'lucide-react';
import { CompatibilityPatch, RepositoryAnalysis } from '../types';

interface CompatibilityReconciliationTabProps {
  analysis: RepositoryAnalysis;
}

export const CompatibilityReconciliationTab: React.FC<CompatibilityReconciliationTabProps> = ({
  analysis
}) => {
  const patches = analysis.compatibility_patches || [];
  const [selectedPatchIndex, setSelectedPatchIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'reconciled' | 'patch' | 'instructions'>('reconciled');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedCli, setCopiedCli] = useState<boolean>(false);

  if (patches.length === 0) {
    return (
      <div className="p-8 rounded-lg bg-[#161b22] border border-[#30363d] text-center text-xs font-mono text-gray-500">
        No active compatibility reconciliation patches required.
      </div>
    );
  }

  const patch = patches[selectedPatchIndex] || patches[0];

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCli = (filename: string) => {
    navigator.clipboard.writeText(`git apply ${filename.replace('/', '_')}.patch`);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handleDownloadPatch = (p: CompatibilityPatch) => {
    const blob = new Blob([p.unified_diff], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.file_path.replace('/', '_')}.patch`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Intro Header */}
      <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="font-mono font-semibold text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-400" />
            <span>CODE RECONCILIATION & COMPATIBILITY ENGINE</span>
          </div>
          <p className="text-gray-400 text-xs">
            Generated code modifications to harmonize diverging repositories and parallel branches into mutually compatible states without breaking either developer's requirements.
          </p>
        </div>
        <div className="font-mono text-gray-400 text-[11px] px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d] shrink-0">
          {patches.length} Reconciliation Patches Available
        </div>
      </div>

      {/* Patch Selector Tabs */}
      <div className="p-2 rounded-lg bg-[#161b22] border border-[#30363d] flex items-center gap-2 overflow-x-auto text-xs font-mono">
        <span className="text-gray-500 text-[11px] px-2">TARGET FILE:</span>
        {patches.map((p, idx) => {
          const isSelected = selectedPatchIndex === idx;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPatchIndex(idx)}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#21262d] text-white border border-blue-500 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-gray-400" />
              <span>{p.file_path}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Cols: Proposed Code & Diffs */}
        <div className="lg:col-span-2 space-y-3">
          
          <div className="rounded-lg bg-[#161b22] border border-[#30363d] overflow-hidden">
            {/* Strategy header */}
            <div className="p-4 border-b border-[#30363d] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-mono text-blue-400 font-semibold uppercase">
                  COMPATIBILITY STRATEGY:
                </div>
                <div className="text-[11px] font-mono text-gray-400">
                  <span>{patch.target_branch}</span>
                  <span className="mx-1 text-gray-600">↔</span>
                  <span>{patch.source_branch}</span>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-white">
                {patch.compatibility_strategy}
              </h3>

              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                {patch.summary_of_changes}
              </p>
            </div>

            {/* View Mode Switcher & Export */}
            <div className="px-4 py-2 bg-[#0d1117] border-b border-[#30363d] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setViewMode('reconciled')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    viewMode === 'reconciled'
                      ? 'bg-[#21262d] text-white font-semibold'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Proposed Compatible Code
                </button>
                <button
                  onClick={() => setViewMode('patch')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    viewMode === 'patch'
                      ? 'bg-[#21262d] text-white font-semibold'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Unified Diff (.patch)
                </button>
                <button
                  onClick={() => setViewMode('instructions')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    viewMode === 'instructions'
                      ? 'bg-[#21262d] text-white font-semibold'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Apply Steps
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyCode(viewMode === 'patch' ? patch.unified_diff : patch.reconciled_code)}
                  className="px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => handleDownloadPatch(patch)}
                  className="px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                >
                  <Download className="w-3 h-3" />
                  Save .patch
                </button>
              </div>
            </div>

            {/* Content view */}
            <div className="p-4">
              {viewMode === 'reconciled' && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-gray-500 uppercase">
                    PROPOSED COMPATIBLE IMPLEMENTATION ({patch.file_path}):
                  </div>
                  <pre className="p-3.5 rounded bg-[#0d1117] border border-[#30363d] font-mono text-xs text-gray-200 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[460px]">
                    {patch.reconciled_code}
                  </pre>
                </div>
              )}

              {viewMode === 'patch' && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-gray-500 uppercase">
                    UNIFIED DIFF PATCH (GIT APPLY READY):
                  </div>
                  <pre className="p-3.5 rounded bg-[#0d1117] border border-[#30363d] font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[460px]">
                    {patch.unified_diff}
                  </pre>
                </div>
              )}

              {viewMode === 'instructions' && (
                <div className="space-y-3 font-sans text-xs">
                  <div className="font-mono text-gray-400 font-semibold uppercase text-[11px]">
                    MANUAL INTEGRATION INSTRUCTIONS:
                  </div>
                  <ol className="space-y-2 text-gray-300 list-decimal list-inside leading-relaxed">
                    {patch.instructions.map((inst, idx) => (
                      <li key={idx} className="p-2 rounded bg-[#0d1117] border border-[#30363d]">
                        {inst}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: CLI Application Guide */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] space-y-3 text-xs">
            <div className="border-b border-[#30363d] pb-2 font-mono">
              <div className="font-semibold text-white">APPLY VIA GIT CLI</div>
              <div className="text-gray-400 text-[11px]">Direct developer application</div>
            </div>

            <p className="text-gray-400 font-sans text-xs leading-relaxed">
              You can apply this reconciled compatibility patch directly to your working tree using git:
            </p>

            <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] font-mono text-[11px] text-emerald-400 flex items-center justify-between gap-2">
              <span className="truncate">$ git apply {patch.file_path.replace('/', '_')}.patch</span>
              <button
                onClick={() => handleCopyCli(patch.file_path)}
                className="px-1.5 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-gray-300 shrink-0"
              >
                {copiedCli ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <div className="space-y-1.5 pt-1 text-[11px] font-mono text-gray-400">
              <div className="text-gray-300 font-bold">Verification Steps:</div>
              <div className="p-2 rounded bg-[#0d1117] border border-[#30363d] space-y-1 text-gray-400">
                <div>1. <code>git checkout {patch.target_branch}</code></div>
                <div>2. <code>git apply {patch.file_path.replace('/', '_')}.patch</code></div>
                <div>3. <code>git diff {patch.file_path}</code></div>
                <div>4. Run recommended test suites</div>
              </div>
            </div>

            <div className="p-2 rounded bg-[#0d1117] border border-[#30363d] text-[10px] text-gray-500 font-mono">
              Human review rule: Verify logic before commit. No automated code push performed.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
