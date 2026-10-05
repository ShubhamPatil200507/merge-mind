import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Play, 
  RefreshCw
} from 'lucide-react';
import { IntegrationRisk, TestExecutionResult } from '../types';
import { API_BASE } from '../config';

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
  const [testResult, setTestResult] = useState<TestExecutionResult | null>(null);
  const [selectedCommandToRun, setSelectedCommandToRun] = useState<string>('');

  if (!currentRisk) {
    return <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-8 text-center text-[#6B6B70] font-mono text-xs">No active risks detected.</div>;
  }

  const rec = currentRisk.test_recommendation;
  const commands = rec.recommended_commands || rec.test_commands || ['npm test'];
  const areas = rec.verification_areas || rec.test_areas || [];
  const toolingName = rec.framework_detected || rec.tooling_detected || 'Detected Test Runner';

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

  const handleExecuteSandboxedCommand = async (command: string) => {
    setSelectedCommandToRun(command);
    setIsRunningTests(true);
    setTestResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/test/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to reach sandbox test runner`);
      }

      const data: TestExecutionResult = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        command,
        status: 'sandboxed_unavailable',
        exit_code: -1,
        stdout: '',
        stderr: err.message || 'Sandbox execution unavailable in current host. Run locally in terminal.',
        duration_ms: 0,
        is_sandboxed: true,
        disclaimer: 'Execution sandbox disabled in hosted environment.'
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Context */}
      <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <h1 className="text-base font-semibold text-[#18181B] tracking-tight">
            Targeted Regression Test Recommendations
          </h1>
          <p className="text-xs text-[#6B6B70] mt-0.5">
            Pinpoints exact test suites to execute for verified conflict resolution without requiring slow whole-repo test runs.
          </p>
        </div>
        <div className="font-mono text-xs text-[#6B6B70]">
          Runner: <strong className="text-[#18181B]">{toolingName}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Risk Index */}
        <div className="lg:col-span-4 bg-white border border-[#E2E2DE] rounded-[8px] overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-[#E2E2DE] bg-[#FAFAFA] font-mono text-xs font-semibold text-[#18181B]">
            TARGET RISK
          </div>
          <div className="divide-y divide-[#E2E2DE]">
            {risks.map((r) => {
              const isSelected = r.id === currentRisk.id;
              return (
                <div
                  key={r.id}
                  onClick={() => onSelectRisk(r.id)}
                  className={`p-3 cursor-pointer text-xs transition-colors ${
                    isSelected ? 'bg-[#F1F1EF] border-l-2 border-[#2563EB]' : 'hover:bg-[#F8F8F6]'
                  }`}
                >
                  <div className="font-medium text-[#18181B] truncate">{r.title}</div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-[#6B6B70]">
                    <span>{r.risk_level}</span>
                    <span>•</span>
                    <span>{r.collision_type}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Recommended Tests & Runner */}
        <div className="lg:col-span-8 bg-white border border-[#E2E2DE] rounded-[8px] p-5 space-y-5 text-xs">
          <div>
            <span className="font-mono text-[11px] text-[#6B6B70]">Verification Scope</span>
            <h2 className="text-base font-semibold text-[#18181B] mt-0.5">{currentRisk.title}</h2>
          </div>

          {/* Test Commands List */}
          <div className="space-y-2">
            <h3 className="font-mono text-xs font-semibold uppercase text-[#18181B]">
              Recommended CLI Test Commands
            </h3>
            <div className="space-y-2">
              {commands.map((cmd) => (
                <div key={cmd} className="bg-[#18181B] text-[#E2E2DE] rounded-[6px] p-3 flex items-center justify-between gap-3 font-mono text-xs">
                  <code className="truncate">{cmd}</code>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopy(cmd)}
                      className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] transition-colors flex items-center gap-1"
                    >
                      {copiedCmd === cmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === cmd ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => handleExecuteSandboxedCommand(cmd)}
                      disabled={isRunningTests}
                      className="px-2.5 py-1 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <Play className="w-3 h-3" />
                      <span>Run</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Areas Checklist */}
          {areas.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-mono text-xs font-semibold uppercase text-[#18181B]">
                Key Verification Checkpoints
              </h3>
              <div className="space-y-1.5">
                {areas.map((area) => {
                  const isChecked = checkedAreas.includes(area);
                  return (
                    <div
                      key={area}
                      onClick={() => toggleArea(area)}
                      className="flex items-center gap-2 p-2 rounded-[4px] hover:bg-[#F7F7F5] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-[#2563EB]"
                      />
                      <span className={`text-xs ${isChecked ? 'line-through text-[#929298]' : 'text-[#18181B]'}`}>
                        {area}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sandboxed Test Result Output */}
          {testResult && (
            <div className="border border-[#E2E2DE] rounded-[6px] overflow-hidden">
              <div className="bg-[#F1F1EF] px-3 py-2 border-b border-[#E2E2DE] flex items-center justify-between font-mono text-[11px]">
                <span>Status: <strong className={testResult.status === 'completed' ? 'text-[#16803C]' : 'text-[#DC2626]'}>{testResult.status}</strong></span>
                <span>Command: {testResult.command}</span>
              </div>
              <div className="p-3 bg-[#18181B] text-[#E2E2DE] font-mono text-xs overflow-x-auto">
                <pre><code>{testResult.stdout || testResult.stderr}</code></pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
