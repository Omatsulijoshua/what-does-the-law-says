import { cleanEmDashes } from '../utils/textFormatting.js';

function renderInlineMarkdown(text, keyPrefix = 'inline') {
  if (!text) return null;

  const clean = cleanEmDashes(text);
  const tokenRegex = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*[^*]+\*|_[^_]+_)/g;
  const parts = clean.split(tokenRegex);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (!part) return null;

    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      const inner = part.slice(2, -2);
      return (
        <strong key={key} className="chat-bold" style={{ color: 'var(--gold-primary)', fontWeight: 600 }}>
          {inner}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const code = part.slice(1, -1);
      return (
        <code key={key} className="chat-inline-code" style={{
          backgroundColor: 'rgba(22, 101, 52, 0.1)',
          color: 'var(--green-accent)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '0.88em'
        }}>
          {code}
        </code>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={key}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="chat-link"
          style={{ color: 'var(--green-accent)', textDecoration: 'underline' }}
        >
          {linkMatch[1]}
        </a>
      );
    }

    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      const inner = part.slice(1, -1);
      return <em key={key}>{inner}</em>;
    }

    return part;
  });
}

/**
 * Block parser that groups and converts markdown lines into:
 * - Headings (stripping all '#' hashtags completely)
 * - Grouped Unordered Lists (<ul><li>...</li></ul>)
 * - Grouped Ordered Lists (<ol><li>...</li></ol>)
 * - Blockquotes (<blockquote>...</blockquote>)
 * - Code blocks (<pre><code>...</code></pre>)
 * - Horizontal rules (<hr />)
 * - Clean paragraphs (<p>)
 */
export function MarkdownRenderer({ content }) {
  if (!content || typeof content !== 'string') return null;

  const rawLines = cleanEmDashes(content).split('\n');
  const blocks = [];
  let currentList = null;
  let currentBlockquote = [];
  let currentCodeBlock = null;

  const flushList = () => {
    if (currentList) {
      blocks.push({ ...currentList });
      currentList = null;
    }
  };

  const flushBlockquote = () => {
    if (currentBlockquote.length > 0) {
      blocks.push({ type: 'blockquote', lines: [...currentBlockquote] });
      currentBlockquote = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Code blocks ```
    if (trimmed.startsWith('```')) {
      flushList();
      flushBlockquote();
      if (currentCodeBlock) {
        blocks.push({ type: 'codeblock', ...currentCodeBlock });
        currentCodeBlock = null;
      } else {
        const lang = trimmed.slice(3).trim();
        currentCodeBlock = { lang, lines: [] };
      }
      continue;
    }

    if (currentCodeBlock) {
      currentCodeBlock.lines.push(line);
      continue;
    }

    // 2. Blockquotes >
    if (trimmed.startsWith('>')) {
      flushList();
      currentBlockquote.push(trimmed.replace(/^>\s?/, ''));
      continue;
    } else {
      flushBlockquote();
    }

    // 3. Horizontal rules (---, ***, ___)
    if (/^(---+|\*{3,}|_{3,})$/.test(trimmed)) {
      flushList();
      blocks.push({ type: 'hr' });
      continue;
    }

    // 4. Hashtag Headings (#, ##, ###, ####, #####, ######)
    // Strip hashtags entirely and capture the heading level and clean text!
    const headingMatch = trimmed.match(/^(#{1,6})\s*(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      blocks.push({ type: 'heading', level, text: headingText });
      continue;
    }

    // 5. Unordered List Items (*, -, +, •)
    const ulMatch = line.match(/^(\s*)([•\-*+])\s+(.+)$/);
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[3]);
      continue;
    }

    // 6. Ordered List Items (1., 2., etc.)
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[3]);
      continue;
    }

    // 7. Empty line
    if (trimmed === '') {
      flushList();
      blocks.push({ type: 'spacer' });
      continue;
    }

    // 8. Regular text paragraph
    flushList();
    blocks.push({ type: 'paragraph', text: trimmed });
  }

  flushList();
  flushBlockquote();
  if (currentCodeBlock) {
    blocks.push({ type: 'codeblock', ...currentCodeBlock });
  }

  return (
    <div className="chat-markdown-body" style={{ lineHeight: '1.68' }}>
      {blocks.map((block, bIdx) => {
        const blockKey = `block-${bIdx}`;

        if (block.type === 'heading') {
          if (block.level === 1) {
            return (
              <h2
                key={blockKey}
                className="chat-h1"
                style={{
                  margin: '18px 0 10px',
                  fontSize: '1.18rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '0.2px'
                }}
              >
                {renderInlineMarkdown(block.text, blockKey)}
              </h2>
            );
          }
          if (block.level === 2) {
            return (
              <h3
                key={blockKey}
                className="chat-h2"
                style={{
                  margin: '16px 0 8px',
                  fontSize: '1.08rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '0.2px'
                }}
              >
                {renderInlineMarkdown(block.text, blockKey)}
              </h3>
            );
          }
          return (
            <h4
              key={blockKey}
              className="chat-h3"
              style={{
                margin: '14px 0 6px',
                fontSize: '0.96rem',
                fontWeight: 700,
                color: 'var(--green-accent)',
                letterSpacing: '0.2px'
              }}
            >
              {renderInlineMarkdown(block.text, blockKey)}
            </h4>
          );
        }

        if (block.type === 'ul') {
          return (
            <ul key={blockKey} className="chat-ul" style={{ margin: '6px 0 10px 22px', paddingLeft: 0, listStyleType: 'disc' }}>
              {block.items.map((item, iIdx) => (
                <li key={`${blockKey}-item-${iIdx}`} style={{ margin: '4px 0', lineHeight: '1.6' }}>
                  {renderInlineMarkdown(item, `${blockKey}-${iIdx}`)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={blockKey} className="chat-ol" style={{ margin: '6px 0 10px 22px', paddingLeft: 0, listStyleType: 'decimal' }}>
              {block.items.map((item, iIdx) => (
                <li key={`${blockKey}-item-${iIdx}`} style={{ margin: '4px 0', lineHeight: '1.6' }}>
                  {renderInlineMarkdown(item, `${blockKey}-${iIdx}`)}
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === 'blockquote') {
          return (
            <blockquote
              key={blockKey}
              className="chat-blockquote"
              style={{
                borderLeft: '3px solid var(--gold-primary)',
                paddingLeft: '12px',
                margin: '12px 0',
                fontStyle: 'italic',
                color: 'var(--text-secondary)'
              }}
            >
              {block.lines.map((l, lIdx) => (
                <p key={`${blockKey}-line-${lIdx}`} style={{ margin: '4px 0' }}>
                  {renderInlineMarkdown(l, `${blockKey}-${lIdx}`)}
                </p>
              ))}
            </blockquote>
          );
        }

        if (block.type === 'codeblock') {
          return (
            <pre
              key={blockKey}
              className="chat-codeblock"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                padding: '12px 16px',
                borderRadius: '8px',
                overflowX: 'auto',
                margin: '12px 0',
                fontSize: '0.86rem',
                border: '1px solid var(--border-light)'
              }}
            >
              <code>{block.lines.join('\n')}</code>
            </pre>
          );
        }

        if (block.type === 'hr') {
          return (
            <hr
              key={blockKey}
              style={{
                border: 'none',
                borderTop: '1px solid var(--border-light)',
                margin: '14px 0'
              }}
            />
          );
        }

        if (block.type === 'spacer') {
          return <div key={blockKey} style={{ height: '6px' }} />;
        }

        return (
          <p key={blockKey} className="chat-p" style={{ margin: '6px 0', lineHeight: '1.68' }}>
            {renderInlineMarkdown(block.text, blockKey)}
          </p>
        );
      })}
    </div>
  );
}
