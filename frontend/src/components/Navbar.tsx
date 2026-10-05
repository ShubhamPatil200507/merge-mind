import React from 'react';
import { 
  GitBranch, 
  GitPullRequest, 
  GitCommit, 
  FolderGit2,
  RefreshCw, 
  Settings,
  Layers,
  ShieldAlert,
  Code2,
  CheckCircle2,
  Terminal,
  Cpu
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
    { id: 'overview', label: 'Overview', count: undefined },
    { id: 'risks', label: 'Risk Findings', count: analysis?.detected_risks.length },
    { id: 'pull_requests', label: 'Pull Requests', count: analysis?.pull_requests?.length },
    { id: 'reconciliation', label: 'Patches', count: analysis?.compatibility_patches?.length },
    { id: 'comparison', label: 'Branch Compare' },
    { id: 'commits', label: 'Commits', count: analysis?.commits?.length },
    { id: 'resolutions', label: 'Resolution Center' },
    { id: 'tests', label: 'Tests' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'settings', label: 'Settings' },
  ];

  const criticalCount = analysis?.risk_summary?.CRITICAL || 0;
  const highCount = analysis?.risk_summary?.HIGH || 0;
  const mediumCount = analysis?.risk_summary?.MEDIUM || 0;
  const lowCount = analysis?.risk_summary?.LOW || 0;

  return (
    <header className="bg-white border-b border-[#E2E2DE] sticky top-0 z-40 select-none">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        
        {/* Brand & Repository Context */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2 text-left group"
          >
            {/* Simple restrained geometric branch mark */}
            <div className="w-7 h-7 rounded-[6px] bg-[#18181B] flex items-center justify-center text-white">
              <GitBranch className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold tracking-tight text-[#18181B]">MergeMind</span>
              <span className="text-[11px] font-mono text-[#929298]">v1.0</span>
            </div>
          </button>

          <span className="text-[#D9D9D4] hidden sm:inline">/</span>

          {analysis && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] bg-[#F1F1EF] border border-[#E2E2DE] text-xs font-mono text-[#18181B]">
                <FolderGit2 className="w-3.5 h-3.5 text-[#6B6B70]" />
                <span className="font-medium truncate max-w-[200px] sm:max-w-none">{analysis.repository_name}</span>
                {analysis.is_demo ? (
                  <span className="ml-1 px-1.5 py-0.2 rounded-[4px] bg-[#FEF08A] text-[#854D0E] text-[10px] font-semibold">
                    demo
                  </span>
                ) : (
                  <span className="ml-1 px-1.5 py-0.2 rounded-[4px] bg-[#DCFCE7] text-[#166534] text-[10px] font-semibold">
                    live
                  </span>
                )}
              </div>

              {/* Status summary pill */}
              <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-[#6B6B70]">
                {criticalCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[11px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
                    {criticalCount} Critical
                  </span>
                )}
                {highCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#FFF7ED] border border-[#FFEDD5] text-[#9A3412] text-[11px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]"></span>
                    {highCount} High
                  </span>
                )}
                {mediumCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#FEFCE8] border border-[#FEF08A] text-[#854D0E] text-[11px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CA8A04]"></span>
                    {mediumCount} Medium
                  </span>
                )}
                {lowCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#F0FDF4] border border-[#DCFCE7] text-[#166534] text-[11px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
                    {lowCount} Low
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onLoadDemo}
            disabled={isLoading}
            className="px-2.5 py-1.5 text-xs font-medium rounded-[6px] bg-white hover:bg-[#F1F1EF] text-[#27272A] border border-[#D9D9D4] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Refresh repository analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#6B6B70] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Re-analyze</span>
          </button>
          <button
            onClick={onOpenConnectModal}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors flex items-center gap-1.5 shadow-none disabled:opacity-50"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Connect repo</span>
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#E2E2DE] overflow-x-auto">
        <nav className="flex space-x-1 py-1.5 text-xs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#F1F1EF] text-[#18181B] font-semibold'
                    : 'text-[#6B6B70] hover:text-[#18181B] hover:bg-[#F7F7F5]'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.2 rounded-[4px] text-[10px] font-mono ${
                      isActive
                        ? 'bg-white text-[#18181B] border border-[#D9D9D4]'
                        : 'bg-[#F1F1EF] text-[#6B6B70]'
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
