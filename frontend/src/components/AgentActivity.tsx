import { useState } from 'react';
import { agentAccents, type AgentName } from '../design/tokens';
import { AgentAvatar } from './AgentAvatar';
import { PixelPanel } from './ui/PixelPanel';

interface ActivityStep {
  id: string;
  tool?: string;
  action: string;
  result?: string;
  timestamp: string;
  duration_ms?: number;
  tokens?: { input: number; output: number };
}

interface AgentActivityProps {
  agent: AgentName;
  steps: ActivityStep[];
}

const toolIcons: Record<string, string> = {
  Read: '\uD83D\uDCC4',
  Edit: '\u270F\uFE0F',
  Write: '\uD83D\uDCDD',
  Bash: '\uD83D\uDCBB',
  WebFetch: '\uD83C\uDF10',
  WebSearch: '\uD83D\uDD0D',
  Grep: '\uD83D\uDD0E',
  Glob: '\uD83D\uDCC1',
};

export function AgentActivity({
  agent,
  steps,
}: AgentActivityProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const accent = agentAccents[agent];

  const totalTokens = steps.reduce(
    (acc, step) => ({
      input: acc.input + (step.tokens?.input || 0),
      output: acc.output + (step.tokens?.output || 0),
    }),
    { input: 0, output: 0 }
  );

  const totalDuration = steps.reduce(
    (acc, step) => acc + (step.duration_ms || 0),
    0
  );

  return (
    <PixelPanel variant="default">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cth-space-3)', padding: 'var(--cth-space-4)' }}>
        <AgentAvatar agent={agent} size={32} />
        <div>
          <div style={{ fontFamily: 'var(--cth-font-ui)', fontSize: 'var(--cth-text-body-lg)', color: 'var(--cth-ink-900)' }}>
            {agent.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cth-space-2)', fontFamily: 'var(--cth-font-mono)', fontSize: 10, color: 'var(--cth-ink-500)' }}>
            <span>{steps.length} steps</span>
            <span>\u00B7</span>
            <span>{totalDuration}ms</span>
            <span>\u00B7</span>
            <span>{totalTokens.input + totalTokens.output} tokens</span>
          </div>
        </div>
      </div>

      {/* Steps timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cth-space-2)', padding: '0 var(--cth-space-4) var(--cth-space-4)' }}>
        {steps.map((step, index) => (
          <div
            key={step.id}
            style={{
              padding: 'var(--cth-space-2)',
              background: 'var(--cth-cream-50)',
              boxShadow: 'inset 0 0 0 1px var(--cth-ink-700)',
              cursor: 'pointer',
              transition: 'all 0.1s steps(2, end)',
            }}
            onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'var(--cth-cream-200)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'var(--cth-cream-50)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cth-space-2)' }}>
              <span
                style={{
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--cth-font-display)',
                  fontSize: 8,
                  boxShadow: 'inset 0 0 0 1px var(--cth-ink-900)',
                  background: accent,
                  color: 'var(--cth-cream-50)',
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </span>
              {step.tool && <span style={{ fontSize: 14 }}>{toolIcons[step.tool] || '\uD83D\uDD27'}</span>}
              <span style={{ flex: 1, fontFamily: 'var(--cth-font-ui)', fontSize: 10, color: 'var(--cth-ink-900)' }}>{step.action}</span>
              {step.duration_ms && (
                <span style={{ fontFamily: 'var(--cth-font-mono)', fontSize: 10, color: 'var(--cth-ink-500)' }}>{step.duration_ms}ms</span>
              )}
            </div>
            {expandedStep === step.id && step.result && (
              <div style={{ marginTop: 8, paddingTop: 8, boxShadow: 'inset 0 1px 0 var(--cth-ink-100)' }}>
                <pre
                  style={{
                    fontFamily: 'var(--cth-font-mono)',
                    fontSize: 10,
                    background: 'var(--cth-paper-100)',
                    padding: 'var(--cth-space-2)',
                    boxShadow: 'var(--cth-panel-border-inset)',
                    overflowX: 'auto',
                    color: 'var(--cth-ink-900)',
                  }}
                >
                  {step.result}
                </pre>
                {step.tokens && (
                  <div style={{ marginTop: 4, fontFamily: 'var(--cth-font-mono)', fontSize: 8, color: 'var(--cth-ink-500)' }}>
                    Tokens: {step.tokens.input} in / {step.tokens.output} out
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </PixelPanel>
  );
}
