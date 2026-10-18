import { MessageSquare, Plus, Trash2, History, Lock, Newspaper, X } from 'lucide-react';
import { BrandEmblems } from './BrandEmblems';

export function SavedChatsPanel({ 
  chats = [], 
  activeChatId, 
  onSelectChat, 
  onCreateNewChat, 
  onDeleteChat, 
  currentUser,
  onArticlesClick,
  isSubscribed,
  onToggleSubscribe,
  mobileOpen,
  onCloseMobile
}) {
  return (
    <aside className={`history-panel ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Chat history">
      {/* Top action buttons */}
      <div className="history-header" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {mobileOpen && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: '-4px' }}>
            <button className="mobile-drawer-close" onClick={onCloseMobile} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
              <span>Close</span>
              <X size={14} />
            </button>
          </div>
        )}
        <button className="new-chat-btn" onClick={onCreateNewChat}>
          <Plus size={16} />
          <span>New Chat</span>
        </button>
        <button className="new-chat-btn" onClick={onArticlesClick} style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderColor: 'var(--border-light)',
          color: 'var(--text-secondary)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.borderColor = 'var(--gold-primary)';
          e.currentTarget.style.color = 'var(--gold-primary)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
          e.currentTarget.style.borderColor = 'var(--border-light)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
        >
          <Newspaper size={14} />
          <span>Articles Feed</span>
        </button>
      </div>

      {/* History List */}
      <div className="history-scroll">
        <div className="history-title-row">
          <History size={14} style={{ color: 'var(--gold-primary)' }} />
          <span>Saved Conversations</span>
        </div>

        {!currentUser ? (
          // Guest status prompt
          <div className="guest-history-prompt">
            <Lock size={20} style={{ color: 'var(--gold-primary)', opacity: 0.6, marginBottom: '8px' }} />
            <p className="guest-prompt-title">Guest Mode</p>
            <p className="guest-prompt-desc">
              Sign in with Google to keep your chats in this browser between visits.
            </p>
          </div>
        ) : chats.length === 0 ? (
          // Empty history prompt for logged in user
          <div className="empty-history-prompt">
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No conversations yet.</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '180px' }}>
              Your future chats will show up here automatically.
            </p>
          </div>
        ) : (
          <div className="history-list">
            {chats.map((chat) => {
              const isActive = chat.id === activeChatId;
              return (
                <div 
                  key={chat.id} 
                  className={`history-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <MessageSquare size={14} className="chat-icon" />
                  <span className="chat-title">{chat.title || 'New Conversation'}</span>
                  <button 
                    className="delete-chat-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent choosing the chat when deleting it
                      if (confirm('Are you sure you want to delete this conversation?')) {
                        onDeleteChat(chat.id);
                      }
                    }}
                    title="Delete conversation"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Newsletter Subscription Toggle */}
      {currentUser && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-light)',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            fontSize: '0.74rem', 
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: '600'
          }}>
            <span>🔔 Legal Newsletters</span>
            <input 
              type="checkbox" 
              checked={isSubscribed}
              onChange={(e) => onToggleSubscribe(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
          </label>
          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
            Receive Nigerian law publications and practical guides by email.
          </span>
        </div>
      )}

      {/* Footer Branding */}
      <div className="sources-footer" style={{ flexDirection: 'column', gap: '14px', padding: '24px 20px' }}>
        <div className="law-brand-footer">
          <BrandEmblems />
          <span>What Does<br /><strong>Nigerian Law Say?</strong></span>
          <small>Know your rights. Understand the law.</small>
        </div>
        

      </div>
    </aside>
  );
}
