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
import { RefreshCw, AlertCircle, AlertTriangle } from 'lucide-react';

export function App() {
  const [analysis, setAnalysis] = useState<RepositoryAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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
    try {
      let url = '/api/demo';
      if (branchA && branchB) {
        url += `?branch_a=${encodeURIComponent(branchA)}&branch_b=${encodeURIComponent(branchB)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch repository analysis`);
      const data: RepositoryAnalysis = await res.json();
      setAnalysis(data);
      if (data.detected_risks.length > 0) {
        setSelectedRiskId(data.detected_risks[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Could not connect to MergeMind backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeRepo = async (repoUrl: string, token?: string, useDemo: boolean = false) => {
    setIsLoading(true);
    setError(null);
    setIsConnectModalOpen(false);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_url: repoUrl,
          token: token,
          use_demo: useDemo
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
      setError(err.message || 'Error executing repository analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewRisk = async (riskId: string, status: ReviewStatus, notes?: string) => {
    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          risk_id: riskId,
          status: status,
          notes: notes
        })
      });

      // Update local state
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
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col font-sans selection:bg-blue-900 selection:text-white">
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
        {/* Error notification banner if any */}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-950/80 border border-red-700 text-red-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-red-300 text-sm">LIVE REPOSITORY ANALYSIS FAILED</div>
                <div className="mt-1 text-gray-300 font-sans leading-relaxed">{error}</div>
              </div>
            </div>
            <button
              onClick={() => {
                setError(null);
                loadDemoRepository();
              }}
              className="px-3.5 py-1.5 rounded bg-red-800 hover:bg-red-700 text-white font-medium text-xs transition-colors shrink-0 self-start sm:self-auto border border-red-600"
            >
              Switch to Demo Mode
            </button>
          </div>
        )}

        {/* GitHub API warning/fallback banner */}
        {analysis?.warning_message && !isWarningDismissed && (
          <div className="mb-4 p-3.5 rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
            <div className="flex items-start sm:items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              <div className="space-y-0.5">
                <div className="font-bold text-amber-300">GitHub API Notice</div>
                <div className="text-[11px] text-amber-200/90 font-sans">{analysis.warning_message}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-gray-200 font-medium text-xs border border-[#30363d] transition-colors"
              >
                Enter PAT Token
              </button>
              <button
                onClick={() => setIsWarningDismissed(true)}
                className="px-2 py-1 rounded bg-amber-900/40 hover:bg-amber-900/60 text-amber-300 text-xs transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Global Loading Spinner */}
        {isLoading && !analysis && (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-blue-500 animate-spin" />
            <p className="text-xs font-mono text-gray-400">
              Executing multi-agent integration analysis...
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
          <div className="animate-fadeIn">
            <SettingsTab />
          </div>
        )}

        {analysis && activeTab !== 'landing' && activeTab !== 'settings' && (
          <div className="animate-fadeIn">
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

      {/* Risk Deep-Dive Detail Modal */}
      <RiskDetailModal
        risk={selectedRiskForDetail}
        isOpen={isRiskDetailModalOpen}
        onClose={() => setIsRiskDetailModalOpen(false)}
        onReviewRisk={handleReviewRisk}
        onOpenResolution={(id) => {
          setIsRiskDetailModalOpen(false);
          handleOpenResolutionFromRisks(id);
        }}
      />

      {/* Connect Repo Modal */}
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onAnalyze={handleAnalyzeRepo}
        isLoading={isLoading}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-[#30363d] bg-[#161b22] py-4 text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-white">MergeMind</span>
            <span>— AI GitHub Integration Advisor</span>
          </div>
          <div className="text-[11px] text-gray-400">
            Human-in-the-Loop Integration Guardrails • Git detects syntax; MergeMind detects behavior.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
