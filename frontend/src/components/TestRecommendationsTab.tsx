import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Play, 
  RefreshCw,
  ShieldAlert,
  AlertCircle
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
    return <div className="p-8 text-center text-gray-500 font-mono text-xs">No active risks detected.</div>;
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
        stderr: err.message || 'Test execution unavailable in this environment. Please run commands locally in your terminal.',
        duration_ms: 0,
        is_sandboxed: true,
        disclaimer: 'Execution unavailable in current host sandbox.'
      });
    } finally {
      setIsRunningTests(false);
    }
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
        
        {/* Left 2 Cols: Commands & Reasoning */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Framework Banner */}
          <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span className="font-mono text-xs font-semibold text-white">
                  DETECTED TEST HARNESS
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#21262d] text-gray-300 border border-[#30363d]">
                {toolingName}
              </span>
            </div>
            <p className="text-xs text-gray-300 font-sans leading-relaxed">
              {rec.reasoning}
            </p>
          </div>

          {/* Recommended Commands List */}
          <div className="rounded-lg bg-[#161b22] border border-[#30363d] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#30363d] bg-[#0d1117] flex items-center justify-between text-xs font-mono">
              <span className="text-gray-300 font-semibold">RECOMMENDED VERIFICATION COMMANDS</span>
              <span className="text-gray-500 text-[11px]">Click Play to execute in sandboxed runner</span>
            </div>

            <div className="divide-y divide-[#30363d]/60">
              {commands.map((cmd, idx) => (
                <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono hover:bg-[#21262d]/40 transition-colors">
                  <div className="flex items-center gap-2 overflow-x-auto text-gray-200">
                    <span className="text-gray-500 select-none">$</span>
                    <code>{cmd}</code>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleExecuteSandboxedCommand(cmd)}
                      disabled={isRunningTests}
                      className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-emerald-400 border border-emerald-900/60 transition-colors flex items-center gap-1.5 text-xs disabled:opacity-50"
                      title="Run in isolated subprocess sandbox"
                    >
                      <Play className="w-3 h-3 fill-emerald-400" />
                      <span>Execute Sandbox</span>
                    </button>
                    <button
                      onClick={() => handleCopy(cmd)}
                      className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-gray-300 border border-[#30363d] transition-colors flex items-center gap-1 text-xs"
                      title="Copy command to clipboard"
                    >
                      {copiedCmd === cmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === cmd ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sandboxed Test Output Console (Honest Real Execution) */}
          <div className="rounded-lg bg-[#0d1117] border border-[#30363d] overflow-hidden font-mono text-xs">
            <div className="px-4 py-2.5 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                <span className="text-gray-400 ml-2 font-semibold">SANDBOX TERMINAL OUTPUT</span>
              </div>
              {testResult && (
                <span className={`px-2 py-0.5 rounded text-[10px] ${
                  testResult.status === 'completed' 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                    : testResult.status === 'sandboxed_unavailable'
                    ? 'bg-[#21262d] text-gray-400 border border-[#30363d]'
                    : 'bg-red-950 text-red-300 border border-red-800'
                }`}>
                  {testResult.status.toUpperCase()} ({testResult.duration_ms}ms)
                </span>
              )}
            </div>

            <div className="p-4 min-h-[160px] text-gray-300 whitespace-pre-wrap font-mono text-xs overflow-x-auto leading-relaxed">
              {isRunningTests ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Spawning isolated subprocess sandbox for: <code>{selectedCommandToRun}</code>...</span>
                </div>
              ) : testResult ? (
                <div className="space-y-2">
                  <div className="text-gray-500 text-[11px]">$ {testResult.command}</div>
                  {testResult.stdout && <div className="text-emerald-400">{testResult.stdout}</div>}
                  {testResult.stderr && (
                    <div className={testResult.status === 'sandboxed_unavailable' ? 'text-amber-300' : 'text-red-400'}>
                      {testResult.stderr}
                    </div>
                  )}
                  <div className="pt-2 text-[10px] text-gray-500 border-t border-[#30363d]/50">
                    Exit code: {testResult.exit_code ?? 'N/A'} • {testResult.disclaimer}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-xs">
                  Click <strong className="text-emerald-400">Execute Sandbox</strong> on any command above to trigger genuine subprocess execution.
                  <br />
                  <span className="text-[11px] text-gray-600 mt-1 block">
                    Security Policy: Strict command allowlist, process timeouts (10s), zero backend credentials exposed.
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Verification Checklist */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-white font-semibold">VERIFICATION AREAS ({checkedAreas.length}/{areas.length})</span>
            </div>
            <p className="text-[11px] text-gray-400 font-sans">
              Interactive sign-off checklist for engineering leads before approving merge:
            </p>

            <div className="space-y-2 pt-1">
              {areas.map((area, idx) => {
                const isChecked = checkedAreas.includes(area);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleArea(area)}
                    className={`p-2.5 rounded border transition-colors cursor-pointer flex items-start gap-2.5 text-xs ${
                      isChecked
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                        : 'bg-[#0d1117] border-[#30363d] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded shrink-0 mt-0.5 border flex items-center justify-center ${
                      isChecked ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-[#30363d]'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="leading-snug">{area}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-xs space-y-1.5 text-gray-400">
            <div className="flex items-center gap-2 text-gray-200 font-mono text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
              <span>Zero Fake Execution Policy</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
              MergeMind never outputs fabricated test passes. If the host environment lacks dependencies (e.g., node_modules or database containers), the runner reports runner availability honestly.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
