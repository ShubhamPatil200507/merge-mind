import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  ArrowLeftRight
} from 'lucide-react';
import { RepositoryAnalysis } from '../types';
import { API_BASE } from '../config';

interface BranchComparisonTabProps {
  analysis: RepositoryAnalysis;
  onCompareBranches: (branchA: string, branchB: string) => void;
  isLoading: boolean;
}

interface FileDiffData {
  filename: string;
  branch_a: string;
  branch_b: string;
  content_main: string;
  content_a: string;
  content_b: string;
}

export const BranchComparisonTab: React.FC<BranchComparisonTabProps> = ({
  analysis,
  onCompareBranches,
  isLoading
}) => {
  const [branchA, setBranchA] = useState<string>(analysis.active_branch_a || 'feature/auth');
  const [branchB, setBranchB] = useState<string>(analysis.active_branch_b || 'feature/api-refactor');
  const [selectedFile, setSelectedFile] = useState<string>('server.js');
  const [diffData, setDiffData] = useState<FileDiffData | null>(null);
  const [isDiffLoading, setIsDiffLoading] = useState<boolean>(false);

  // Compute file status matrix
  const commitsA = analysis.commits.filter((c) => c.branch === branchA);
  const commitsB = analysis.commits.filter((c) => c.branch === branchB);

  const filesA = Array.from(new Set(commitsA.flatMap((c) => c.files_changed)));
  const filesB = Array.from(new Set(commitsB.flatMap((c) => c.files_changed)));
  const commonFiles = filesA.filter((f) => filesB.includes(f));

  // Compute severity per file
  const getFileSeverity = (filename: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' => {
    const risk = analysis.detected_risks.find((r) => r.affected_files.includes(filename));
    if (risk) return risk.risk_level;
    return commonFiles.includes(filename) ? 'MEDIUM' : 'LOW';
  };

  useEffect(() => {
    if (!selectedFile) return;
    setIsDiffLoading(true);
    fetch(`${API_BASE}/api/file-diff?filename=${encodeURIComponent(selectedFile)}&branch_a=${encodeURIComponent(branchA)}&branch_b=${encodeURIComponent(branchB)}`)
      .then((res) => res.json())
      .then((data) => {
        setDiffData(data);
        setIsDiffLoading(false);
      })
      .catch(() => {
        setIsDiffLoading(false);
      });
  }, [selectedFile, branchA, branchB]);

  const allFiles = Array.from(new Set([...filesA, ...filesB]));

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
      {/* Branch Selector Toolbar */}
      <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[#6B6B70]">BRANCH A:</span>
            <select
              value={branchA}
              onChange={(e) => setBranchA(e.target.value)}
              className="px-2.5 py-1 text-xs font-mono rounded-[6px] bg-[#F7F7F5] border border-[#E2E2DE] text-[#18181B] focus:outline-none focus:border-[#2563EB]"
            >
              {analysis.branches.filter(b => b !== 'main').map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <ArrowLeftRight className="w-3.5 h-3.5 text-[#929298]" />

          <div className="flex items-center gap-2">
            <span className="font-mono text-[#6B6B70]">BRANCH B:</span>
            <select
              value={branchB}
              onChange={(e) => setBranchB(e.target.value)}
              className="px-2.5 py-1 text-xs font-mono rounded-[6px] bg-[#F7F7F5] border border-[#E2E2DE] text-[#18181B] focus:outline-none focus:border-[#2563EB]"
            >
              {analysis.branches.filter(b => b !== 'main').map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => onCompareBranches(branchA, branchB)}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Comparing...' : 'Run comparison'}
        </button>
      </div>

      {/* Main 2-Col Diff & Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Overlapping Files Matrix Table */}
        <div className="lg:col-span-4 bg-white border border-[#E2E2DE] rounded-[8px] overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-[#E2E2DE] bg-[#FAFAFA] font-mono text-xs font-semibold text-[#18181B]">
            CHANGED FILES ({allFiles.length})
          </div>
          <div className="divide-y divide-[#E2E2DE]">
            {allFiles.map(file => {
              const severity = getFileSeverity(file);
              const isCommon = commonFiles.includes(file);
              const isSelected = file === selectedFile;
              return (
                <div
                  key={file}
                  onClick={() => setSelectedFile(file)}
                  className={`p-3 cursor-pointer text-xs transition-colors ${
                    isSelected ? 'bg-[#F1F1EF] border-l-2 border-[#2563EB]' : 'hover:bg-[#F8F8F6]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[#18181B] font-medium truncate">{file}</span>
                    <span className={`px-1.5 py-0.2 rounded-[4px] border text-[10px] font-mono font-semibold ${getSeverityBadge(severity)}`}>
                      {severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-[#6B6B70]">
                    <span>{isCommon ? 'Parallel Overlap' : 'Branch Specific'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Side-by-Side Diff Inspector */}
        <div className="lg:col-span-8 bg-white border border-[#E2E2DE] rounded-[8px] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E2DE] bg-[#FAFAFA] flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-[#18181B]">{selectedFile}</span>
            <span className="text-[#6B6B70]">{branchA} vs {branchB}</span>
          </div>

          {isDiffLoading ? (
            <div className="p-8 text-center text-xs font-mono text-[#6B6B70]">
              Loading file diff comparison...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E2E2DE] bg-[#18181B] text-[#E2E2DE] font-mono text-xs max-h-[550px] overflow-y-auto">
              {/* Branch A View */}
              <div className="p-3.5 space-y-2 overflow-x-auto">
                <div className="text-[11px] font-semibold text-[#60A5FA] border-b border-gray-700 pb-1">
                  {branchA}
                </div>
                <pre><code>{diffData?.content_a || '// No branch-specific diff available'}</code></pre>
              </div>

              {/* Branch B View */}
              <div className="p-3.5 space-y-2 overflow-x-auto">
                <div className="text-[11px] font-semibold text-[#C084FC] border-b border-gray-700 pb-1">
                  {branchB}
                </div>
                <pre><code>{diffData?.content_b || '// No branch-specific diff available'}</code></pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
