import React, { useState } from 'react';
import { 
  X, 
  FolderGit2, 
  Key, 
  ShieldCheck, 
  RefreshCw
} from 'lucide-react';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (repoUrl: string, token?: string, useDemo?: boolean) => void;
  isLoading: boolean;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  onAnalyze,
  isLoading
}) => {
  const [repoInput, setRepoInput] = useState<string>('hyperlink-io/nexus-api');
  const [tokenInput, setTokenInput] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;
    const isDemo = repoInput.trim() === 'hyperlink-io/nexus-api';
    onAnalyze(repoInput.trim(), tokenInput.trim() || undefined, isDemo);
  };

  const handleSelectPreset = (preset: string) => {
    setRepoInput(preset);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl bg-[#161b22] border border-[#30363d] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white font-mono">CONNECT REPOSITORY</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          {/* Repo Input */}
          <div className="space-y-1">
            <label className="font-mono text-gray-300 text-[11px]">
              REPOSITORY IDENTIFIER OR URL:
            </label>
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="owner/repo (e.g. facebook/react)"
              required
              className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-white text-xs font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Quick Presets */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-gray-500">PRESETS:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'hyperlink-io/nexus-api', val: 'hyperlink-io/nexus-api' },
                { name: 'expressjs/express', val: 'expressjs/express' },
                { name: 'facebook/react', val: 'facebook/react' }
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => handleSelectPreset(p.val)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors border ${
                    repoInput === p.val
                      ? 'bg-[#21262d] text-white border-blue-500'
                      : 'bg-[#0d1117] text-gray-400 border-[#30363d] hover:bg-[#21262d]'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* GitHub Token (Optional) */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-mono text-gray-300 text-[11px] flex items-center gap-1.5">
                <Key className="w-3 h-3 text-gray-400" />
                <span>PERSONAL ACCESS TOKEN (OPTIONAL):</span>
              </label>
              <span className="text-[10px] text-gray-500 font-mono">Bypasses 60 req/hr rate limit</span>
            </div>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxx"
              className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-white text-xs font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* GitHub Rate Limit & Security Notice */}
          <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] space-y-1 text-gray-400 text-[11px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-mono text-gray-300 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>API Rate Limit & Token Policy</span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">In-Memory Only</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
              Unauthenticated GitHub calls are limited by GitHub to 60 req/hr per IP. If you encounter a rate-limit error, provide a GitHub Personal Access Token (classic `ghp_` or fine-grained `github_pat_`) for 5,000 req/hr, or click <strong>Use Demo Repository</strong> for instant offline exploration.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#30363d]">
            <button
              type="button"
              onClick={() => {
                onAnalyze('hyperlink-io/nexus-api', undefined, true);
              }}
              className="px-3 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] text-blue-400 hover:text-blue-300 font-medium text-xs font-mono border border-blue-900/60 transition-colors"
            >
              Use Demo Repository
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] text-gray-300 font-medium text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !repoInput.trim()}
                className="px-3 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-medium text-xs font-mono flex items-center gap-1.5 disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                {isLoading ? 'Analyzing...' : 'Run Analysis'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
