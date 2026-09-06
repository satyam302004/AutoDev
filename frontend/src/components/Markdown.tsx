import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function Markdown({ content }: { content: string }) {
  return (
    <div
      style={{
        fontFamily: 'var(--cth-font-ui)',
        fontSize: 'var(--cth-text-body-md)',
        lineHeight: '1.6',
        color: 'var(--cth-ink-900)',
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 style={{ fontFamily: 'var(--cth-font-display)', fontSize: 'var(--cth-text-display-md)', color: 'var(--cth-ink-900)', margin: '16px 0 8px' }}>{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontFamily: 'var(--cth-font-display)', fontSize: 'var(--cth-text-display-sm)', color: 'var(--cth-ink-900)', margin: '14px 0 6px' }}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontFamily: 'var(--cth-font-display)', fontSize: 'var(--cth-text-display-sm)', color: 'var(--cth-ink-700)', margin: '12px 0 4px' }}>{children}</h3>
          ),
          p: ({ children }) => (
            <p style={{ margin: '8px 0', color: 'var(--cth-ink-700)' }}>{children}</p>
          ),
          ul: ({ children }) => (
            <ul style={{ margin: '8px 0', paddingLeft: 20, listStyleType: 'square' }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ margin: '8px 0', paddingLeft: 20 }}>{children}</ol>
          ),
          li: ({ children }) => (
            <li style={{ margin: '2px 0', color: 'var(--cth-ink-700)' }}>{children}</li>
          ),
          a: ({ href, children }) => (
            <a href={href} style={{ color: 'var(--cth-sky)', textDecoration: 'underline' }}>{children}</a>
          ),
          code: ({ className, children }) => {
            const isBlock = className?.includes('language-')
            if (isBlock) {
              return (
                <pre
                  style={{
                    fontFamily: 'var(--cth-font-mono)',
                    fontSize: 'var(--cth-text-mono-sm)',
                    background: 'var(--cth-cream-200)',
                    boxShadow: 'var(--cth-panel-border-inset)',
                    padding: 'var(--cth-space-3)',
                    overflowX: 'auto',
                    margin: '8px 0',
                    color: 'var(--cth-ink-900)',
                  }}
                >
                  <code>{children}</code>
                </pre>
              )
            }
            return (
              <code
                style={{
                  fontFamily: 'var(--cth-font-mono)',
                  fontSize: 'var(--cth-text-mono-sm)',
                  background: 'var(--cth-cream-200)',
                  padding: '1px 4px',
                  color: 'var(--cth-ink-900)',
                }}
              >
                {children}
              </code>
            )
          },
          blockquote: ({ children }) => (
            <blockquote
              style={{
                borderLeft: '3px solid var(--cth-ink-300)',
                paddingLeft: 'var(--cth-space-3)',
                margin: '8px 0',
                color: 'var(--cth-ink-500)',
              }}
            >
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <table
              style={{
                borderCollapse: 'collapse',
                width: '100%',
                margin: '8px 0',
                fontFamily: 'var(--cth-font-mono)',
                fontSize: 'var(--cth-text-mono-sm)',
              }}
            >
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th
              style={{
                padding: '4px 8px',
                boxShadow: 'inset 0 0 0 1px var(--cth-ink-300)',
                background: 'var(--cth-cream-200)',
                fontFamily: 'var(--cth-font-display)',
                fontSize: 'var(--cth-text-display-sm)',
                color: 'var(--cth-ink-700)',
                textAlign: 'left',
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                padding: '4px 8px',
                boxShadow: 'inset 0 0 0 1px var(--cth-ink-100)',
                color: 'var(--cth-ink-700)',
              }}
            >
              {children}
            </td>
          ),
          hr: () => (
            <hr style={{ border: 'none', boxShadow: 'inset 0 -1px 0 var(--cth-ink-100)', margin: '12px 0' }} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
