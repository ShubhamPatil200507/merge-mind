import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  Download
} from 'lucide-react';
import { IntegrationRisk, ReviewStatus } from '../types';

interface ResolutionCenterTabProps {
  risks: IntegrationRisk[];
  selectedRiskId: string;
  onSelectRisk: (id: string) => void;
  onReviewRisk: (id: string, status: ReviewStatus, notes?: string) => void;
}

export const ResolutionCenterTab: React.FC<ResolutionCenterTabProps> = ({
  risks,
  selectedRiskId,
  onSelectRisk,
  onReviewRisk
}) => {
  const currentRisk = risks.find((r) => r.id === selectedRiskId) || risks[0];
  const [copied, setCopied] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>(currentRisk?.review_notes || '');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  if (!currentRisk) {
    return <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-8 text-center text-[#6B6B70] font-mono text-xs">No active risks detected.</div>;
  }

  const toggleStep = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) {
      setCompletedSteps(completedSteps.filter((s) => s !== stepNumber));
    } else {
      setCompletedSteps([...completedSteps, stepNumber]);
    }
  };

  const generateMarkdownReport = () => {
    return `# MergeMind Resolution Advisory: ${currentRisk.title}
**Risk Level**: ${currentRisk.risk_level} (Score: ${currentRisk.risk_score.total}/100)
**Branches**: ${currentRisk.branches.join(' ↔ ')}
**Status**: ${currentRisk.review_status}

## PROBLEM STATEMENT
${currentRisk.summary}

## AFFECTED FILES
${currentRisk.affected_files.map((f) => `- \`${f}\``).join('\n')}

## RECOMMENDED RESOLUTION PROCEDURE
${currentRisk.recommended_steps
  .map((s) => `${s.step_number}. **${s.action}**\n   ${s.detail}${s.file_reference ? ` (Reference: \`${s.file_reference}\`)` : ''}`)
  .join('\n\n')}
`;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNotes = () => {
    onReviewRisk(currentRisk.id, currentRisk.review_status, notes);
  };

  return (
    <div className="space-y-4">
      {/* Header Context */}
      <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <h1 className="text-base font-semibold text-[#18181B] tracking-tight">
            Resolution Center
          </h1>
          <p className="text-xs text-[#6B6B70] mt-0.5">
            Step-by-step developer checklists, documentation, and human review signoff controls for code integration.
          </p>
        </div>

        <button
          onClick={handleCopyMarkdown}
          className="px-3 py-1.5 rounded-[6px] bg-white border border-[#D9D9D4] text-[#27272A] hover:bg-[#F1F1EF] transition-colors flex items-center gap-1.5 font-mono text-xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#16803C]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Markdown' : 'Export Markdown Advisory'}</span>
        </button>
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
                    <span>{r.review_status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Resolution Procedure */}
        <div className="lg:col-span-8 bg-white border border-[#E2E2DE] rounded-[8px] p-5 space-y-5 text-xs">
          <div>
            <span className="font-mono text-[11px] text-[#6B6B70]">Resolution Plan</span>
            <h2 className="text-base font-semibold text-[#18181B] mt-0.5">{currentRisk.title}</h2>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <h3 className="font-mono text-xs font-semibold uppercase text-[#18181B]">
              Recommended Procedure Checklist
            </h3>
            <div className="space-y-2">
              {currentRisk.recommended_steps.map((s) => {
                const isDone = completedSteps.includes(s.step_number);
                return (
                  <div 
                    key={s.step_number} 
                    onClick={() => toggleStep(s.step_number)}
                    className={`p-3 rounded-[6px] border cursor-pointer transition-colors ${
                      isDone ? 'bg-[#F0FDF4] border-[#DCFCE7]' : 'bg-[#F7F7F5] border-[#E2E2DE] hover:bg-[#F1F1EF]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input 
                        type="checkbox" 
                        checked={isDone} 
                        onChange={() => {}} 
                        className="mt-0.5 rounded text-[#2563EB]"
                      />
                      <div>
                        <div className={`font-semibold ${isDone ? 'text-[#166534] line-through' : 'text-[#18181B]'}`}>
                          {s.step_number}. {s.action}
                        </div>
                        <div className="text-[11px] text-[#6B6B70] mt-0.5">{s.detail}</div>
                        {s.file_reference && (
                          <div className="mt-1 font-mono text-[10px] text-[#2563EB]">
                            Ref: {s.file_reference}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Developer Review Notes & Signoff */}
          <div className="border-t border-[#E2E2DE] pt-4 space-y-3">
            <h3 className="font-mono text-xs font-semibold uppercase text-[#18181B]">
              Developer Review & Audit Signoff
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record review notes, verification findings, or PR signoff rationale..."
              rows={3}
              className="w-full p-2.5 rounded-[6px] bg-[#F7F7F5] border border-[#E2E2DE] text-[#18181B] text-xs font-mono focus:outline-none focus:border-[#2563EB] focus:bg-white"
            />
            <div className="flex items-center justify-between">
              <button
                onClick={handleSaveNotes}
                className="px-3 py-1.5 rounded-[6px] bg-white border border-[#D9D9D4] text-[#27272A] hover:bg-[#F1F1EF] text-xs font-medium font-mono"
              >
                Save Review Notes
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onReviewRisk(currentRisk.id, 'REVIEWED', notes)}
                  className="px-3 py-1.5 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium"
                >
                  Approve / Mark Reviewed
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
