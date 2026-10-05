import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { OverviewTab } from './components/OverviewTab';
import { RisksTab } from './components/RisksTab';
import { PullRequestAnalysisTab } from './components/PullRequestAnalysisTab';
import { BranchComparisonTab } from './components/BranchComparisonTab';
import { CommitAnalysisTab } from './components/CommitAnalysisTab';
import { ResolutionCenterTab } from './components/ResolutionCenterTab';
import { TestRecommendationsTab } from './components/TestRecommendationsTab';
import { CompatibilityReconciliationTab } from './components/CompatibilityReconciliationTab';
import { AgentPipelineTab } from './components/AgentPipelineTab';
import { SettingsTab } from './components/SettingsTab';
import { RiskDetailModal } from './components/RiskDetailModal';
import { ConnectModal } from './components/ConnectModal';
import { RepositoryAnalysis, ReviewStatus, IntegrationRisk } from './types';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { API_BASE } from './config';
import { fallbackDemoAnalysis } from './demoData';

export function App() {
  const [analysis, setAnalysis] = useState<RepositoryAnalysis | null>(fallbackDemoAnalysis);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isWarningDismissed, setIsWarningDismissed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedRiskId, setSelectedRiskId] = useState<string>('collision-semantic-auth-bypass');
  const [selectedRiskForDetail, setSelectedRiskForDetail] = useState<IntegrationRisk | null>(null);
  const [isRiskDetailModalOpen, setIsRiskDetailModalOpen] = useState<boolean>(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);

  // Load demo repository on initial page load
  useEffect(() => {
    loadDemoRepository();
  }, []);

  const loadDemoRepository = async (branchA?: string, branchB?: string) => {
    setIsLoading(true);
    setError(null);
    if (!analysis) {
      setAnalysis(fallbackDemoAnalysis);
      if (fallbackDemoAnalysis.detected_risks.length > 0) {
        setSelectedRiskId(fallbackDemoAnalysis.detected_risks[0].id);
      }
    }

    try {
      let url = `${API_BASE}/api/demo`;
      if (branchA && branchB) {
        url += `?branch_a=${encodeURIComponent(branchA)}&branch_b=${encodeURIComponent(branchB)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data: RepositoryAnalysis = await res.json();
        setAnalysis(data);
        if (data.detected_risks.length > 0) {
          setSelectedRiskId(data.detected_risks[0].id);
        }
      }
    } catch (err: any) {
      console.warn('Backend demo fetch failed, using built-in demo dataset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeRepo = async (repoUrl: string, token?: string, useDemo: boolean = false) => {
    setIsLoading(true);
    setError(null);
    setIsConnectModalOpen(false);

    if (useDemo || repoUrl === 'hyperlink-io/nexus-api') {
      setAnalysis(fallbackDemoAnalysis);
      if (fallbackDemoAnalysis.detected_risks.length > 0) {
        setSelectedRiskId(fallbackDemoAnalysis.detected_risks[0].id);
      }
      setActiveTab('overview');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_url: repoUrl,
          token: token,
          use_demo: false
        })
      });

      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        const detailMsg = errPayload?.detail?.error || (typeof errPayload?.detail === 'string' ? errPayload.detail : `HTTP ${res.status}: Repository analysis failed`);
        throw new Error(detailMsg);
      }
      const data: RepositoryAnalysis = await res.json();
      setAnalysis(data);
      if (data.detected_risks.length > 0) {
        setSelectedRiskId(data.detected_risks[0].id);
      }
      setActiveTab('overview');
    } catch (err: any) {
      const errorMsg = err.message || 'Error executing repository analysis.';
      setError(errorMsg);
      setAnalysis(fallbackDemoAnalysis);
      if (fallbackDemoAnalysis.detected_risks.length > 0) {
        setSelectedRiskId(fallbackDemoAnalysis.detected_risks[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewRisk = async (riskId: string, status: ReviewStatus, notes?: string) => {
    try {
      await fetch(`${API_BASE}/api/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          risk_id: riskId,
          status: status,
          notes: notes
        })
      });

      if (analysis) {
        setAnalysis({
          ...analysis,
          detected_risks: analysis.detected_risks.map((r) =>
            r.id === riskId ? { ...r, review_status: status, review_notes: notes } : r
          )
        });
      }
    } catch (err) {
      console.error('Failed to update review status', err);
    }
  };

  const handleSelectRiskFromOverview = (riskId: string) => {
    setSelectedRiskId(riskId);
    setActiveTab('risks');
  };

  const handleOpenResolutionFromRisks = (riskId: string) => {
    setSelectedRiskId(riskId);
    setActiveTab('resolutions');
  };

  const handleBranchCompare = (branchA: string, branchB: string) => {
    loadDemoRepository(branchA, branchB);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#18181B] flex flex-col font-sans selection:bg-[#BFDBFE] selection:text-[#18181B]">
      {/* Navigation Header */}
      <Navbar
        analysis={analysis}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        onLoadDemo={() => loadDemoRepository()}
        isLoading={isLoading}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1">
        {/* Error notification banner if any */}
        {error && (
          <div className="mb-4 p-3.5 rounded-[6px] bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#991B1B]">REPOSITORY ANALYSIS NOTICE</div>
                <div className="mt-0.5 text-[#7F1D1D] font-sans leading-relaxed">{error}</div>
              </div>
            </div>
            <button
              onClick={() => {
                setError(null);
                loadDemoRepository();
                setActiveTab('overview');
              }}
              className="px-3 py-1 rounded-[4px] bg-white hover:bg-[#FEE2E2] text-[#991B1B] font-medium text-xs border border-[#FECACA] cursor-pointer shrink-0"
            >
              Switch to Demo Mode
            </button>
          </div>
        )}

        {/* GitHub API warning/fallback banner */}
        {analysis?.warning_message && !isWarningDismissed && (
          <div className="mb-4 p-3 rounded-[6px] bg-[#FEFCE8] border border-[#FEF08A] text-[#854D0E] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
            <div className="flex items-start sm:items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#CA8A04] shrink-0 mt-0.5 sm:mt-0" />
              <div className="space-y-0.5">
                <div className="font-semibold text-[#854D0E]">GitHub API Notice</div>
                <div className="text-[11px] text-[#A16207] font-sans">{analysis.warning_message}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="px-2.5 py-1 rounded-[4px] bg-white hover:bg-[#FEF9C3] text-[#854D0E] font-medium text-xs border border-[#FEF08A] transition-colors"
              >
                Enter PAT Token
              </button>
              <button
                onClick={() => setIsWarningDismissed(true)}
                className="px-2 py-1 rounded-[4px] bg-[#FEF08A] text-[#854D0E] text-xs transition-colors hover:bg-[#FDE047]"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Global Loading Spinner */}
        {isLoading && !analysis && (
          <div className="flex flex-col items-center justify-center py-24 space-y-2">
            <div className="w-6 h-6 rounded-full border-2 border-[#D9D9D4] border-t-[#2563EB] animate-spin" />
            <p className="text-xs font-mono text-[#6B6B70]">
              Running integration analysis pipeline...
            </p>
          </div>
        )}

        {/* Tab views */}
        {activeTab === 'landing' && (
          <LandingPage
            onAnalyzeRepo={() => setIsConnectModalOpen(true)}
            onTryDemo={() => {
              loadDemoRepository();
              setActiveTab('overview');
            }}
            onGoToDashboard={() => setActiveTab('overview')}
            hasLoadedRepo={Boolean(analysis)}
          />
        )}

        {activeTab === 'settings' && (
          <div>
            <SettingsTab />
          </div>
        )}

        {analysis && activeTab !== 'landing' && activeTab !== 'settings' && (
          <div>
            {activeTab === 'overview' && (
              <OverviewTab
                analysis={analysis}
                onSelectRisk={handleSelectRiskFromOverview}
                onGoToComparison={() => setActiveTab('comparison')}
                onGoToPrAnalysis={() => setActiveTab('pull_requests')}
                onGoToPipeline={() => setActiveTab('pipeline')}
              />
            )}

            {activeTab === 'risks' && (
              <RisksTab
                risks={analysis.detected_risks}
                onReviewRisk={handleReviewRisk}
                onOpenResolution={handleOpenResolutionFromRisks}
                onOpenDetailModal={(risk) => {
                  setSelectedRiskForDetail(risk);
                  setIsRiskDetailModalOpen(true);
                }}
                selectedRiskId={selectedRiskId}
              />
            )}

            {activeTab === 'pull_requests' && (
              <PullRequestAnalysisTab
                analysis={analysis}
                onSelectRisk={handleSelectRiskFromOverview}
                onOpenResolution={handleOpenResolutionFromRisks}
              />
            )}

            {activeTab === 'reconciliation' && (
              <CompatibilityReconciliationTab analysis={analysis} />
            )}

            {activeTab === 'comparison' && (
              <BranchComparisonTab
                analysis={analysis}
                onCompareBranches={handleBranchCompare}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'commits' && (
              <CommitAnalysisTab analysis={analysis} />
            )}

            {activeTab === 'resolutions' && (
              <ResolutionCenterTab
                risks={analysis.detected_risks}
                selectedRiskId={selectedRiskId}
                onSelectRisk={setSelectedRiskId}
                onReviewRisk={handleReviewRisk}
              />
            )}

            {activeTab === 'tests' && (
              <TestRecommendationsTab
                risks={analysis.detected_risks}
                selectedRiskId={selectedRiskId}
                onSelectRisk={setSelectedRiskId}
              />
            )}

            {activeTab === 'pipeline' && (
              <AgentPipelineTab analysis={analysis} />
            )}
          </div>
        )}
      </main>

      {/* Connect Repo Modal */}
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onAnalyze={handleAnalyzeRepo}
        isLoading={isLoading}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-[#E2E2DE] bg-white py-3.5 text-xs text-[#6B6B70]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#18181B]">MergeMind</span>
            <span>— Cross-Branch Integration Advisor</span>
          </div>
          <div className="text-[11px] text-[#929298] font-mono">
            Human-in-the-Loop Integration Guardrails • Git verifies syntax; MergeMind verifies behavior.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
