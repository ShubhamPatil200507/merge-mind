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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-none">
      <div className="w-full max-w-lg rounded-[10px] bg-white border border-[#E2E2DE] shadow-lg overflow-hidden text-xs">
        
        {/* Header */}
        <div className="p-4 border-b border-[#E2E2DE] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-xs font-semibold text-[#18181B] font-mono uppercase">Connect GitHub Repository</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-[#929298] hover:text-[#18181B] hover:bg-[#F1F1EF] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Repo Input */}
          <div className="space-y-1">
            <label className="font-mono text-[#18181B] text-[11px] font-medium">
              REPOSITORY IDENTIFIER OR URL:
            </label>
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="owner/repo (e.g. facebook/react)"
              required
              className="w-full px-3 py-1.5 rounded-[6px] bg-[#F7F7F5] border border-[#E2E2DE] text-[#18181B] font-mono focus:outline-none focus:border-[#2563EB] focus:bg-white"
            />
          </div>

          {/* Presets */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#6B6B70]">PRESETS:</span>
            <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
              {[
                { name: 'hyperlink-io/nexus-api (Demo)', val: 'hyperlink-io/nexus-api' },
                { name: 'expressjs/express', val: 'expressjs/express' },
                { name: 'facebook/react', val: 'facebook/react' }
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => handleSelectPreset(p.val)}
                  className={`px-2 py-0.5 rounded-[4px] border transition-colors ${
                    repoInput === p.val
                      ? 'bg-[#18181B] text-white border-[#18181B]'
                      : 'bg-[#F1F1EF] text-[#6B6B70] border-[#E2E2DE] hover:bg-[#E2E2DE]'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* GitHub Token */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-mono text-[#18181B] text-[11px] font-medium flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#6B6B70]" />
                <span>GITHUB PERSONAL ACCESS TOKEN (OPTIONAL):</span>
              </label>
              <span className="text-[10px] text-[#929298] font-mono">Bypasses 60 req/hr limit</span>
            </div>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-1.5 rounded-[6px] bg-[#F7F7F5] border border-[#E2E2DE] text-[#18181B] font-mono focus:outline-none focus:border-[#2563EB] focus:bg-white"
            />
          </div>

          {/* Note */}
          <div className="p-3 rounded-[6px] bg-[#F7F7F5] border border-[#E2E2DE] space-y-1 text-[#6B6B70] text-[11px]">
            <div className="font-semibold text-[#18181B]">Rate limit policy</div>
            <p>
              GitHub limits unauthenticated calls to 60 requests/hr per IP. If you hit this limit on public repositories, provide a Personal Access Token or select the demo repository for instant exploration.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E2E2DE]">
            <button
              type="button"
              onClick={() => onAnalyze('hyperlink-io/nexus-api', undefined, true)}
              className="px-3 py-1.5 rounded-[6px] bg-white hover:bg-[#F1F1EF] text-[#2563EB] font-medium text-xs font-mono border border-[#BFDBFE] transition-colors"
            >
              Use Demo Repository
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-[6px] bg-white hover:bg-[#F1F1EF] text-[#27272A] border border-[#D9D9D4] font-medium text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !repoInput.trim()}
                className="px-3.5 py-1.5 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs font-mono flex items-center gap-1.5 disabled:opacity-50"
              >
                {isLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>{isLoading ? 'Analyzing...' : 'Run Analysis'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
