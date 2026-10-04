import React, { useState } from 'react';
import { 
  Cpu, 
  ArrowDown, 
  CheckCircle2, 
  Layers, 
  ShieldAlert, 
  Sliders, 
  CheckSquare, 
  Terminal, 
  UserCheck, 
  Sparkles
} from 'lucide-react';
import { RepositoryAnalysis } from '../types';

interface AgentPipelineTabProps {
  analysis: RepositoryAnalysis;
}

export const AgentPipelineTab: React.FC<AgentPipelineTabProps> = ({ analysis }) => {
  const [selectedAgentIndex, setSelectedAgentIndex] = useState<number>(0);

  const agents = [
    {
      step: 1,
      name: 'Agent 1: Commit Understanding Agent',
      icon: Sparkles,
      purpose: 'Infers architectural intent from code diffs without relying on vague messages (e.g. "Fix stuff").',
      inputs: ['Commit messages', 'Unified diffs', 'Changed file paths', 'PR descriptions'],
      outputs: `${analysis.understandings.length} CommitUnderstanding records with intent and category`,
      whyNotSingleLLM: 'Enforces grounding in diff tokens and changed lines before evaluating collisions.',
      sampleData: analysis.understandings[3]
    },
    {
      step: 2,
      name: 'Agent 2: Change Mapping Agent',
      icon: Layers,
      purpose: 'Extracts code symbols, function signatures, API routes, and dependency versions into a structured change graph.',
      inputs: ['CommitUnderstanding records', 'AST function declarations', 'package.json manifests', 'Prisma schemas'],
      outputs: `${analysis.change_maps.length} ChangeMap records linking commits to functions and routes`,
      whyNotSingleLLM: 'Transforms unstructured textual diffs into structured relational entities for deterministic matching.',
      sampleData: analysis.change_maps[3]
    },
    {
      step: 3,
      name: 'Agent 3: Collision Detection Agent',
      icon: ShieldAlert,
      purpose: 'Detects 7 collision types: Direct File, Function, Structural, API Contract, Dependency, Schema, Semantic.',
      inputs: ['Cross-branch ChangeMaps', 'Branch topologies', 'Route contracts'],
      outputs: `${analysis.detected_risks.length} raw collision events identified across parallel branches`,
      whyNotSingleLLM: 'Executes graph-based overlap detection rather than relying on LLM context windows to remember multiple branches.',
      sampleData: {
        typesDetected: ['SEMANTIC', 'API_CONTRACT', 'DEPENDENCY', 'DIRECT_FILE'],
        collisionsCount: analysis.detected_risks.length
      }
    },
    {
      step: 4,
      name: 'Agent 4: Semantic Risk Agent',
      icon: Sparkles,
      purpose: 'Analyzes whether individually valid changes produce invalid behavior together (e.g. authentication bypass).',
      inputs: ['Raw collisions from Agent 3', 'Middleware execution pipelines', 'Diff evidence'],
      outputs: 'Empirical behavioral risk evaluations with explicit confidence levels',
      whyNotSingleLLM: 'Enforces evidence citation and prudent engineering language ("Potential risk", "Likely conflict").',
      sampleData: {
        topSemanticRisk: analysis.detected_risks[0]?.title,
        evidenceCount: analysis.detected_risks[0]?.evidence.length
      }
    },
    {
      step: 5,
      name: 'Agent 5: Risk Assessment Agent',
      icon: Sliders,
      purpose: 'Computes transparent 0–100 risk score breakdown using a multi-factor rubric.',
      inputs: ['Code overlap (0-30)', 'Dependency interaction (0-20)', 'API impact (0-20)', 'Security impact (0-20)', 'Test uncertainty (0-10)'],
      outputs: `Classifications: ${analysis.risk_summary.CRITICAL} Critical, ${analysis.risk_summary.HIGH} High, ${analysis.risk_summary.MEDIUM} Medium, ${analysis.risk_summary.LOW} Low`,
      whyNotSingleLLM: 'Provides explainable, transparent mathematical scoring instead of opaque black-box judgements.',
      sampleData: analysis.detected_risks[0]?.risk_score
    },
    {
      step: 6,
      name: 'Agent 6: Resolution Planning Agent',
      icon: CheckSquare,
      purpose: 'Generates specific, sequential resolution steps tailored to the actual files and functions in the repository.',
      inputs: ['Assessed risks', 'Repository file buffers', 'Function hierarchies'],
      outputs: 'Ordered action plans with concrete file references and rationale for human review',
      whyNotSingleLLM: 'Avoids generic "resolve the conflict" advice by pointing to exact file locations and middleware order.',
      sampleData: analysis.detected_risks[0]?.recommended_steps
    },
    {
      step: 7,
      name: 'Agent 7: Test Recommendation Agent',
      icon: Terminal,
      purpose: 'Detects the repository test harness (Jest, Vitest, pytest) and prescribes targeted CLI commands and test areas.',
      inputs: ['Project tooling manifests', 'Touched route handlers', 'Security test paths'],
      outputs: `Targeted test suites and commands for ${analysis.detected_risks[0]?.test_recommendation.tooling_detected}`,
      whyNotSingleLLM: 'Dynamically adapts to the repository tooling stack rather than defaulting to generic scripts.',
      sampleData: analysis.detected_risks[0]?.test_recommendation
    }
  ];

  const selectedAgent = agents[selectedAgentIndex];

  return (
    <div className="space-y-4">
      {/* Intro Header */}
      <div className="p-3.5 rounded-lg bg-[#161b22] border border-[#30363d] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div>
          <div className="font-semibold text-white font-mono">7-STAGE AGENT PIPELINE DAG</div>
          <div className="text-gray-400 text-[11px]">
            Modular multi-agent architecture with deterministic typed data exchange.
          </div>
        </div>
        <div className="font-mono text-[11px] text-gray-400 px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d]">
          STATE: PIPELINE EXECUTED
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Flow List (5 cols) */}
        <div className="lg:col-span-5 space-y-1.5">
          {agents.map((agent, idx) => {
            const Icon = agent.icon;
            const isSelected = selectedAgentIndex === idx;

            return (
              <div key={agent.step}>
                <button
                  onClick={() => setSelectedAgentIndex(idx)}
                  className={`w-full p-2.5 rounded text-left border transition-colors flex items-center justify-between gap-3 text-xs ${
                    isSelected
                      ? 'bg-[#21262d] border-blue-500 text-white'
                      : 'bg-[#161b22] border-[#30363d] hover:bg-[#1a1f27] text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="font-mono text-[10px] text-gray-500 w-5">
                      0{agent.step}
                    </div>
                    <div>
                      <div className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                        {agent.name.split(':')[1]?.trim() || agent.name}
                      </div>
                    </div>
                  </div>

                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                </button>

                {idx < agents.length - 1 && (
                  <div className="flex justify-center my-0.5">
                    <ArrowDown className="w-3 h-3 text-gray-600" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Final Node */}
          <div className="pt-2">
            <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="font-semibold text-white">Human Approval Gate</div>
                  <div className="text-[10px] text-gray-500 font-mono">Developer Signoff Required</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-gray-500">FINAL AUTHORITY</span>
            </div>
          </div>
        </div>

        {/* Right Column: Details (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
              <h4 className="font-semibold text-white font-mono">{selectedAgent.name}</h4>
              <span className="text-[11px] font-mono text-emerald-400">PASSED</span>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] text-gray-500 uppercase block">Purpose</span>
              <p className="text-gray-300 leading-relaxed bg-[#0d1117] p-2.5 rounded border border-[#30363d]">
                {selectedAgent.purpose}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] space-y-1">
                <span className="text-gray-500 uppercase block">Inputs</span>
                <ul className="text-gray-300 space-y-0.5">
                  {selectedAgent.inputs.map((inp) => (
                    <li key={inp} className="truncate">• {inp}</li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] space-y-1">
                <span className="text-gray-500 uppercase block">Output Artifact</span>
                <p className="text-gray-300 leading-relaxed">
                  {selectedAgent.outputs}
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] space-y-1">
              <span className="font-mono text-[10px] text-gray-500 uppercase block">
                Architecture Justification (Why not a single chatbot prompt):
              </span>
              <p className="text-gray-300 leading-relaxed font-sans text-xs">
                {selectedAgent.whyNotSingleLLM}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] text-gray-500 uppercase block">
                Sample Runtime JSON Output:
              </span>
              <pre className="p-3 rounded bg-[#0d1117] border border-[#30363d] font-mono text-[11px] text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-48">
                {JSON.stringify(selectedAgent.sampleData, null, 2)}
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
