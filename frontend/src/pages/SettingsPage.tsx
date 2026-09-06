import { useState, useEffect } from 'react';
import { PixelPanel } from '../components/ui/PixelPanel';
import { PixelButton } from '../components/ui/PixelButton';
import { SpritePortrait } from '../components/SpritePortrait';
import { useToast } from '../components/Toasts';

type SettingsSection = 'general' | 'providers' | 'agents' | 'about';

interface ProviderOption {
  id: string;
  name: string;
}

const PROVIDERS: ProviderOption[] = [
  { id: 'opencode', name: 'OpenCode Zen' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'gemini', name: 'Gemini' },
  { id: 'ollama', name: 'Ollama (local)' },
];

const MODELS: Record<string, { id: string; name: string }[]> = {
  opencode: [
    { id: 'nemotron-3.5-lightning-free', name: 'Nemotron 3.5 Lightning' },
    { id: 'big-pickle', name: 'Big Pickle' },
    { id: 'mimo-v2.5-free', name: 'MIMO v2.5' },
    { id: 'nemotron-3-ultra-free', name: 'Nemotron 3 Ultra' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'o3-mini', name: 'o3-mini' },
  ],
  gemini: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  ],
  ollama: [
    { id: 'qwen2.5:7b', name: 'Qwen 2.5 7B' },
    { id: 'llama3.1:8b', name: 'Llama 3.1 8B' },
    { id: 'codellama:7b', name: 'CodeLlama 7B' },
  ],
};

const SECTIONS: { id: SettingsSection; label: string }[] = [
  { id: 'general', label: 'GENERAL' },
  { id: 'providers', label: 'PROVIDERS & MODELS' },
  { id: 'agents', label: 'AGENTS' },
  { id: 'about', label: 'ABOUT' },
];

export function SettingsPage() {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [provider, setProvider] = useState('opencode');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('nemotron-3.5-lightning-free');
  const [baseUrl, setBaseUrl] = useState('');
  const [appName, setAppName] = useState('AutoDEV');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setProvider(data.llm_provider || 'opencode');
        setModel(data.model_main || 'nemotron-3.5-lightning-free');
        setBaseUrl(data.base_url || '');
      }
    } catch {
      // settings not configured yet
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const effectiveBaseUrl = provider === 'opencode'
        ? (baseUrl || 'https://opencode.ai/zen/v1')
        : baseUrl;
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          llm_provider: provider === 'opencode' ? 'openai' : provider,
          api_key: apiKey,
          base_url: effectiveBaseUrl,
          model_main: model,
        }),
      });
      if (res.ok) {
        toast('API key is set now');
      } else {
        toast('Failed to save API key', 'error');
      }
    } catch {
      toast('Failed to save API key', 'error');
    }
    setSaving(false);
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 40px)' }}>
      {/* Left nav */}
      <div
        style={{
          width: 160,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'inset -1px 0 0 var(--cth-ink-300)',
          paddingTop: 'var(--cth-space-2)',
          paddingBottom: 'var(--cth-space-2)',
          background: 'var(--cth-cream-200)',
        }}
      >
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              display: 'block',
              width: '100%',
              padding: 'var(--cth-space-2) var(--cth-space-3)',
              background: activeSection === section.id ? 'var(--cth-ink-900)' : 'transparent',
              color: activeSection === section.id ? 'var(--cth-cream-50)' : 'var(--cth-ink-700)',
              border: 'none',
              boxShadow: activeSection === section.id ? 'inset 3px 0 0 var(--cth-lemon)' : 'inset 3px 0 0 transparent',
              fontFamily: 'var(--cth-font-display)',
              fontSize: 'var(--cth-text-display-sm)',
              lineHeight: '12px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.1s steps(2, end)',
            }}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Right content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 'var(--cth-space-5) var(--cth-space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--cth-space-5)',
        }}
      >
        {activeSection === 'general' && (
          <>
            <SectionHead>GENERAL</SectionHead>
            <PixelPanel variant="default" title="APPLICATION">
              <div style={{ padding: 'var(--cth-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--cth-space-4)' }}>
                <Field label="App Name">
                  <input
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </Field>
              </div>
            </PixelPanel>
          </>
        )}

        {activeSection === 'providers' && (
          <>
            <SectionHead>PROVIDERS & MODELS</SectionHead>
            <PixelPanel variant="default" title="LLM CONFIGURATION">
              <div style={{ padding: 'var(--cth-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--cth-space-4)' }}>
                <Field label="Provider">
                  <select
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value);
                      const models = MODELS[e.target.value];
                      if (models?.length) setModel(models[0].id);
                    }}
                    style={{ width: '100%' }}
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="API Key">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    style={{ width: '100%' }}
                  />
                </Field>

                <Field label="Model">
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    {(MODELS[provider] ?? []).map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </Field>

                {(provider === 'openai' || provider === 'opencode') && (
                  <Field label="Base URL (optional)">
                    <input
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder={provider === 'opencode' ? 'https://opencode.ai/zen/v1' : 'https://api.openai.com/v1'}
                      style={{ width: '100%' }}
                    />
                  </Field>
                )}

                {provider === 'ollama' && (
                  <Field label="Ollama URL">
                    <input
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="http://localhost:11434/v1"
                      style={{ width: '100%' }}
                    />
                  </Field>
                )}
              </div>
            </PixelPanel>
          </>
        )}

        {activeSection === 'agents' && (
          <>
            <SectionHead>AGENTS</SectionHead>
            <PixelPanel variant="default" title="AGENT ROSTER">
              <div style={{ padding: 'var(--cth-space-4)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--cth-space-3)' }}>
                {['project_manager', 'requirements', 'architecture', 'planning', 'backend', 'frontend', 'qa', 'documentation', 'report'].map((key) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--cth-space-2)',
                      padding: 'var(--cth-space-2)',
                      boxShadow: 'var(--cth-panel-border-inset)',
                      background: 'var(--cth-cream-200)',
                    }}
                  >
                    <SpritePortrait agentKey={key} size={24} />
                    <span style={{ fontFamily: 'var(--cth-font-display)', fontSize: 8, color: 'var(--cth-ink-700)', textTransform: 'uppercase' }}>
                      {key}
                    </span>
                  </div>
                ))}
              </div>
            </PixelPanel>
          </>
        )}

        {activeSection === 'about' && (
          <>
            <SectionHead>ABOUT</SectionHead>
            <PixelPanel variant="default" title="VERSION">
              <div style={{ padding: 'var(--cth-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--cth-space-2)' }}>
                <div style={{ fontFamily: 'var(--cth-font-mono)', fontSize: 'var(--cth-text-mono-md)', color: 'var(--cth-ink-700)' }}>
                  AutoDEV v0.3.0
                </div>
                <div style={{ fontFamily: 'var(--cth-font-ui)', fontSize: 'var(--cth-text-body-sm)', color: 'var(--cth-ink-500)' }}>
                  Multi-agent AI pipeline for software development.
                </div>
              </div>
            </PixelPanel>
          </>
        )}

        {/* Save button */}
        <div style={{ display: 'flex', gap: 'var(--cth-space-3)', alignItems: 'center' }}>
          <PixelButton onClick={handleSave} disabled={saving}>
            {saving ? 'SAVING...' : 'SAVE SETTINGS'}
          </PixelButton>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--cth-font-display)',
        fontSize: 'var(--cth-text-display-sm)',
        lineHeight: '12px',
        color: 'var(--cth-ink-500)',
        textTransform: 'uppercase',
        marginBottom: 'var(--cth-space-3)',
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cth-space-1)' }}>
      <span
        style={{
          fontFamily: 'var(--cth-font-display)',
          fontSize: 8,
          lineHeight: '12px',
          color: 'var(--cth-ink-500)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
