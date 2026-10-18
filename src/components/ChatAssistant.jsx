import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, ShieldCheck, House, Gavel, Car, HeartHandshake, KeyRound, ArrowUpRight, Mic, Volume2, VolumeX, Square, X, Loader2 } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { startAudioRecording, stopAudioRecordingAndTranscribe, cancelAudioRecording, speakText, stopSpeaking } from '../utils/voiceService';

export function ChatAssistant({ messages, onSendMessage, onClearChat, isGenerating, onSuggestionClick, currentUser, aiQuotaRemaining }) {
  const [input, setInput] = useState('');
  const [thinkingText, setThinkingText] = useState('Searching legal database...');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceError, setVoiceError] = useState('');
  const [speakingIndex, setSpeakingIndex] = useState(null);

  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const field = inputRef.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${Math.min(field.scrollHeight, 110)}px`;
  }, [input]);

  // Voice recording timer
  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  // Cleanup voice on unmount
  useEffect(() => {
    return () => {
      cancelAudioRecording();
      stopSpeaking();
    };
  }, []);

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

  const handleStartVoice = async () => {
    setVoiceError('');
    try {
      await startAudioRecording();
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch (err) {
      console.error('Microphone access failed:', err);
      setVoiceError(err.message || 'Microphone access denied or not supported.');
    }
  };

  const handleStopVoice = async (autoSend = false) => {
    setIsRecording(false);
    setIsTranscribing(true);
    try {
      const result = await stopAudioRecordingAndTranscribe();
      if (result && result.transcript) {
        if (autoSend) {
          onSendMessage(result.transcript);
          setInput('');
        } else {
          setInput(result.transcript);
          if (inputRef.current) inputRef.current.focus();
        }
      } else {
        setVoiceError('No speech detected. Please speak clearly into your mic and try again.');
      }
    } catch (err) {
      console.error('Transcription failed:', err);
      setVoiceError(err.message || 'Deepgram speech-to-text failed. Check DEEPGRAM_API_KEY.');
    } finally {
      setIsTranscribing(false);
      setRecordingSeconds(0);
    }
  };

  const handleCancelVoice = () => {
    cancelAudioRecording();
    setIsRecording(false);
    setIsTranscribing(false);
    setRecordingSeconds(0);
  };

  const handleToggleSpeak = (index, content) => {
    if (speakingIndex === index) {
      stopSpeaking();
      setSpeakingIndex(null);
    } else {
      setSpeakingIndex(index);
      speakText(content, () => setSpeakingIndex(index), () => setSpeakingIndex(null));
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
                <MarkdownRenderer content={msg.content} />
                {msg.role === 'assistant' && (
                  <div className="message-speaker-row" style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className={`message-audio-btn ${speakingIndex === index ? 'is-speaking' : ''}`}
                      onClick={() => handleToggleSpeak(index, msg.content)}
                      title={speakingIndex === index ? "Stop voice playback" : "Listen to explanation"}
                      aria-label="Read explanation aloud"
                    >
                      {speakingIndex === index ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      <span>{speakingIndex === index ? 'Stop' : 'Listen'}</span>
                    </button>
                  </div>
                )}
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
        {voiceError && (
          <div className="voice-error-toast">
            <span>{voiceError}</span>
            <button type="button" onClick={() => setVoiceError('')} aria-label="Dismiss error">
              <X size={13} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className={`input-wrapper ${isRecording ? 'recording-active' : ''}`}>
            {isRecording ? (
              <div className="voice-recording-bar">
                <div className="recording-status">
                  <span className="recording-dot-pulse" />
                  <span className="recording-timer">
                    00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                  </span>
                  <span className="recording-text">Listening... Speak now</span>
                </div>
                <div className="recording-buttons">
                  <button
                    type="button"
                    className="icon-btn voice-cancel-btn"
                    onClick={handleCancelVoice}
                    title="Cancel recording"
                  >
                    <X size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn voice-finish-btn"
                    onClick={() => handleStopVoice(false)}
                    title="Done speaking (convert to text)"
                  >
                    <Square size={13} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn send-btn"
                    onClick={() => handleStopVoice(true)}
                    title="Send voice question directly"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            ) : isTranscribing ? (
              <div className="voice-transcribing-bar">
                <Loader2 size={16} className="animate-spin" />
                <span>Transcribing voice with Deepgram...</span>
              </div>
            ) : (
              <>
                <textarea
                  ref={inputRef}
                  rows={1}
                  className="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about Nigerian law or tap the mic to speak..."
                  aria-label="Your Nigerian law question"
                  disabled={isGenerating}
                />
                <div className="action-buttons">
                  <button
                    type="button"
                    className="icon-btn mic-btn"
                    onClick={handleStartVoice}
                    disabled={isGenerating}
                    title="Voice Chat: Speak question (Deepgram STT)"
                    aria-label="Speak question"
                  >
                    <Mic size={17} />
                  </button>
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
              </>
            )}
          </div>
        </form>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
          <details className="legal-disclaimer" style={{ margin: 0 }}>
            <summary>Legal information, not legal advice</summary>
            <p>AI-assisted summaries can contain errors. Check the sources and current amendments. Consult a Nigerian legal practitioner for advice on your circumstances.</p>
          </details>
          <span style={{
            fontSize: '0.7rem',
            color: aiQuotaRemaining === 0 ? 'var(--gold-primary)' : 'var(--text-muted)',
            fontWeight: aiQuotaRemaining === 0 ? '600' : 'normal',
            whiteSpace: 'nowrap',
            opacity: 0.85
          }}>
            {typeof aiQuotaRemaining === 'number'
              ? (aiQuotaRemaining === 0
                  ? 'Daily free quota reached (resets at midnight UTC)'
                  : `Free AI Tier: ${aiQuotaRemaining} queries left today`)
              : 'Free AI Tier (Groq & Gemini)'}
          </span>
        </div>
      </div>
    </div>
  );
}
