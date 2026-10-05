import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { LLMSettings } from '../types';
import { API_BASE } from '../config';

export const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<LLMSettings | null>(null);
  const [provider, setProvider] = useState<string>('mock');
  const [model, setModel] = useState<string>('rule_engine_v1');
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
    } catch {
      // Local fallback
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
      setApiKey('');
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
    <div className="max-w-3xl mx-auto space-y-5 text-xs">
      {/* Header Context */}
      <div className="bg-white border border-[#E2E2DE] rounded-[8px] p-4 space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-[#18181B] tracking-tight">
            Analysis Engine Configuration
          </h1>
          <span className="px-2 py-0.5 rounded-[4px] bg-[#F1F1EF] border border-[#E2E2DE] font-mono text-[11px] text-[#18181B]">
            {provider === 'mock' ? 'Deterministic Engine Active' : `${provider} (${model})`}
          </span>
        </div>
        <p className="text-xs text-[#6B6B70] leading-relaxed">
          Configure the underlying reasoning engine. MergeMind operates with zero external dependencies in deterministic rule-based mode, or connects to external LLM providers for natural language explanations.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-[6px] bg-[#F0FDF4] border border-[#DCFCE7] text-[#166534] font-mono text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-[#16803C] shrink-0" />
          <span>Configuration saved successfully.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-[6px] bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] font-mono text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-[#E2E2DE] rounded-[8px] p-5 space-y-4">
        {/* Presets */}
        <div className="space-y-1.5">
          <label className="font-mono text-[11px] uppercase text-[#6B6B70] font-semibold">
            ENGINE PRESETS
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
            {[
              { id: 'mock', name: 'Rule Engine (Offline)', mod: 'rule_engine_v1', url: '' },
              { id: 'groq', name: 'Groq (Llama-3.1)', mod: 'llama-3.1-70b-versatile', url: 'https://api.groq.com/openai/v1' },
              { id: 'openai', name: 'OpenAI (GPT-4o)', mod: 'gpt-4o-mini', url: 'https://api.openai.com/v1' },
              { id: 'ollama', name: 'Local Ollama', mod: 'codellama', url: 'http://localhost:11434/v1' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectProviderPreset(p.id, p.mod, p.url)}
                className={`p-2.5 rounded-[6px] border text-left transition-colors ${
                  provider === p.id
                    ? 'bg-[#F1F1EF] border-[#18181B] text-[#18181B] font-semibold'
                    : 'bg-white border-[#E2E2DE] text-[#6B6B70] hover:bg-[#F8F8F6]'
                }`}
              >
                <div className="truncate">{p.name}</div>
                <div className="text-[10px] text-[#929298] truncate mt-0.5">{p.mod}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="space-y-1">
            <label className="font-mono text-[11px] text-[#6B6B70]">PROVIDER ID</label>
            <input
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              required
              className="w-full px-3 py-1.5 rounded-[6px] bg-[#F7F7F5] border border-[#E2E2DE] text-[#18181B] font-mono focus:outline-none focus:border-[#2563EB] focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[11px] text-[#6B6B70]">MODEL IDENTIFIER</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
              className="w-full px-3 py-1.5 rounded-[6px] bg-[#F7F7F5] border border-[#E2E2DE] text-[#18181B] font-mono focus:outline-none focus:border-[#2563EB] focus:bg-white"
            />
          </div>
        </div>

        <div className="space-y-1 pt-1">
          <label className="font-mono text-[11px] text-[#6B6B70]">API KEY (OPTIONAL FOR RULE ENGINE / OLLAMA)</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste API key (held in memory only)"
            className="w-full px-3 py-1.5 rounded-[6px] bg-[#F7F7F5] border border-[#E2E2DE] text-[#18181B] font-mono focus:outline-none focus:border-[#2563EB] focus:bg-white"
          />
        </div>

        <div className="space-y-1 pt-1">
          <label className="font-mono text-[11px] text-[#6B6B70]">CUSTOM BASE URL (OPTIONAL)</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="e.g. http://localhost:11434/v1"
            className="w-full px-3 py-1.5 rounded-[6px] bg-[#F7F7F5] border border-[#E2E2DE] text-[#18181B] font-mono focus:outline-none focus:border-[#2563EB] focus:bg-white"
          />
        </div>

        <div className="border-t border-[#E2E2DE] pt-3 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};
