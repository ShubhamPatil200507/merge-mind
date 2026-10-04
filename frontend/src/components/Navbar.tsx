import React from 'react';
import { 
  GitBranch, 
  GitPullRequest, 
  GitCommit, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  FolderGit2,
  Terminal,
  Code2,
  RefreshCw
} from 'lucide-react';
import { RepositoryAnalysis } from '../types';

interface NavbarProps {
  analysis: RepositoryAnalysis | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenConnectModal: () => void;
  onLoadDemo: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  analysis,
  activeTab,
  setActiveTab,
  onOpenConnectModal,
  onLoadDemo,
  isLoading
}) => {
  const tabs = [
    { id: 'landing', label: 'Product Tour', icon: Layers },
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'risks', label: 'Integration Risks', icon: ShieldAlert, count: analysis?.detected_risks.length },
    { id: 'pull_requests', label: 'Pull Requests', icon: GitPullRequest, count: analysis?.pull_requests?.length },
    { id: 'reconciliation', label: 'Reconciliation Patches', icon: Code2, count: analysis?.compatibility_patches?.length },
    { id: 'comparison', label: 'Branch Comparison', icon: GitBranch },
    { id: 'commits', label: 'Commit Graph', icon: GitCommit },
    { id: 'resolutions', label: 'Resolution Center', icon: CheckCircle2 },
    { id: 'tests', label: 'Test Recommendations', icon: Terminal },
    { id: 'pipeline', label: 'Agent Pipeline', icon: Cpu },
  ];

  const criticalCount = analysis?.risk_summary?.CRITICAL || 0;
  const highCount = analysis?.risk_summary?.HIGH || 0;
  const mediumCount = analysis?.risk_summary?.MEDIUM || 0;
  const lowCount = analysis?.risk_summary?.LOW || 0;

  return (
    <header className="bg-[#161b22] border-b border-[#30363d] sticky top-0 z-40 select-none">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Product Meta */}
          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center space-x-3 cursor-pointer group"
            title="Return to Product Tour & Vision"
          >
            <div className="w-8 h-8 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center text-gray-200 group-hover:border-blue-500 transition-colors">
              <GitBranch className="w-4 h-4 text-blue-400 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-semibold tracking-tight text-white font-mono group-hover:text-blue-400 transition-colors">MergeMind</span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[#21262d] text-gray-300 border border-[#30363d]">
                  advisor v1.0
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans">
                Behavioral conflict detection & code reconciliation for parallel GitHub repositories
              </p>
            </div>
          </div>

          {/* Repo Info & Risk Metrics */}
          {analysis && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d] text-gray-300">
                <FolderGit2 className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-white font-medium">{analysis.repository_name}</span>
              </div>

              <div className="hidden lg:flex items-center gap-2.5 px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d] text-gray-400">
                <span>{analysis.branches.length} branches</span>
                <span className="text-gray-600">|</span>
                <span>{analysis.commits.length} commits</span>
                <span className="text-gray-600">|</span>
                <span>{analysis.pull_requests.length} PRs</span>
              </div>

              {/* Status pills */}
              <div className="flex items-center gap-1">
                {criticalCount > 0 && (
                  <span className="px-2 py-0.5 rounded text-[11px] bg-red-950/70 border border-red-800 text-red-300 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    {criticalCount} Critical
                  </span>
                )}
                {highCount > 0 && (
                  <span className="px-2 py-0.5 rounded text-[11px] bg-orange-950/70 border border-orange-800 text-orange-300 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                    {highCount} High
                  </span>
                )}
                {mediumCount > 0 && (
                  <span className="px-2 py-0.5 rounded text-[11px] bg-amber-950/60 border border-amber-800/80 text-amber-300 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {mediumCount} Medium
                  </span>
                )}
                {lowCount > 0 && (
                  <span className="px-2 py-0.5 rounded text-[11px] bg-[#161b22] border border-[#30363d] text-gray-300 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {lowCount} Low
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onLoadDemo}
              disabled={isLoading}
              className="px-2.5 py-1 text-xs font-medium rounded bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-[#30363d] transition-colors flex items-center gap-1.5 disabled:opacity-50"
              title="Re-execute multi-agent analysis on repository"
            >
              <RefreshCw className={`w-3 h-3 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
              Re-Analyze
            </button>
            <button
              onClick={onOpenConnectModal}
              disabled={isLoading}
              className="px-2.5 py-1 text-xs font-medium rounded bg-[#238636] hover:bg-[#2ea043] text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <FolderGit2 className="w-3 h-3 text-white" />
              Connect Repo
            </button>
          </div>
        </div>

        {/* Warning notification banner if any */}
        {analysis?.warning_message && (
          <div className="mt-2 px-3 py-1.5 rounded bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2 font-mono">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>{analysis.warning_message}</span>
          </div>
        )}
      </div>

      {/* Tabs Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#30363d]">
        <nav className="flex space-x-1 overflow-x-auto py-1 text-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#21262d] text-white border-b-2 border-blue-500 rounded-b-none'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#21262d]/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isActive
                        ? 'bg-blue-900/60 text-blue-200 border border-blue-700/60'
                        : 'bg-[#21262d] text-gray-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
