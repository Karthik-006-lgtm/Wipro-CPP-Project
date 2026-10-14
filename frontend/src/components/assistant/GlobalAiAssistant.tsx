import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  AlertCircle,
  Trash2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Paperclip,
  HelpCircle,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import {
  PortalSectionId,
  BackendHealthResponse,
  ChatMessage,
  AssistantStatusResponse,
  FileAttachment,
} from '../../types';
import { apiClient } from '../../api/client';

interface GlobalAiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: PortalSectionId;
  health: BackendHealthResponse | null;
}

interface AttachedFileState {
  file: File;
  base64: string;
  name: string;
  mimeType: string;
}

export const GlobalAiAssistant: React.FC<GlobalAiAssistantProps> = ({
  isOpen,
  onClose,
  activeSection,
  health,
}) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState<AssistantStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFileState | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  // Voice Input (Web Speech Recognition)
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Voice Output (Speech Synthesis)
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSectionMeta = (id: PortalSectionId) => {
    switch (id) {
      case 'home':
        return {
          name: 'Section 1: Home & Executive Overview',
          subtitle: 'Career Intelligence & Interview Acceleration Co-pilot',
          starters: [
            "How can I maximize my resume's match rate for top tech companies?",
            'What is the recommended workflow to prepare for technical interviews?',
            'Can you help me plan a 4-week interview preparation roadmap?',
          ],
        };
      case 'resume-parser':
        return {
          name: 'Section 2: Resume Parser & ATS Audit',
          subtitle: 'High-Accuracy Text Parsing & Transparent ATS Diagnostics',
          starters: [
            'How do top tech ATS parsers score quantifiable metrics and impact verbs?',
            'How can I highlight system architecture and cloud skills on my resume?',
            'What formatting mistakes commonly cause resumes to fail ATS scans?',
          ],
        };
      case 'company-details':
        return {
          name: 'Section 3: Company Intelligence & Matching',
          subtitle: 'Employer Tech Stack Alignment & 52 Verified Tech Firms',
          starters: [
            'What technical skills do tier-1 tech companies prioritize most in 2026?',
            'How should I research an engineering team’s tech stack before an interview?',
            'What smart architectural questions should I ask engineering interviewers?',
          ],
        };
      case 'interview-prep':
        return {
          name: 'Section 4: Technical & Behavioral Interview Lab',
          subtitle: 'Algorithmic Coding Sandbox, STAR Drills & System Design',
          starters: [
            'How do I structure a behavioral answer using the STAR framework?',
            'Explain how to optimize an algorithmic problem from O(N^2) to O(N) using a hash map.',
            'Can you explain the key tradeoffs between SQL and NoSQL in system design?',
          ],
        };
      case 'preparation-records':
        return {
          name: 'Section 5: Preparation History & Analytics',
          subtitle: 'Persistent Performance Tracking & Skill Mastery Trends',
          starters: [
            'How can I analyze my strengths and gaps across coding and behavioral drills?',
            'What metrics should I focus on to improve my coding interview speed?',
            'How should I organize my daily practice routine across DSA and behavioral topics?',
          ],
        };
      case 'resume-generator':
        return {
          name: 'Section 6: ATS Resume Synthesis',
          subtitle: 'Single-Column ATS Templates with PDF & Word DOCX Export',
          starters: [
            'How do I rewrite an experience bullet using the Google "Accomplished [X] by doing [Z]" formula?',
            'Help me write an impactful 3-sentence professional summary for a software engineer.',
            'How can I present personal and open-source projects to impress engineering managers?',
          ],
        };
    }
  };

  const activeMeta = getSectionMeta(activeSection);

  // Fetch Assistant Gateway status from backend
  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await apiClient.getAssistantStatus();
      setAssistantStatus(res);
    } catch {
      setAssistantStatus({
        is_configured: false,
        status: 'unconfigured',
        model: 'gemini-2.5-flash',
        max_message_chars: 4000,
        max_history_items: 10,
        supported_modalities: ['text', 'image', 'speech_input', 'speech_output'],
        message: 'Could not communicate with backend assistant gateway.',
      });
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Keyboard accessibility: Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Clean up speech synthesis on unmount or drawer close
  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setActiveSpeakingId(null);
    }
  }, [isOpen]);

  // Handle Speech Recognition toggle
  const toggleListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please use text input.');
      setTimeout(() => setSpeechError(null), 5000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access in your browser.');
        } else {
          setSpeechError(`Speech recognition notice: ${event.error}`);
        }
        setTimeout(() => setSpeechError(null), 5000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setSpeechError(`Unable to start speech recognition: ${err?.message || 'Unknown error'}`);
      setTimeout(() => setSpeechError(null), 5000);
    }
  };

  // Handle Speech Synthesis (Speak response aloud)
  const toggleSpeechOutput = (messageId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (activeSpeakingId === messageId) {
      window.speechSynthesis.cancel();
      setActiveSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner speech
    const cleanText = text
      .replace(/[*_#`~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;

    utterance.onend = () => setActiveSpeakingId(null);
    utterance.onerror = () => setActiveSpeakingId(null);

    setActiveSpeakingId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachmentError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'text/plain'];
    if (!allowedMime.includes(file.type) && !file.name.endsWith('.txt')) {
      setAttachmentError('Unsupported file type. Please upload PNG, JPEG, WEBP images or plain text files.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAttachmentError('File exceeds 2MB limit. Please attach a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.includes(',') ? result.split(',')[1] : result;
      setAttachedFile({
        file,
        base64: base64Data,
        name: file.name,
        mimeType: file.type || 'text/plain',
      });
    };
    reader.onerror = () => {
      setAttachmentError('Failed to read file payload.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAttachment = () => {
    setAttachedFile(null);
    setAttachmentError(null);
  };

  // Handle Message Submission
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!query && !attachedFile) return;
    if (isLoading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: query || `[Attached: ${attachedFile?.name}]`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachmentName: attachedFile?.name,
      attachmentType: attachedFile?.mimeType,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    let fileAttachmentPayload: FileAttachment | undefined;
    if (attachedFile) {
      fileAttachmentPayload = {
        file_name: attachedFile.name,
        mime_type: attachedFile.mimeType,
        data_base64: attachedFile.base64,
      };
      setAttachedFile(null);
    }

    // Build history items
    const historyPayload = messages.slice(-8).map((m) => ({
      role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      text: m.text,
    }));

    try {
      const response = await apiClient.sendAssistantChat({
        message: query || `Analyze the attached file: ${fileAttachmentPayload?.file_name}`,
        section: activeSection,
        history: historyPayload,
        file_attachment: fileAttachmentPayload,
      });

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAiGenerated: response.is_ai_generated,
        providerStatus: response.provider_status,
        modelUsed: response.model_used,
        suggestions: response.suggestions,
        isStatusNotice: !response.is_ai_generated,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `**[Connection Notice]** Could not reach the FastAPI assistant gateway: ${err?.message || 'Server unavailable'}. Ensure backend is running at http://localhost:8000.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStatusNotice: true,
        isAiGenerated: false,
        providerStatus: 'error',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearMessages = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setActiveSpeakingId(null);
    }
    setMessages([]);
  };

  // Simple Markdown text renderer for bold, bullet lists, and code
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      // Bullet list item
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const itemText = line.trim().substring(2);
        return (
          <li key={idx} style={{ marginLeft: '1.25rem', marginBottom: '0.25rem' }}>
            {parseInlineMarkdown(itemText)}
          </li>
        );
      }
      // Empty line / paragraph break
      if (!line.trim()) {
        return <div key={idx} style={{ height: '0.5rem' }} />;
      }
      // Heading level 3 or 4
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0.5rem 0 0.25rem 0', color: '#c7d2fe' }}>
            {parseInlineMarkdown(line.substring(4))}
          </h4>
        );
      }
      // Standard line
      return (
        <div key={idx} style={{ marginBottom: '0.2rem' }}>
          {parseInlineMarkdown(line)}
        </div>
      );
    });
  };

  const parseInlineMarkdown = (text: string) => {
    // Splits text into bold, inline code, and plain segments
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={match.index} style={{ color: '#f8fafc', fontWeight: 600 }}>
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code
            key={match.index}
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              padding: '0.1rem 0.35rem',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: '#38bdf8',
            }}
          >
            {token.slice(1, -1)}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts.length > 0 ? parts : text;
  };

  return (
    <>
      {/* Persistent Floating Action Button */}
      {!isOpen && (
        <button
          type="button"
          id="global-ai-assistant-fab"
          className="ai-assistant-fab"
          onClick={onClose}
          aria-label="Open Global AI Assistant"
          aria-haspopup="dialog"
        >
          <Bot size={18} aria-hidden="true" />
          <span>AI Assistant</span>
          {assistantStatus?.is_configured ? (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#34d399',
                display: 'inline-block',
                boxShadow: '0 0 6px #34d399',
              }}
              title="Gemini AI Gateway Online"
            />
          ) : (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#fbbf24',
                display: 'inline-block',
              }}
              title="Deterministic Mode (Unconfigured)"
            />
          )}
        </button>
      )}

      {/* Drawer Overlay & Panel */}
      {isOpen && (
        <div
          className="ai-drawer-overlay"
          onClick={onClose}
          id="ai-assistant-overlay"
          role="presentation"
        >
          <div
            className="ai-drawer"
            id="global-ai-assistant-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-assistant-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="ai-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '10px',
                    background: 'var(--brand-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                  }}
                  aria-hidden="true"
                >
                  <Bot size={19} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 id="ai-assistant-title" style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                      Global AI Assistant
                    </h2>
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>{activeMeta.name}</span>
                    <span>•</span>
                    <span style={{ color: health ? '#34d399' : '#f87171' }}>
                      FastAPI: {health ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="ai-icon-btn"
                  onClick={fetchStatus}
                  title="Refresh Gateway Status"
                  aria-label="Refresh Gateway Status"
                  disabled={statusLoading}
                >
                  <RefreshCw size={13} className={statusLoading ? 'spinner' : ''} aria-hidden="true" />
                </button>
                {messages.length > 0 && (
                  <button
                    type="button"
                    className="ai-icon-btn"
                    onClick={handleClearMessages}
                    title="Clear session conversation"
                    aria-label="Clear session conversation"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  id="close-ai-assistant-btn"
                  className="ai-icon-btn"
                  onClick={onClose}
                  aria-label="Close Assistant (Esc)"
                  title="Close Assistant (Esc)"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="ai-drawer-content" role="log" aria-live="polite">
              {/* Context Indicator */}
              {/* Sleek Co-pilot Status Badge */}
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '12px',
                  padding: '0.625rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={14} style={{ color: '#818cf8', flexShrink: 0 }} aria-hidden="true" />
                  <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Career & Interview Co-pilot
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 6px #34d399' }} />
                  Live AI
                </span>
              </div>

              {/* Empty State: Contextual Prompt Starters */}
              {messages.length === 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.625rem' }}>
                    <HelpCircle size={13} style={{ color: 'var(--text-dim)' }} aria-hidden="true" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
                      Contextual Prompt Starters for {activeMeta.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {activeMeta.starters.map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="ai-suggestion-chip"
                        onClick={() => handleSendMessage(prompt)}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation Messages Thread */}
              {messages.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {messages.map((msg) => (
                    <div key={msg.id} className={`chat-msg ${msg.sender}`}>
                      <div className="chat-bubble">
                        {/* Header Badge for Assistant messages */}
                        {msg.sender === 'assistant' && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '0.4rem',
                              paddingBottom: '0.35rem',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                            }}
                          >
                            {msg.isAiGenerated ? (
                              <span className="ai-badge genuine-ai">
                                <Sparkles size={10} aria-hidden="true" />
                                <span>{msg.modelUsed || 'Gemini 2.5 Flash'}</span>
                              </span>
                            ) : (
                              <span className="ai-badge deterministic">
                                <Cpu size={10} aria-hidden="true" />
                                <span>Deterministic Notice</span>
                              </span>
                            )}

                            {/* Voice Output Read Aloud button */}
                            {'speechSynthesis' in window && (
                              <button
                                type="button"
                                className="ai-icon-btn"
                                style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                                onClick={() => toggleSpeechOutput(msg.id, msg.text)}
                                title={activeSpeakingId === msg.id ? 'Stop Speaking' : 'Read Aloud'}
                                aria-label={activeSpeakingId === msg.id ? 'Stop Speaking' : 'Read Aloud'}
                              >
                                {activeSpeakingId === msg.id ? (
                                  <VolumeX size={12} style={{ color: '#f87171' }} aria-hidden="true" />
                                ) : (
                                  <Volume2 size={12} aria-hidden="true" />
                                )}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Attachment badge for user message */}
                        {msg.sender === 'user' && msg.attachmentName && (
                          <div
                            style={{
                              fontSize: '0.7rem',
                              opacity: 0.85,
                              marginBottom: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <Paperclip size={11} aria-hidden="true" />
                            <span>{msg.attachmentName}</span>
                          </div>
                        )}

                        {/* Body content */}
                        {renderFormattedText(msg.text)}

                        {/* Clickable Follow-up suggestions */}
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                              Recommended follow-ups:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              {msg.suggestions.map((sug, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  className="ai-suggestion-chip"
                                  onClick={() => handleSendMessage(sug)}
                                >
                                  {sug}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="chat-time">{msg.timestamp}</span>
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="chat-msg assistant">
                      <div className="chat-bubble">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                          <div className="typing-dots">
                            <span className="typing-dot" />
                            <span className="typing-dot" />
                            <span className="typing-dot" />
                          </div>
                          <span>Consulting Gemini gateway for {activeMeta.name}...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Drawer Input Footer */}
            <div className="ai-drawer-footer">
              {/* Attachment Preview Chip */}
              {attachedFile && (
                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="attachment-pill">
                    <Paperclip size={12} aria-hidden="true" />
                    <span>{attachedFile.name}</span>
                    <span style={{ fontSize: '0.6875rem', opacity: 0.75 }}>
                      ({(attachedFile.file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    className="ai-icon-btn"
                    style={{ padding: '0.2rem' }}
                    title="Remove attachment"
                    aria-label="Remove attachment"
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Attachment / Voice Errors */}
              {(attachmentError || speechError) && (
                <div
                  style={{
                    background: 'var(--danger-bg)',
                    border: '1px solid var(--danger-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.35rem 0.6rem',
                    marginBottom: '0.5rem',
                    fontSize: '0.725rem',
                    color: '#fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <AlertCircle size={12} aria-hidden="true" />
                  <span>{attachmentError || speechError}</span>
                </div>
              )}

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,text/plain,.txt"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                aria-label="Upload image or text document"
              />

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              >
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {/* File Attachment Button */}
                  <button
                    type="button"
                    className="ai-icon-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach Image or Text Document (max 2MB)"
                    aria-label="Attach Image or Text Document"
                    disabled={isLoading}
                  >
                    <Paperclip size={15} aria-hidden="true" />
                  </button>

                  {/* Speech-to-Text Microphone Button */}
                  <button
                    type="button"
                    className={`ai-icon-btn ${isListening ? 'active-pulse' : ''}`}
                    onClick={toggleListening}
                    title={isListening ? 'Stop Listening' : 'Speak Prompt (Web Speech API)'}
                    aria-label={isListening ? 'Stop Listening' : 'Speak Prompt'}
                    disabled={isLoading}
                  >
                    {isListening ? (
                      <MicOff size={15} aria-hidden="true" />
                    ) : (
                      <Mic size={15} aria-hidden="true" />
                    )}
                  </button>

                  {/* Text Input */}
                  <input
                    ref={inputRef}
                    type="text"
                    id="ai-assistant-input"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      isListening
                        ? 'Listening... speak clearly into microphone'
                        : `Ask Co-pilot about ${activeMeta.name}...`
                    }
                    maxLength={4000}
                    style={{
                      flex: 1,
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.625rem 0.875rem',
                      color: 'var(--text-main)',
                      fontSize: '0.8125rem',
                      outline: 'none',
                    }}
                    disabled={isLoading}
                    aria-label="Ask AI Assistant"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    id="ai-assistant-submit-btn"
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0.625rem 0.875rem' }}
                    disabled={(!inputText.trim() && !attachedFile) || isLoading}
                    aria-label="Send message"
                  >
                    <Send size={15} aria-hidden="true" />
                  </button>
                </div>

                {/* Footer Controls / Character Counter */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.6875rem',
                    color: 'var(--text-dim)',
                    padding: '0 0.25rem',
                  }}
                >
                  <span>
                    {isListening ? (
                      <span style={{ color: '#f87171' }}>● Recording audio stream</span>
                    ) : (
                      <span>Enter to send • Esc to close</span>
                    )}
                  </span>
                  <span>{inputText.length} / 4000 chars</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
