import React, { useState, useEffect } from 'react';
import { Clock, MessageSquare, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { analyticsApi, messagingApi } from '../../services/api';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const CreditAgingList: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const currency = user?.currency || '₹';

  const [agingData, setAgingData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAging();
  }, []);

  const loadAging = async () => {
    setLoading(true);
    try {
      const data = await analyticsApi.getCreditAging();
      setAgingData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (item: any) => {
    try {
      const msg =
        `Good morning ${item.name},\n\n` +
        `This is a reminder from *${user?.business_name}* regarding your pending balance of *${currency}${item.outstanding_balance.toLocaleString()}* (pending for ${item.days_pending} days).\n\n` +
        `Please settle the payment at your earliest convenience. Thank you!`;

      await messagingApi.send({
        customer_id: item.customer_id,
        recipient_phone: item.phone,
        recipient_name: item.name,
        message_content: msg,
        channel: 'WHATSAPP',
      });
      showToast(`Reminder sent to ${item.name}!`, 'success');
    } catch (err) {
      showToast('Failed to send reminder', 'error');
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Customer Credit Aging Report
          </h4>
          <p className="text-[11px] text-slate-400">Aging analysis of outstanding balances to prioritize collections</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Calculating aging buckets...
        </div>
      ) : agingData.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs">
          🎉 Awesome! No customers currently have overdue balances.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 font-mono">Contact</th>
                <th className="py-3 px-4 text-right">Outstanding Due</th>
                <th className="py-3 px-4 text-center">Days Pending</th>
                <th className="py-3 px-4">Aging Bucket</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {agingData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white text-xs">{item.name}</div>
                    <div className="text-[10px] text-indigo-300 font-mono">{item.serial_number}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    📞 {item.phone}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                    {currency}{item.outstanding_balance.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300 font-bold">
                    {item.days_pending} days
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        item.days_pending > 30 ? 'danger' : item.days_pending > 15 ? 'warning' : 'info'
                      }
                    >
                      {item.aging_bucket}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleSendReminder(item)}
                      className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg border border-emerald-500/30 text-[11px] font-bold transition-all flex items-center gap-1 mx-auto"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Remind</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
