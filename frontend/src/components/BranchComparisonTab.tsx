import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  FileCode, 
  RefreshCw, 
  ArrowLeftRight, 
  AlertTriangle, 
  ShieldAlert,
  Layers,
  Code2
} from 'lucide-react';
import { RepositoryAnalysis } from '../types';

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
  const uniqueA = filesA.filter((f) => !filesB.includes(f));
  const uniqueB = filesB.filter((f) => !filesA.includes(f));
  const allUniqueFiles = Array.from(new Set([...filesA, ...filesB]));

  // Compute severity per file (Section 9 requirement)
  const getFileSeverity = (filename: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' => {
    const risk = analysis.detected_risks.find((r) => r.affected_files.includes(filename));
    if (risk) {
      return risk.risk_level;
    }
    return commonFiles.includes(filename) ? 'MEDIUM' : 'LOW';
  };

  // Fetch file diff content when selectedFile changes
  useEffect(() => {
    if (!selectedFile) return;
    setIsDiffLoading(true);
    fetch(`/api/file-diff?filename=${encodeURIComponent(selectedFile)}&branch_a=${encodeURIComponent(branchA)}&branch_b=${encodeURIComponent(branchB)}`)
      .then((res) => res.json())
      .then((data) => {
        setDiffData(data);
        setIsDiffLoading(false);
      })
      .catch(() => {
        setIsDiffLoading(false);
      });
  }, [selectedFile, branchA, branchB]);

  const handleRunComparison = () => {
    onCompareBranches(branchA, branchB);
  };

  const relevantRisk = analysis.detected_risks.find((r) =>
    r.affected_files.includes(selectedFile)
  );

  return (
    <div className="space-y-4">
      {/* Branch Selector Bar */}
      <div className="p-3.5 rounded-lg bg-[#161b22] border border-[#30363d] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-gray-500">BRANCH A:</span>
            <select
              value={branchA}
              onChange={(e) => setBranchA(e.target.value)}
              className="px-2.5 py-1 text-xs font-mono rounded bg-[#0d1117] border border-[#30363d] text-white focus:outline-none"
            >
              {analysis.branches.filter(b => b !== 'main').map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <ArrowLeftRight className="w-3.5 h-3.5 text-gray-500" />

          <div className="flex items-center gap-2">
            <span className="font-mono text-gray-500">BRANCH B:</span>
            <select
              value={branchB}
              onChange={(e) => setBranchB(e.target.value)}
              className="px-2.5 py-1 text-xs font-mono rounded bg-[#0d1117] border border-[#30363d] text-white focus:outline-none"
            >
              {analysis.branches.filter(b => b !== 'main').map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleRunComparison}
          disabled={isLoading || branchA === branchB}
          className="px-3 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] text-gray-200 text-xs font-medium border border-[#30363d] transition-colors flex items-center gap-1.5 disabled:opacity-50 font-mono"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          Run Cross-Branch Collision Check
        </button>
      </div>

      {/* Comparison Dimensions Metric Summary (Section 9 requirement) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded bg-[#161b22] border border-[#30363d]">
          <div className="text-gray-500 text-[10px]">COMMON FILES (OVERLAP)</div>
          <div className="text-lg font-bold text-amber-400">{commonFiles.length} files</div>
          <div className="text-[10px] text-gray-500 truncate">{commonFiles.join(', ') || 'None'}</div>
        </div>

        <div className="p-3 rounded bg-[#161b22] border border-[#30363d]">
          <div className="text-gray-500 text-[10px]">UNIQUE TO {branchA}</div>
          <div className="text-lg font-bold text-blue-400">{uniqueA.length} files</div>
          <div className="text-[10px] text-gray-500 truncate">{uniqueA.join(', ') || 'None'}</div>
        </div>

        <div className="p-3 rounded bg-[#161b22] border border-[#30363d]">
          <div className="text-gray-500 text-[10px]">UNIQUE TO {branchB}</div>
          <div className="text-lg font-bold text-purple-400">{uniqueB.length} files</div>
          <div className="text-[10px] text-gray-500 truncate">{uniqueB.join(', ') || 'None'}</div>
        </div>

        <div className="p-3 rounded bg-[#161b22] border border-[#30363d]">
          <div className="text-gray-500 text-[10px]">POTENTIAL SEMANTIC RISKS</div>
          <div className="text-lg font-bold text-red-400">
            {analysis.detected_risks.filter(r => r.branches.includes(branchA) && r.branches.includes(branchB)).length}
          </div>
          <div className="text-[10px] text-gray-500">Pipeline & contract breaks</div>
        </div>
      </div>

      {/* Main Split: File Matrix & Diff Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column: Files list with per-file severity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>FILES CHANGED & RISK SEVERITY</span>
            <span>{allUniqueFiles.length} files</span>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden divide-y divide-[#30363d]/60 text-xs font-mono">
            {allUniqueFiles.map((file) => {
              const severity = getFileSeverity(file);
              const inA = filesA.includes(file);
              const inB = filesB.includes(file);
              const isCollision = inA && inB;
              const isSelected = selectedFile === file;

              const severityBadge =
                severity === 'CRITICAL' ? 'bg-red-950/80 text-red-300 border-red-800' :
                severity === 'HIGH' ? 'bg-orange-950/80 text-orange-300 border-orange-800' :
                severity === 'MEDIUM' ? 'bg-amber-950/70 text-amber-300 border-amber-800' :
                'bg-[#0d1117] text-gray-400 border-[#30363d]';

              return (
                <button
                  key={file}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full p-2.5 flex items-center justify-between text-left transition-colors ${
                    isSelected
                      ? 'bg-[#21262d] text-white font-semibold border-l-2 border-blue-500'
                      : 'hover:bg-[#1a1f27] text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span className="truncate">{file}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${severityBadge}`}>
                      {severity}
                    </span>
                    {isCollision && (
                      <span className="px-1 py-0.2 rounded text-[9px] bg-red-950 text-red-300 border border-red-800 font-bold">
                        OVERLAP
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Diff View & Diagnostic Context */}
        <div className="lg:col-span-2 space-y-3">
          
          {relevantRisk && (
            <div className="p-3.5 rounded-lg bg-[#161b22] border border-[#30363d] space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="text-gray-400">INTEGRATION DIAGNOSTIC FOR {selectedFile}:</span>
                <span className="text-red-400 font-bold">{relevantRisk.risk_level}</span>
              </div>
              <p className="text-gray-300 text-xs">
                {relevantRisk.summary}
              </p>
              <div className="text-[11px] text-gray-400 pt-1 font-mono">
                Impact: {relevantRisk.potential_impact}
              </div>
            </div>
          )}

          {/* Diff Viewer Card (Section 8 requirement) */}
          <div className="rounded-lg bg-[#161b22] border border-[#30363d] overflow-hidden">
            <div className="px-3.5 py-2 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-semibold text-white">{selectedFile}</span>
              </div>
              <div className="text-gray-400 text-[11px]">
                <span className="text-blue-300">{branchA}</span> vs <span className="text-purple-300">{branchB}</span>
              </div>
            </div>

            {isDiffLoading ? (
              <div className="p-8 text-center text-xs text-gray-500 font-mono">
                Loading diff buffers...
              </div>
            ) : diffData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#30363d]">
                <div className="p-3 text-xs font-mono">
                  <div className="pb-1.5 mb-1.5 border-b border-[#30363d] text-[11px] text-blue-300 font-semibold flex justify-between">
                    <span>{branchA}</span>
                    <span className="text-gray-500">Incoming</span>
                  </div>
                  <pre className="text-gray-300 whitespace-pre-wrap overflow-x-auto text-[11px] leading-relaxed max-h-96">
                    {diffData.content_a}
                  </pre>
                </div>

                <div className="p-3 text-xs font-mono bg-[#0d1117]">
                  <div className="pb-1.5 mb-1.5 border-b border-[#30363d] text-[11px] text-purple-300 font-semibold flex justify-between">
                    <span>{branchB}</span>
                    <span className="text-gray-500">Target</span>
                  </div>
                  <pre className="text-gray-300 whitespace-pre-wrap overflow-x-auto text-[11px] leading-relaxed max-h-96">
                    {diffData.content_b}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-gray-500">
                Select a file to compare branch contents
              </div>
            )}
          </div>

          {/* Commits Touching File */}
          <div className="p-3 rounded-lg bg-[#161b22] border border-[#30363d] text-xs font-mono space-y-1.5">
            <div className="text-gray-400 text-[11px]">COMMITS TOUCHING {selectedFile}:</div>
            <div className="space-y-1">
              {analysis.commits
                .filter((c) => c.files_changed.includes(selectedFile))
                .map((c) => (
                  <div key={c.sha} className="flex items-center justify-between p-1.5 rounded bg-[#0d1117] text-[11px]">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-blue-400 font-bold">{c.sha}</span>
                      <span className="text-gray-300 truncate">"{c.message}"</span>
                    </div>
                    <span className="text-gray-500 text-[10px] shrink-0 pl-2">
                      {c.author} ({c.branch})
                    </span>
                  </div>
                ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
