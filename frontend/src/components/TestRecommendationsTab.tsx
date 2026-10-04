import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Play, 
  RefreshCw
} from 'lucide-react';
import { IntegrationRisk } from '../types';

interface TestRecommendationsTabProps {
  risks: IntegrationRisk[];
  selectedRiskId: string;
  onSelectRisk: (id: string) => void;
}

export const TestRecommendationsTab: React.FC<TestRecommendationsTabProps> = ({
  risks,
  selectedRiskId,
  onSelectRisk
}) => {
  const currentRisk = risks.find((r) => r.id === selectedRiskId) || risks[0];
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [checkedAreas, setCheckedAreas] = useState<string[]>([]);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);

  if (!currentRisk) {
    return <div className="p-8 text-center text-gray-500 font-mono text-xs">No active risks detected.</div>;
  }

  const rec = currentRisk.test_recommendation;

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const toggleArea = (area: string) => {
    if (checkedAreas.includes(area)) {
      setCheckedAreas(checkedAreas.filter((a) => a !== area));
    } else {
      setCheckedAreas([...checkedAreas, area]);
    }
  };

  const handleSimulateTests = () => {
    setIsRunningTests(true);
    setTestOutput(null);

    setTimeout(() => {
      setIsRunningTests(false);
      setTestOutput(`$ jest tests/auth.test.js tests/integration/auth_pipeline.test.js

PASS tests/auth.test.js (1.38s)
  authMiddleware
    [PASS] rejects unauthenticated requests with HTTP 401 (42ms)
    [PASS] validates bearer JWT and populates req.user (16ms)
    [PASS] rejects expired token signatures with HTTP 403 (11ms)

PASS tests/integration/auth_pipeline.test.js (2.05s)
  API Pipeline Order Verification
    [PASS] verifies authMiddleware mounts prior to handleRequest (84ms)
    [PASS] /v1/users protected route asserts active req.user context (60ms)

Test Suites: 2 passed, 2 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        3.43s
Exit Code:   0 (SUCCESS)`);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* Target Risk Selector Bar */}
      <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#30363d] flex items-center gap-2 overflow-x-auto text-xs font-mono">
        <span className="text-gray-500 whitespace-nowrap pl-1 text-[11px]">TARGET RISK:</span>
        {risks.map((r) => {
          const isSelected = r.id === currentRisk.id;
          return (
            <button
              key={r.id}
              onClick={() => onSelectRisk(r.id)}
              className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#21262d] text-white border border-gray-600 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${r.risk_level === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`} />
              <span className="max-w-[200px] truncate">{r.title}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Cols: Tooling & Commands */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-lg bg-[#161b22] border border-[#30363d] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#30363d]">
              <div>
                <div className="flex items-center gap-2 mb-1 font-mono text-[11px]">
                  <span className="px-1.5 py-0.2 rounded bg-[#0d1117] text-gray-400 border border-[#30363d]">
                    AGENT 7 TEST RECOMMENDATIONS
                  </span>
                  <span className="text-gray-400 font-mono">
                    Tooling: {rec.tooling_detected}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white">
                  Targeted Verification Commands for {currentRisk.branches[0]} ↔ {currentRisk.branches[1]}
                </h3>
              </div>

              <button
                onClick={handleSimulateTests}
                disabled={isRunningTests}
                className="px-3 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-mono font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isRunningTests ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3 h-3 fill-white" />
                )}
                {isRunningTests ? 'Running Suites...' : 'Run Test Suite'}
              </button>
            </div>

            {/* Rationale */}
            <div className="p-3 rounded bg-[#0d1117] border border-[#30363d] text-xs text-gray-300 space-y-1">
              <span className="text-gray-500 font-mono text-[10px] uppercase block">
                TOOLING INFERENCE:
              </span>
              <p className="leading-relaxed font-sans text-xs">
                {rec.reasoning}
              </p>
            </div>

            {/* Test Commands */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-gray-400 uppercase">
                RECOMMENDED CLI COMMANDS:
              </div>

              <div className="space-y-1.5">
                {rec.test_commands.map((cmd) => (
                  <div
                    key={cmd}
                    className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] flex items-center justify-between gap-2 font-mono text-xs text-gray-200"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-gray-600 select-none">$</span>
                      <span className="truncate">{cmd}</span>
                    </div>

                    <button
                      onClick={() => handleCopy(cmd)}
                      className="px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-gray-400 hover:text-white transition-colors text-[11px] flex items-center gap-1 shrink-0"
                    >
                      {copiedCmd === cmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedCmd === cmd ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Terminal Output */}
            {testOutput && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <span>TERMINAL EXECUTION LOG:</span>
                  <span className="text-emerald-400">EXIT: 0</span>
                </div>
                <pre className="p-3.5 rounded bg-black border border-[#30363d] font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {testOutput}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Test Checklist */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] space-y-3">
            <div className="border-b border-[#30363d] pb-2">
              <div className="text-xs font-mono font-semibold text-white">CHECKLIST</div>
              <div className="text-[11px] text-gray-400">Specific integration checkpoints</div>
            </div>

            <div className="space-y-2">
              {rec.test_areas.map((area, idx) => {
                const isChecked = checkedAreas.includes(area);

                return (
                  <div
                    key={idx}
                    onClick={() => toggleArea(area)}
                    className={`p-2.5 rounded border transition-colors cursor-pointer flex items-start gap-2.5 text-xs ${
                      isChecked
                        ? 'bg-[#161b22]/50 border-gray-800 text-gray-400'
                        : 'bg-[#0d1117] border-[#30363d] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="pt-0.5">
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-emerald-700 border-emerald-600 text-white'
                            : 'border-gray-600'
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                    <span className="leading-snug">{area}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-[11px] font-mono text-gray-500 border-t border-[#30363d] flex justify-between">
              <span>VERIFIED:</span>
              <span className="text-white font-bold">{checkedAreas.length} / {rec.test_areas.length}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
