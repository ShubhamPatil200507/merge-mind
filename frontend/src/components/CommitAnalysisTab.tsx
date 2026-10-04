import React, { useState } from 'react';
import { 
  GitCommit, 
  FileCode, 
  Layers, 
  Package, 
  Database, 
  Code2, 
  AlertCircle
} from 'lucide-react';
import { RepositoryAnalysis } from '../types';

interface CommitAnalysisTabProps {
  analysis: RepositoryAnalysis;
}

export const CommitAnalysisTab: React.FC<CommitAnalysisTabProps> = ({ analysis }) => {
  const [selectedSha, setSelectedSha] = useState<string>(analysis.commits[3]?.sha || 'a101f34');

  const commit = analysis.commits.find((c) => c.sha === selectedSha) || analysis.commits[0];
  const understanding = analysis.understandings.find((u) => u.sha === selectedSha);
  const changeMap = analysis.change_maps.find((m) => m.sha === selectedSha);

  return (
    <div className="space-y-4">
      {/* Intro Header */}
      <div className="p-3.5 rounded-lg bg-[#161b22] border border-[#30363d] flex items-center justify-between text-xs">
        <div>
          <div className="font-semibold text-white font-mono">AGENT 1 & 2: COMMIT & CHANGE GRAPH MAPPING</div>
          <div className="text-gray-400 text-[11px]">
            Agent 1 evaluates actual diffs to identify intent without trusting vague messages (e.g. "Fix stuff"). Agent 2 extracts structured AST entities.
          </div>
        </div>
        <div className="font-mono text-gray-400 text-[11px] px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d]">
          {analysis.commits.length} commits parsed
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Col: Commit List */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-gray-500 uppercase">
            COMMIT LOG
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden divide-y divide-[#30363d]/60 max-h-[640px] overflow-y-auto">
            {analysis.commits.map((c) => {
              const u = analysis.understandings.find((item) => item.sha === c.sha);
              const isSelected = c.sha === selectedSha;
              const isVague = u && !u.raw_message_trusted;

              return (
                <button
                  key={c.sha}
                  onClick={() => setSelectedSha(c.sha)}
                  className={`w-full p-2.5 text-left transition-colors flex flex-col gap-1 text-xs ${
                    isSelected
                      ? 'bg-[#21262d] border-l-2 border-blue-500 text-white'
                      : 'hover:bg-[#1a1f27] text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-blue-400 font-bold">{c.sha}</span>
                    <span className="text-gray-500">{c.branch}</span>
                  </div>

                  <div className="font-medium truncate text-gray-200">
                    "{c.message}"
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-0.5 font-mono">
                    <span>{c.author}</span>
                    {isVague ? (
                      <span className="px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                        VAGUE MESSAGE
                      </span>
                    ) : (
                      <span className="text-gray-400">
                        {u?.category}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Deep-Dive Agent Representation */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Agent 1 Output */}
          <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
              <div className="font-mono font-semibold text-xs text-white">
                AGENT 1: COMMIT UNDERSTANDING
              </div>
              <span className="text-[11px] font-mono text-gray-400">
                Confidence: {understanding ? Math.round(understanding.confidence * 100) : 90}%
              </span>
            </div>

            {understanding && !understanding.raw_message_trusted && (
              <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 space-y-1 font-mono">
                <div className="font-bold flex items-center gap-1.5 text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>OVERRODE UNTRUSTED COMMIT MESSAGE</span>
                </div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed font-sans">
                  Raw commit message was "{commit.message}". Agent 1 inspected the diff in <code>{commit.files_changed.join(', ')}</code> and inferred architectural intent.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] space-y-1">
                <div className="text-gray-500 font-mono text-[10px]">INFERRED INTENT</div>
                <div className="font-semibold text-gray-200">{understanding?.intent || commit.message}</div>
              </div>

              <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] space-y-1">
                <div className="text-gray-500 font-mono text-[10px]">CATEGORY</div>
                <div className="font-mono text-blue-400 font-semibold uppercase">
                  {understanding?.category || 'Feature'}
                </div>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <div className="text-gray-500 font-mono text-[10px]">AFFECTED COMPONENTS:</div>
              <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                {understanding?.affected_components.map((comp) => (
                  <span key={comp} className="px-2 py-0.5 rounded bg-[#0d1117] text-gray-300 border border-[#30363d]">
                    {comp}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] text-xs text-gray-400 space-y-1">
              <span className="font-mono text-[10px] text-gray-500 uppercase block">Reasoning Note:</span>
              <p className="text-gray-300 text-xs leading-relaxed font-sans">{understanding?.inferred_reasoning}</p>
            </div>
          </div>

          {/* Agent 2 Output */}
          <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
              <div className="font-mono font-semibold text-xs text-white">
                AGENT 2: STRUCTURED CHANGE MAP
              </div>
              <span className="text-[11px] font-mono text-gray-500">
                Code Symbols & Dependency Graph
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded bg-[#0d1117] border border-[#30363d] space-y-1.5">
                <div className="text-gray-500 text-[10px] uppercase font-bold">Functions Changed</div>
                {changeMap && changeMap.functions_changed.length > 0 ? (
                  <ul className="space-y-1 text-gray-300 text-[11px]">
                    {changeMap.functions_changed.map((fn) => (
                      <li key={fn} className="flex items-center gap-1.5">
                        <span className="text-blue-400 font-bold">[fn]</span> {fn}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-600 italic text-[11px]">None detected</span>
                )}
              </div>

              <div className="p-3 rounded bg-[#0d1117] border border-[#30363d] space-y-1.5">
                <div className="text-gray-500 text-[10px] uppercase font-bold">API Routes / Contracts</div>
                {changeMap && changeMap.apis_changed.length > 0 ? (
                  <ul className="space-y-1 text-gray-300 text-[11px]">
                    {changeMap.apis_changed.map((api) => (
                      <li key={api} className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">[api]</span> {api}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-600 italic text-[11px]">None touched</span>
                )}
              </div>

              <div className="p-3 rounded bg-[#0d1117] border border-[#30363d] space-y-1.5">
                <div className="text-gray-500 text-[10px] uppercase font-bold">Dependencies</div>
                {changeMap && changeMap.dependencies_changed.length > 0 ? (
                  <ul className="space-y-1 text-gray-300 text-[11px]">
                    {changeMap.dependencies_changed.map((dep) => (
                      <li key={dep} className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-bold">[pkg]</span> {dep}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-600 italic text-[11px]">No package changes</span>
                )}
              </div>

              <div className="p-3 rounded bg-[#0d1117] border border-[#30363d] space-y-1.5">
                <div className="text-gray-500 text-[10px] uppercase font-bold">Database / Schema</div>
                {changeMap && changeMap.schema_changed.length > 0 ? (
                  <ul className="space-y-1 text-gray-300 text-[11px]">
                    {changeMap.schema_changed.map((sch) => (
                      <li key={sch} className="flex items-center gap-1.5">
                        <span className="text-purple-400 font-bold">[schema]</span> {sch}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-600 italic text-[11px]">No schema modifications</span>
                )}
              </div>
            </div>

            {commit.diff_snippet && (
              <div className="space-y-1 pt-1">
                <div className="text-[10px] font-mono text-gray-500 uppercase">RAW DIFF BUFFER:</div>
                <pre className="p-3 rounded bg-[#0d1117] border border-[#30363d] font-mono text-[11px] text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-48">
                  {commit.diff_snippet}
                </pre>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
