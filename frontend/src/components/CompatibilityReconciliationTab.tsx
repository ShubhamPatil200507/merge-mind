import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  Terminal,
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
  const [viewMode, setViewMode] = useState<'diff' | 'reconciled'>('diff');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  if (patches.length === 0) {
    return (
      <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-8 text-center text-xs font-mono text-[#6B6B70]">
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

  const handleCopyCmd = (filename: string) => {
    navigator.clipboard.writeText(`git apply ${filename.replace('/', '_')}.patch`);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
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
      {/* Header Context */}
      <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <h1 className="text-base font-semibold text-[#18181B] tracking-tight">
            Compatibility Reconciliation Patches
          </h1>
          <p className="text-xs text-[#6B6B70] mt-0.5">
            Proposed source modifications formatted as standard unified diffs (<code className="font-mono">git apply</code> compatible) to make divergent branches mutually compatible.
          </p>
        </div>
        <div className="font-mono text-xs text-[#6B6B70]">
          {patches.length} patches available
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Patch List */}
        <div className="lg:col-span-4 bg-white border border-[#E2E2DE] rounded-[8px] overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-[#E2E2DE] bg-[#FAFAFA] font-mono text-xs font-semibold text-[#18181B]">
            PATCH INDEX
          </div>
          <div className="divide-y divide-[#E2E2DE]">
            {patches.map((p, idx) => {
              const isSelected = idx === selectedPatchIndex;
              return (
                <div
                  key={p.id || idx}
                  onClick={() => setSelectedPatchIndex(idx)}
                  className={`p-3 cursor-pointer text-xs transition-colors ${
                    isSelected ? 'bg-[#F1F1EF] border-l-2 border-[#2563EB]' : 'hover:bg-[#F8F8F6]'
                  }`}
                >
                  <div className="font-mono font-medium text-[#18181B] truncate">
                    {p.file_path}
                  </div>
                  <div className="text-[11px] text-[#6B6B70] mt-1 line-clamp-2">
                    {p.strategy_name || p.compatibility_strategy}
                  </div>
                  <div className="flex items-center gap-2 mt-2 font-mono text-[10px] text-[#929298]">
                    <span>Unified Diff</span>
                    <span>•</span>
                    <span>Validated</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code & Diff Viewer */}
        <div className="lg:col-span-8 bg-white border border-[#E2E2DE] rounded-[8px] overflow-hidden">
          {/* Patch Control Bar */}
          <div className="px-4 py-3 border-b border-[#E2E2DE] bg-[#FAFAFA] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-[#18181B]">{patch.file_path}</span>
              <span className="font-mono text-[11px] text-[#6B6B70]">({patch.strategy_name || 'Patch'})</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-[4px] border border-[#D9D9D4] overflow-hidden font-mono text-[11px]">
                <button
                  onClick={() => setViewMode('diff')}
                  className={`px-2.5 py-1 ${viewMode === 'diff' ? 'bg-[#18181B] text-white font-medium' : 'bg-white text-[#6B6B70] hover:bg-[#F1F1EF]'}`}
                >
                  Unified Diff
                </button>
                <button
                  onClick={() => setViewMode('reconciled')}
                  className={`px-2.5 py-1 ${viewMode === 'reconciled' ? 'bg-[#18181B] text-white font-medium' : 'bg-white text-[#6B6B70] hover:bg-[#F1F1EF]'}`}
                >
                  Reconciled File
                </button>
              </div>

              <button
                onClick={() => handleCopyCode(viewMode === 'diff' ? patch.unified_diff : patch.reconciled_code)}
                className="px-2.5 py-1 rounded-[4px] bg-white border border-[#D9D9D4] text-[#27272A] hover:bg-[#F1F1EF] transition-colors flex items-center gap-1 font-mono text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#16803C]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => handleDownloadPatch(patch)}
                className="px-2.5 py-1 rounded-[4px] bg-white border border-[#D9D9D4] text-[#27272A] hover:bg-[#F1F1EF] transition-colors flex items-center gap-1 font-mono text-[11px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .patch</span>
              </button>
            </div>
          </div>

          {/* Strategy Rationale */}
          <div className="p-3.5 bg-[#F7F7F5] border-b border-[#E2E2DE] text-xs text-[#18181B] leading-relaxed">
            <strong className="font-mono text-[#6B6B70] text-[11px] uppercase mr-2">Rationale:</strong>
            {patch.summary || patch.summary_of_changes || patch.why_this_resolves}
          </div>

          {/* Code Body */}
          <div className="bg-[#18181B] text-[#E2E2DE] font-mono text-xs p-4 overflow-x-auto max-h-[500px]">
            <pre><code>{viewMode === 'diff' ? patch.unified_diff : patch.reconciled_code}</code></pre>
          </div>

          {/* Terminal Apply Helper */}
          <div className="p-3 bg-[#FAFAFA] border-t border-[#E2E2DE] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-[#6B6B70]">
              <span>Apply via CLI:</span>
              <code className="bg-[#F1F1EF] px-2 py-0.5 rounded text-[#18181B] border border-[#E2E2DE]">
                git apply {patch.file_path.replace('/', '_')}.patch
              </code>
            </div>
            <button
              onClick={() => handleCopyCmd(patch.file_path)}
              className="text-[#2563EB] hover:underline"
            >
              {copiedCmd ? 'Command copied!' : 'Copy command'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
