'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bot, Send, Sparkles, User, ShieldCheck, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';
import { AiMessage, AiConversation } from '../../../types';

export default function StudentAiCoachPage() {
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [lastFailedText, setLastFailedText] = useState('');
  const [aiReady, setAiReady] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    apiFetch<{ configured: boolean }>('/ai-coach/status').then((res) => {
      if (res.success && res.data) setAiReady(res.data.configured);
    });
  }, []);


  async function loadConversations() {
    const res = await apiFetch<AiConversation[]>('/ai-coach/conversations');
    if (res.success && res.data) {
      setConversations(res.data);
      if (res.data.length > 0) {
        setActiveConvId(res.data[0].id);
        loadMessages(res.data[0].id);
      }
    }
  }

  async function loadMessages(convId: string) {
    const res = await apiFetch<AiConversation>(`/ai-coach/conversations/${convId}`);
    if (res.success && res.data) {
      setMessages(res.data.messages);
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || sending) return;

    setError('');
    setLastFailedText('');

    const userTempMsg: AiMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeConvId || '',
      sender: 'USER',
      messageText: text,
      sentAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userTempMsg]);
    setInputText('');
    setSending(true);

    const res = await apiFetch<{ conversationId: string; aiResponse: AiMessage }>('/ai-coach/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: activeConvId || undefined,
        messageText: text,
      }),
    });

    setSending(false);

    if (res.success && res.data) {
      if (!activeConvId) {
        setActiveConvId(res.data.conversationId);
        loadConversations();
      }
      setMessages((prev) => [...prev.filter((m) => m.id !== userTempMsg.id), userTempMsg, res.data.aiResponse]);
    } else {
      // Remove the optimistic message and show a real, retryable error. Never fake success.
      setMessages((prev) => prev.filter((m) => m.id !== userTempMsg.id));
      setInputText(text);
      setLastFailedText(text);
      setError(res.error?.message || 'The AI coach could not respond. Please try again.');
    }
  };

  const PROMPT_CHIPS = [
    'How can I improve my placement readiness score?',
    'What technical skills should I add to my resume?',
    'Help me prepare for technical interviews.',
    'Analyze my career roadmap progress.',
  ];

  return (
    <DashboardLayout title="AI Career Coach" subtitle="Contextual career assistant tailored to your profile.">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
        {/* CONVERSATION THREADS SIDEBAR */}
        <Card className="md:col-span-1 flex flex-col justify-between p-4 bg-white border border-slate-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-xs font-bold text-slate-900">Conversations</span>
              <Button size="sm" variant="ghost" onClick={() => { setActiveConvId(null); setMessages([]); }}>
                + New
              </Button>
            </div>
            <div className="space-y-1 overflow-y-auto max-h-[450px]">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setActiveConvId(c.id); loadMessages(c.id); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium truncate transition-colors ${
                    activeConvId === c.id ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Private & Audited AI Context
          </div>
        </Card>

        {/* MAIN CHAT AREA */}
        <Card className="md:col-span-3 flex flex-col justify-between p-0 overflow-hidden bg-white border border-slate-200">
          {/* TOP BAR */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">AI Career Coach</p>
                <p className="text-[10px] text-slate-500">Context: Profile CGPA, verified skills, & roadmap</p>
              </div>
            </div>
            <Badge variant={aiReady ? 'info' : 'danger'}>{aiReady ? 'AI Coach Connected' : 'AI Coach Unavailable'}</Badge>
          </div>

          {/* STATUS / ERROR BANNERS */}
          {!aiReady && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>The AI service is not configured on this server yet. Your questions are saved, but the coach cannot answer right now.</span>
            </div>
          )}
          {error && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between gap-2 text-xs text-rose-700">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                {error}
              </span>
              {lastFailedText && (
                <Button size="sm" variant="outline" onClick={() => handleSendMessage(lastFailedText)} disabled={sending} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                  Retry
                </Button>
              )}
            </div>
          )}

          {/* MESSAGES VIEW */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[500px]">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-12 h-12 text-teal-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-900">How can I assist your career path today?</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Click a suggested prompt below or type your custom career question.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 max-w-lg mx-auto">
                  {PROMPT_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip)}
                      className="p-3 text-left text-xs bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl border border-slate-200 transition-colors shadow-subtle"
                    >
                      💡 {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.sender === 'USER';
                return (
                  <div key={m.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                      isUser ? 'bg-blue-600' : 'bg-teal-600'
                    }`}>
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-900 rounded-tl-none border border-slate-200'
                    }`}>
                      {m.messageText}
                    </div>
                  </div>
                );
              })
            )}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                <span>AI Coach is evaluating your contextual profile...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT FORM */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex items-center gap-2"
            >
              <input
                className="flex-1 rounded-xl border border-slate-300 text-xs px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ask AI Coach about placement readiness, resume tips, or interview prep..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <Button type="submit" loading={sending} icon={<Send className="w-4 h-4" />}>
                Send
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
