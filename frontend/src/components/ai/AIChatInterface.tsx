import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, CheckCircle2, ArrowRight, User, Terminal, HelpCircle, RefreshCw } from 'lucide-react';
import { aiApi } from '../../services/api';
import { AIChatResponse, AIToolExecuted } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

interface MessageItem {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  tools?: AIToolExecuted[];
  timestamp: string;
}

export const AIChatInterface: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text:
        `Hello ${user?.name || 'Shopkeeper'}! 👋 I am **SmartBiz AI**, your digital business assistant.\n\n` +
        `I can directly query your business records, find debtors, record customer payments, create quick bills, or check daily sales metrics.\n\n` +
        `Click any suggestion below or type your instruction in plain words.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickChips = [
    "How much did I sell today?",
    "Who owes me more than ₹1,000?",
    "Show Ravi's transactions",
    "Record that Ravi paid ₹500 in UPI",
    "What is the price of Royal Basmati Rice?",
    "Create a bill for Anil for ₹1,200 and he paid ₹800",
    "Send payment reminder to Suresh",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: MessageItem = {
      id: Math.random().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const resp: AIChatResponse = await aiApi.chat(text.trim());
      const aiMsg: MessageItem = {
        id: Math.random().toString(),
        sender: 'ai',
        text: resp.reply,
        tools: resp.tools_executed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: MessageItem = {
        id: Math.random().toString(),
        sender: 'ai',
        text: '⚠️ I encountered an error connecting to the business database. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] glass-card rounded-2xl border border-indigo-500/20 shadow-2xl overflow-hidden">
      {/* AI Assistant Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-600/30 text-white flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-white text-sm tracking-tight flex items-center gap-2">
              <span>SmartBiz AI Agent</span>
              <Badge variant="success">Tool Calling Active ✓</Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              Natural-Language Business Operations for {user?.business_name}
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'welcome-reset',
                sender: 'ai',
                text: `Conversation reset. How can I assist with your business operations today?`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ])
          }
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-xs flex items-center gap-1"
          title="Reset Chat"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-950/40">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white font-bold text-xs'
                  : 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md'
              }`}
            >
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none shadow-xl'
              }`}
            >
              {/* Tool Execution Badge (if AI executed database tools) */}
              {m.tools && m.tools.length > 0 && (
                <div className="mb-2 p-2 rounded-lg bg-indigo-950/70 border border-indigo-500/30 flex items-center gap-2 text-[10px] text-indigo-300 font-mono">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Executed Backend Tool: <strong>{m.tools[0].tool_name}()</strong></span>
                </div>
              )}

              {/* Message text with basic markdown formatting */}
              <div className="whitespace-pre-wrap font-sans text-xs">
                {m.text}
              </div>

              <div
                className={`text-[10px] ${
                  m.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'
                } text-right mt-1`}
              >
                {m.timestamp}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-indigo-300 flex items-center gap-2">
              <span>Interpreting instruction & invoking backend tools...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-5 py-2.5 bg-slate-900/60 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Try:</span>
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(chip)}
            className="px-2.5 py-1 bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700/60 hover:border-indigo-500/40 text-[11px] text-slate-300 hover:text-white rounded-lg whitespace-nowrap transition-all shrink-0"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a business question or give a command (e.g. 'Record Ravi paid ₹1,000')..."
          className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};
