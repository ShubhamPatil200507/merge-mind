import React, { useState } from 'react';
import { 
  GitCommit, 
  FileCode, 
  Layers, 
  CheckCircle2
} from 'lucide-react';
import { RepositoryAnalysis } from '../types';

interface CommitAnalysisTabProps {
  analysis: RepositoryAnalysis;
}

export const CommitAnalysisTab: React.FC<CommitAnalysisTabProps> = ({ analysis }) => {
  const [selectedSha, setSelectedSha] = useState<string>(analysis.commits[1]?.sha || analysis.commits[0]?.sha || '');

  const commit = analysis.commits.find((c) => c.sha === selectedSha) || analysis.commits[0];
  const understanding = analysis.understandings.find((u) => u.sha === selectedSha);
  const changeMap = analysis.change_maps.find((m) => m.sha === selectedSha);

  return (
    <div className="space-y-4">
      {/* Header Context */}
      <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <h1 className="text-base font-semibold text-[#18181B] tracking-tight">
            Commit Graph & AST Change Mapping
          </h1>
          <p className="text-xs text-[#6B6B70] mt-0.5">
            Parses raw commit diffs to extract architectural intent, modified function symbols, and runtime contract changes.
          </p>
        </div>
        <div className="font-mono text-xs text-[#6B6B70]">
          {analysis.commits.length} commits parsed
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Commit Index Table */}
        <div className="lg:col-span-5 bg-white border border-[#E2E2DE] rounded-[8px] overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-[#E2E2DE] bg-[#FAFAFA] font-mono text-xs font-semibold text-[#18181B]">
            COMMIT LOG
          </div>
          <div className="divide-y divide-[#E2E2DE] max-h-[650px] overflow-y-auto">
            {analysis.commits.map((c) => {
              const isSelected = c.sha === selectedSha;
              return (
                <div
                  key={c.sha}
                  onClick={() => setSelectedSha(c.sha)}
                  className={`p-3 cursor-pointer text-xs transition-colors ${
                    isSelected ? 'bg-[#F1F1EF] border-l-2 border-[#2563EB]' : 'hover:bg-[#F8F8F6]'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="font-semibold text-[#2563EB]">{c.sha}</span>
                    <span className="text-[#929298]">{c.branch}</span>
                  </div>
                  <div className="font-medium text-[#18181B] mt-1 line-clamp-1">
                    {c.message}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#6B6B70] font-mono">
                    <span>{c.author}</span>
                    <span>•</span>
                    <span>{c.files_changed.length} files</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: AST Change Details */}
        {commit && (
          <div className="lg:col-span-7 bg-white border border-[#E2E2DE] rounded-[8px] p-5 space-y-5">
            {/* Commit Header */}
            <div className="border-b border-[#E2E2DE] pb-4 space-y-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[#2563EB] font-bold">{commit.sha}</span>
                <span className="text-[#6B6B70]">{commit.branch}</span>
              </div>
              <h2 className="text-base font-semibold text-[#18181B]">
                {commit.message}
              </h2>
              <div className="flex items-center gap-4 text-xs font-mono text-[#6B6B70]">
                <span>Author: <strong className="text-[#18181B]">{commit.author}</strong></span>
                <span>Diff: <span className="text-[#16803C]">+{commit.additions}</span> <span className="text-[#DC2626]">-{commit.deletions}</span></span>
              </div>
            </div>

            {/* Extracted Architectural Intent */}
            {understanding && (
              <div className="bg-[#F7F7F5] border border-[#E2E2DE] rounded-[6px] p-3.5 space-y-2 text-xs">
                <div className="font-mono text-[11px] font-semibold text-[#6B6B70] uppercase">
                  Inferred Intent & Category
                </div>
                <div className="font-medium text-[#18181B]">
                  {understanding.intent}
                </div>
                <div className="text-[#6B6B70] text-[11px]">
                  Category: <span className="font-mono text-[#18181B]">{understanding.category}</span> • 
                  Confidence: <span className="font-mono text-[#18181B]">{Math.round(understanding.confidence * 100)}%</span>
                </div>
              </div>
            )}

            {/* Structured AST Symbols Changed */}
            {changeMap && (
              <div className="space-y-3">
                <h3 className="font-mono text-xs font-semibold text-[#18181B] uppercase">
                  AST Change Entities
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="border border-[#E2E2DE] rounded-[6px] p-3">
                    <span className="text-[#6B6B70] text-[11px]">Touched Files:</span>
                    <ul className="mt-1 space-y-0.5 text-[#18181B]">
                      {changeMap.files_changed.map(f => (
                        <li key={f} className="truncate">• {f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="border border-[#E2E2DE] rounded-[6px] p-3">
                    <span className="text-[#6B6B70] text-[11px]">Functions / Symbols:</span>
                    <ul className="mt-1 space-y-0.5 text-[#18181B]">
                      {changeMap.functions_changed.length > 0 ? (
                        changeMap.functions_changed.map(fn => (
                          <li key={fn} className="truncate">• {fn}</li>
                        ))
                      ) : (
                        <li className="text-[#929298] italic">No isolated function nodes</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Diff Snippet */}
            {commit.diff_snippet && (
              <div className="space-y-2">
                <h3 className="font-mono text-xs font-semibold text-[#18181B] uppercase">
                  Diff Excerpt
                </h3>
                <div className="bg-[#18181B] text-[#E2E2DE] font-mono text-xs p-3.5 rounded-[6px] overflow-x-auto">
                  <pre><code>{commit.diff_snippet}</code></pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
