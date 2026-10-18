import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, ShieldCheck, House, Gavel, Car, HeartHandshake, KeyRound, ArrowUpRight } from 'lucide-react';

export function ChatAssistant({ messages, onSendMessage, onClearChat, isGenerating, onSuggestionClick, currentUser }) {
  const [input, setInput] = useState('');
  const [thinkingText, setThinkingText] = useState('Searching legal database...');
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const field = inputRef.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${Math.min(field.scrollHeight, 110)}px`;
  }, [input]);

  useEffect(() => {
    if (!isGenerating) {
      const timer = setTimeout(() => {
        setThinkingText('Searching legal database...');
      }, 0);
      return () => clearTimeout(timer);
    }

    const phases = [
      'Searching legal database...',
      'Analyzing relevant statutory provisions...',
      'Explaining how the law applies...',
      'Drafting final response...'
    ];

    let currentPhase = 0;
    const initialTimer = setTimeout(() => {
      setThinkingText(phases[0]);
    }, 0);

    const interval = setInterval(() => {
      currentPhase++;
      if (currentPhase < phases.length) {
        setThinkingText(phases[currentPhase]);
      } else {
        clearInterval(interval);
      }
    }, 850);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isGenerating]);

  const suggestions = [
    {
      headline: "Fundamental Rights",
      icon: ShieldCheck,
      body: "What are my rights if arrested by the police?",
      query: "what are my fundamental rights under police arrest?"
    },
    {
      headline: "Land & Property",
      icon: House,
      body: "Can the Governor revoke my Certificate of Occupancy?",
      query: "can the governor revoke my C of O land ownership?"
    },
    {
      headline: "Criminal Penalties",
      icon: Gavel,
      body: "What is the legal definition and punishment for stealing?",
      query: "what is the definition and punishment for stealing?"
    },
    {
      headline: "Vehicle Towing",
      icon: Car,
      body: "Can my car be towed for obstructing traffic?",
      query: "can my car be towed for obstructing traffic?"
    },
    {
      headline: "Family Law",
      icon: HeartHandshake,
      body: "Am I allowed to remarry after divorce?",
      query: "am I allowed to remarry after divorce in Nigeria?"
    },
    {
      headline: "Rent & Housing",
      icon: KeyRound,
      body: "How much advance rent can a Lagos landlord ask for?",
      query: "How much advance rent can a landlord demand in Lagos State?"
    }
  ];

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0 && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isGenerating]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() === '' || isGenerating) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-workspace" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
      {/* Scrollable messages container */}
      <div className="chat-container" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="welcome-screen">
            <p className="welcome-eyebrow">YOUR EVERYDAY LEGAL GUIDE</p>
            <h1 className="welcome-title">
              What Does <span>Nigerian Law Say?</span>
            </h1>
            <p className="welcome-desc">
              Nigerian law, explained simply. Ask a question, know your rights and understand your next step.
            </p>

            <div className="suggestion-grid">
              {suggestions.map((s, idx) => (
                <button 
                  key={idx} 
                  className="suggestion-card"
                  onClick={() => onSuggestionClick(s.query)}
                >
                  <div className="suggestion-icon-row"><s.icon size={19} /><ArrowUpRight size={15} /></div>
                  <div className="suggestion-headline">{s.headline}</div>
                  <div className="suggestion-body">{s.body}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message-bubble ${msg.role}`}>
              <div className={`avatar ${msg.role}`}>
                {msg.role === 'user' ? (currentUser ? currentUser.avatar : 'U') : 'AI'}
              </div>
              <div className="message-content">
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {/* Simplistic renderer for bolding, bullet points and blockquotes */}
                  {msg.content.split('\n').map((line, lIdx) => {
                    if (line.startsWith('> ')) {
                      return <blockquote key={lIdx}>{line.replace('> ', '')}</blockquote>;
                    }
                    if (line.startsWith('• ')) {
                      return <li key={lIdx} style={{ marginLeft: '16px' }}>{line.replace('• ', '')}</li>;
                    }
                    
                    // Simple inline bold formatting **text**
                    const parts = line.split('**');
                    if (parts.length > 1) {
                      return (
                        <p key={lIdx} style={{ margin: '6px 0' }}>
                          {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: 'var(--gold-primary)' }}>{part}</strong> : part)}
                        </p>
                      );
                    }

                    return <p key={lIdx} style={{ margin: '6px 0' }}>{line}</p>;
                  })}
                </div>
              </div>
            </div>
          ))
        )}

        {isGenerating && (
          <div className="message-bubble assistant">
            <div className="avatar assistant">AI</div>
            <div className="message-content" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: '10px' }}>{thinkingText}</span>
              <div className="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div />
      </div>

      {/* Input panel at bottom */}
      <div className="input-panel">
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              rows={1}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Nigerian law..."
              aria-label="Your Nigerian law question"
              disabled={isGenerating}
            />
            <div className="action-buttons">
              {messages.length > 0 && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={onClearChat}
                  title="Clear conversation"
                  disabled={isGenerating}
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                type="submit"
                className="icon-btn send-btn"
                disabled={input.trim() === '' || isGenerating}
                title="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </form>
        <details className="legal-disclaimer">
          <summary>Legal information, not legal advice</summary>
          <p>AI-assisted summaries can contain errors. Check the sources and current amendments. Consult a Nigerian legal practitioner for advice on your circumstances.</p>
        </details>
      </div>
    </div>
  );
}
