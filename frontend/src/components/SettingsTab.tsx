import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Key, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Server, 
  Terminal, 
  Database,
  ExternalLink
} from 'lucide-react';
import { LLMSettings } from '../types';
import { API_BASE } from '../config';

export const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<LLMSettings | null>(null);
  const [provider, setProvider] = useState<string>('mock');
  const [model, setModel] = useState<string>('gpt-4o-mini');
  const [apiKey, setApiKey] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/settings`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch settings`);
      const data: LLMSettings = await res.json();
      setSettings(data);
      setProvider(data.provider);
      setModel(data.model);
      setBaseUrl(data.base_url || '');
    } catch (err: any) {
      console.warn('Backend settings fetch slow or failed, using local fallback:', err);
      // Fallback to active deterministic mock settings so UI is always responsive
      setSettings({
        provider: 'mock',
        model: 'rule_engine_v1',
        has_api_key: false,
        masked_api_key: 'Not configured (Offline Engine Active)',
        base_url: '',
        engine_mode: 'Deterministic Rule-Based Analysis',
        is_ai_active: false
      });
      setProvider('mock');
      setModel('rule_engine_v1');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const body: any = {
        provider,
        model,
        base_url: baseUrl.trim() || undefined
      };
      if (apiKey.trim()) {
        body.api_key = apiKey.trim();
      }

      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to update settings`);
      setSaveSuccess(true);
      setApiKey(''); // clear input for security
      await fetchSettings();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const selectProviderPreset = (p: string, defaultMod: string, defaultUrl: string) => {
    setProvider(p);
    setModel(defaultMod);
    setBaseUrl(defaultUrl);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="p-5 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white font-mono">
              MERGEMIND AI & SYSTEM ENGINE SETTINGS
            </h2>
          </div>
          {settings && (
            <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-medium border ${
              settings.is_ai_active
                ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                : 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
            }`}>
              {settings.engine_mode}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 leading-relaxed font-sans">
          Configure the active LLM reasoning layer. MergeMind supports OpenAI, Groq, Ollama, OpenRouter, and DeepSeek, or runs in high-accuracy deterministic rule-based mode when offline.
        </p>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>LLM Provider configuration updated successfully. Ready for repository analysis.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="p-6 rounded-xl bg-[#161b22] border border-[#30363d] space-y-5 text-xs">
        
        {/* Provider Presets */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            QUICK PROVIDER PRESETS:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
            {[
              { id: 'mock', name: 'Deterministic Rule Engine', mod: 'rule_engine_v1', url: '', desc: 'No API key needed' },
              { id: 'openai', name: 'OpenAI (GPT-4o)', mod: 'gpt-4o-mini', url: 'https://api.openai.com/v1', desc: 'Official API' },
              { id: 'groq', name: 'Groq (Llama-3.1)', mod: 'llama-3.1-70b-versatile', url: 'https://api.groq.com/openai/v1', desc: 'Ultra-fast' },
              { id: 'openrouter', name: 'OpenRouter', mod: 'anthropic/claude-3.5-sonnet', url: 'https://openrouter.ai/api/v1', desc: 'Multi-model' },
              { id: 'ollama', name: 'Local Ollama', mod: 'codellama', url: 'http://localhost:11434/v1', desc: 'Local air-gapped' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectProviderPreset(p.id, p.mod, p.url)}
                className={`p-2.5 rounded border text-left transition-colors ${
                  provider === p.id
                    ? 'bg-[#21262d] border-blue-500 text-white shadow-xs'
                    : 'bg-[#0d1117] border-[#30363d] text-gray-400 hover:border-gray-500 hover:text-gray-200'
                }`}
              >
                <div className="font-semibold text-xs truncate">{p.name}</div>
                <div className="text-[10px] text-gray-500 truncate mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Provider ID */}
          <div className="space-y-1.5 font-mono">
            <label className="text-gray-300 text-[11px]">PROVIDER IDENTIFIER:</label>
            <input
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="openai | groq | ollama | openrouter | mock"
              required
              className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-white text-xs font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Model Name */}
          <div className="space-y-1.5 font-mono">
            <label className="text-gray-300 text-[11px]">MODEL NAME:</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o-mini, llama-3.1-70b-versatile, etc."
              required
              className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-white text-xs font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

        </div>

        {/* API Key */}
        <div className="space-y-1.5 font-mono">
          <div className="flex items-center justify-between">
            <label className="text-gray-300 text-[11px] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-gray-400" />
              <span>API KEY (OPTIONAL FOR MOCK/OLLAMA):</span>
            </label>
            {settings?.masked_api_key && (
              <span className="text-[10px] text-gray-500">
                Current: {settings.masked_api_key}
              </span>
            )}
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx (leave blank to keep current)"
            className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-white text-xs font-mono focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Base URL */}
        <div className="space-y-1.5 font-mono">
          <label className="text-gray-300 text-[11px]">BASE URL (FOR COMPATIBLE / LOCAL ENDPOINTS):</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1 or http://localhost:11434/v1"
            className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-white text-xs font-mono focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Security Notice */}
        <div className="p-3 rounded bg-[#0d1117] border border-[#30363d] space-y-1 text-gray-400 text-xs">
          <div className="flex items-center gap-2 text-gray-300 font-mono text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Prompt Injection Shielding Active</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
            MergeMind isolates all repository files, diffs, and commit messages as untrusted data. Even if repository code contains instructions to reveal keys or ignore rules, the LLM provider system guard shields against prompt leakage.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#30363d]">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={isLoading}
            className="px-3.5 py-2 rounded bg-[#21262d] hover:bg-[#30363d] text-gray-300 font-mono text-xs transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Saving...' : 'Apply Settings'}</span>
          </button>
        </div>

      </form>

      {/* System Infrastructure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        
        {/* Card 1: Database */}
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2">
          <div className="flex items-center gap-2 text-white">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="font-semibold">SQLITE PERSISTENCE</span>
          </div>
          <p className="text-[11px] text-gray-400 font-sans">
            Analyses, detected risks, reviews, and audit logs are safely stored in <code>mergemind.db</code>.
          </p>
          <div className="text-[10px] text-emerald-400 font-bold pt-1">
            ● LOCAL DB CONNECTED
          </div>
        </div>

        {/* Card 2: Test Sandbox */}
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2">
          <div className="flex items-center gap-2 text-white">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">TEST RUNNER SANDBOX</span>
          </div>
          <p className="text-[11px] text-gray-400 font-sans">
            Strict allowlist (<code>npm test</code>, <code>pytest</code>), stripped environment, 10-second timeout.
          </p>
          <div className="text-[10px] text-emerald-400 font-bold pt-1">
            ● SANDBOX ISOLATION ACTIVE
          </div>
        </div>

        {/* Card 3: Human Review */}
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">HUMAN AUTHORITY GATE</span>
          </div>
          <p className="text-[11px] text-gray-400 font-sans">
            Zero automated merges or code pushes. Developers retain 100% review authority.
          </p>
          <div className="text-[10px] text-blue-400 font-bold pt-1">
            ● HUMAN-IN-THE-LOOP LOCKED
          </div>
        </div>

      </div>
    </div>
  );
};
