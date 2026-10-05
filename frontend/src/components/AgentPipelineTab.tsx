import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import { RepositoryAnalysis } from '../types';

interface AgentPipelineTabProps {
  analysis: RepositoryAnalysis;
}

export const AgentPipelineTab: React.FC<AgentPipelineTabProps> = ({ analysis }) => {
  const [selectedAgentIndex, setSelectedAgentIndex] = useState<number>(0);

  const pipelineStages = [
    {
      step: 1,
      name: 'Commit Understanding & Intent Extraction',
      duration: '0.24s',
      status: 'Completed',
      purpose: 'Infers architectural intent directly from git commit hunks and changed files.',
      inputs: ['Commit messages', 'Unified diffs', 'Changed file paths'],
      outputs: `${analysis.understandings.length} CommitUnderstanding records with intent classifications`,
      sampleData: analysis.understandings[0]
    },
    {
      step: 2,
      name: 'AST & Cross-Branch Change Graph Mapping',
      duration: '0.31s',
      status: 'Completed',
      purpose: 'Extracts function signatures, exported routes, schemas, and package dependencies into structured relational entities.',
      inputs: ['Normalized diff tokens', 'package.json manifests', 'Route decorators'],
      outputs: `${analysis.change_maps.length} ChangeMap records linking commits to functions and routes`,
      sampleData: analysis.change_maps[0]
    },
    {
      step: 3,
      name: 'Collision Detection Engine (12 Categories)',
      duration: '0.42s',
      status: 'Completed',
      purpose: 'Evaluates structural overlap, execution order inversion, dependency divergence, and API contract breaking changes.',
      inputs: ['Cross-branch ChangeMaps', 'Branch topologies', 'Contract definitions'],
      outputs: `${analysis.detected_risks.length} raw collision events identified across parallel branches`,
      sampleData: {
        collisionsCount: analysis.detected_risks.length,
        types: ['API_CONTRACT', 'EXECUTION_ORDER', 'DEPENDENCY']
      }
    },
    {
      step: 4,
      name: 'Semantic Risk Scoring & Scoring Model',
      duration: '0.19s',
      status: 'Completed',
      purpose: 'Computes multi-dimensional risk scores (0-100) combining code overlap, contract impact, and security implications.',
      inputs: ['Collision events', 'Historical test coverage uncertainty', 'Security boundaries'],
      outputs: 'Scored integration risks with severity categorization (Critical, High, Medium, Low)',
      sampleData: analysis.detected_risks[0]?.risk_score
    },
    {
      step: 5,
      name: 'Reconciliation Patch Synthesizer',
      duration: '0.28s',
      status: 'Completed',
      purpose: 'Produces unified diff patches (git apply compatible) that resolve concurrent behavioral conflicts.',
      inputs: ['Target branches', 'Conflicting AST symbols', 'Backward compatibility adapters'],
      outputs: `${analysis.compatibility_patches.length} unified patch files`,
      sampleData: analysis.compatibility_patches[0]
    }
  ];

  const currentStage = pipelineStages[selectedAgentIndex];

  return (
    <div className="space-y-4">
      {/* Header Context */}
      <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <h1 className="text-base font-semibold text-[#18181B] tracking-tight">
            Analysis Pipeline Execution Trace
          </h1>
          <p className="text-xs text-[#6B6B70] mt-0.5">
            Deterministic stage-by-stage pipeline executing normalized AST parsing, collision checks, risk scoring, and patch generation.
          </p>
        </div>
        <div className="font-mono text-xs text-[#6B6B70]">
          Total pipeline time: <strong className="text-[#18181B]">1.44s</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Pipeline Steps Table */}
        <div className="lg:col-span-5 bg-white border border-[#E2E2DE] rounded-[8px] overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-[#E2E2DE] bg-[#FAFAFA] font-mono text-xs font-semibold text-[#18181B]">
            PIPELINE STAGES
          </div>
          <div className="divide-y divide-[#E2E2DE]">
            {pipelineStages.map((stage, idx) => {
              const isSelected = idx === selectedAgentIndex;
              return (
                <div
                  key={stage.step}
                  onClick={() => setSelectedAgentIndex(idx)}
                  className={`p-3.5 cursor-pointer text-xs transition-colors ${
                    isSelected ? 'bg-[#F1F1EF] border-l-2 border-[#2563EB]' : 'hover:bg-[#F8F8F6]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[#18181B] font-medium">Stage {stage.step}: {stage.name}</span>
                    <span className="font-mono text-[11px] text-[#16803C] font-semibold">✓ {stage.duration}</span>
                  </div>
                  <div className="text-[11px] text-[#6B6B70] mt-1 line-clamp-1">
                    {stage.purpose}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Stage Inspection */}
        <div className="lg:col-span-7 bg-white border border-[#E2E2DE] rounded-[8px] p-5 space-y-4 text-xs">
          <div className="border-b border-[#E2E2DE] pb-3 flex items-center justify-between">
            <div>
              <span className="font-mono text-[11px] text-[#6B6B70]">Stage {currentStage.step} Inspection</span>
              <h2 className="text-base font-semibold text-[#18181B] mt-0.5">{currentStage.name}</h2>
            </div>
            <span className="px-2 py-0.5 rounded-[4px] bg-[#F0FDF4] border border-[#DCFCE7] text-[#166534] font-mono text-xs font-medium">
              ✓ {currentStage.status} ({currentStage.duration})
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="font-mono text-[11px] font-semibold text-[#6B6B70] uppercase">Objective</h3>
              <p className="mt-1 text-[#18181B] bg-[#F7F7F5] border border-[#E2E2DE] rounded-[6px] p-3 leading-relaxed">
                {currentStage.purpose}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#E2E2DE] rounded-[6px] p-3 font-mono text-xs">
                <span className="text-[#6B6B70] text-[11px]">Inputs:</span>
                <ul className="mt-1 space-y-0.5 text-[#18181B]">
                  {currentStage.inputs.map(i => <li key={i}>• {i}</li>)}
                </ul>
              </div>

              <div className="border border-[#E2E2DE] rounded-[6px] p-3 font-mono text-xs">
                <span className="text-[#6B6B70] text-[11px]">Outputs:</span>
                <div className="mt-1 text-[#18181B]">
                  {currentStage.outputs}
                </div>
              </div>
            </div>

            {currentStage.sampleData && (
              <div className="space-y-1.5">
                <h3 className="font-mono text-[11px] font-semibold text-[#6B6B70] uppercase">Structured Stage Output</h3>
                <div className="bg-[#18181B] text-[#E2E2DE] font-mono text-xs p-3 rounded-[6px] overflow-x-auto max-h-[300px]">
                  <pre><code>{JSON.stringify(currentStage.sampleData, null, 2)}</code></pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
