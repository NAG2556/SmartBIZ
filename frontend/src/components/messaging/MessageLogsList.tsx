import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Phone, CheckCheck, Smartphone, Check, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { MessageLog, Customer } from '../../types';
import { messagingApi, customerApi } from '../../services/api';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const MessageLogsList: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMessage, setSelectedMessage] = useState<MessageLog | null>(null);

  // Quick Direct Send inputs
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [messageContent, setMessageContent] = useState<string>('');
  const [channel, setChannel] = useState<'WHATSAPP' | 'SMS'>('WHATSAPP');
  const [sending, setSending] = useState<boolean>(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await messagingApi.getLogs();
      setLogs(data);
      if (data.length > 0 && !selectedMessage) {
        setSelectedMessage(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone.trim() || !messageContent.trim()) {
      showToast('Recipient phone and message body are required', 'warning');
      return;
    }

    setSending(true);
    try {
      const msg = await messagingApi.send({
        recipient_phone: recipientPhone.trim(),
        recipient_name: recipientName.trim() || undefined,
        message_content: messageContent.trim(),
        channel: channel,
      });

      showToast(`Message dispatched via ${channel}!`, 'success');
      setMessageContent('');
      setRecipientPhone('');
      setRecipientName('');
      loadLogs();
      setSelectedMessage(msg);
    } catch (err) {
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT: AUDIT TABLE & DIRECT SENDER (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Direct Send Widget */}
        <form onSubmit={handleSendDirect} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Direct Message Dispatcher
            </h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setChannel('WHATSAPP')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                  channel === 'WHATSAPP'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setChannel('SMS')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                  channel === 'SMS'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                SMS
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Recipient Phone *
              </label>
              <input
                type="tel"
                required
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white font-mono focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Customer Name (Optional)
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Ravi Kumar"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Message Content *
            </label>
            <textarea
              rows={3}
              required
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Type your message, offer, or reminder..."
              className="w-full p-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500 font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sending ? 'Sending...' : `Send via ${channel}`}</span>
          </button>
        </form>

        {/* Message Logs Table */}
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Message History & Logs ({logs.length})
            </h4>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading message records...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No messages logged yet. Send a reminder or campaign to see logs.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
              {logs.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMessage(m)}
                  className={`p-3.5 cursor-pointer transition-colors text-xs flex items-center justify-between gap-3 ${
                    selectedMessage?.id === m.id
                      ? 'bg-indigo-950/40 border-l-2 border-indigo-500'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white">{m.recipient_name || m.recipient_phone}</span>
                      <Badge variant={m.channel === 'WHATSAPP' ? 'success' : 'info'}>
                        {m.channel}
                      </Badge>
                      <Badge variant="neutral">{m.message_type}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-sm">{m.message_content}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-emerald-400 font-mono text-[10px] font-bold">
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>{m.status}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: INTERACTIVE WHATSAPP SMARTPHONE SIMULATOR (5 cols) */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div className="sticky top-20 w-full max-w-xs">
          <div className="text-center mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Live Customer WhatsApp Preview
            </span>
          </div>

          {/* Smartphone Frame */}
          <div className="w-full bg-slate-950 rounded-[36px] border-4 border-slate-700 shadow-2xl p-3 overflow-hidden">
            {/* Phone Notch */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2" />

            {/* WhatsApp App Top Bar */}
            <div className="bg-emerald-800 px-3 py-2 rounded-t-2xl flex items-center gap-2 text-white">
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs">
                {user?.business_name ? user.business_name.charAt(0) : 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate">{user?.business_name || 'SmartBiz Store'}</div>
                <div className="text-[9px] text-emerald-200">Verified Business Account ✓</div>
              </div>
            </div>

            {/* Chat Body */}
            <div
              className="bg-[#0b141a] p-3 rounded-b-2xl min-h-[380px] flex flex-col justify-end text-xs"
              style={{
                backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 0)`,
                backgroundSize: '12px 12px',
              }}
            >
              {selectedMessage ? (
                <div className="bg-[#005c4b] text-slate-100 p-3 rounded-2xl rounded-tr-none shadow-md space-y-2 animate-float-in max-w-[90%] self-end">
                  <div className="text-[11px] leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.message_content}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200 font-mono">
                    <span>{new Date(selectedMessage.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500 text-[11px] py-12">
                  Select a message on the left to preview it on customer's phone.
                </div>
              )}
            </div>
          </div>

          {/* Direct Launch to Real WhatsApp */}
          {selectedMessage && (
            <div className="mt-3 text-center animate-float-in">
              <button
                type="button"
                onClick={() => {
                  const cleaned = selectedMessage.recipient_phone.replace(/\D/g, '');
                  const finalPhone = cleaned.startsWith('91') && cleaned.length === 12 ? cleaned : (cleaned.length === 10 ? `91${cleaned}` : cleaned);
                  window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(selectedMessage.message_content)}`, '_blank');
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open & Send in Real WhatsApp (App / Web)</span>
              </button>
              <p className="text-[10px] text-slate-400 mt-1">
                Directly opens WhatsApp Web / Mobile app with this message prefilled!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

