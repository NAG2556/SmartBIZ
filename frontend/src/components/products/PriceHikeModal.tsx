import React, { useState, useEffect } from 'react';
import { Megaphone, MessageSquare, AlertCircle, Users, CheckCircle2 } from 'lucide-react';
import { Product, PriceHikeNotificationPreview } from '../../types';
import { productApi, messagingApi } from '../../services/api';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface PriceHikeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

export const PriceHikeModal: React.FC<PriceHikeModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const currency = user?.currency || '₹';

  const [newPrice, setNewPrice] = useState<string>('');
  const [preview, setPreview] = useState<PriceHikeNotificationPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [channel, setChannel] = useState<'WHATSAPP' | 'SMS'>('WHATSAPP');
  const [broadcasting, setBroadcasting] = useState<boolean>(false);

  useEffect(() => {
    if (product && isOpen) {
      setNewPrice((product.selling_price * 1.1).toFixed(2));
      setPreview(null);
      setCustomMessage('');
    }
  }, [product, isOpen]);

  const handleFetchPreview = async () => {
    if (!product || !newPrice || parseFloat(newPrice) <= 0) return;
    setLoadingPreview(true);
    try {
      const data = await productApi.previewPriceHike(product.id, parseFloat(newPrice));
      setPreview(data);
      setCustomMessage(data.sample_message);
    } catch (err) {
      showToast('Failed to fetch past buyers', 'error');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleApplyAndNotify = async () => {
    if (!product || !preview || !newPrice) return;
    setBroadcasting(true);
    try {
      // 1. Update product price in database
      await productApi.update(product.id, {
        selling_price: parseFloat(newPrice),
      });

      // 2. Dispatch notifications to past buyers
      for (const cust of preview.customers) {
        const msg = customMessage.replace('Dear Customer', `Dear ${cust.name}`);
        await messagingApi.send({
          customer_id: cust.id,
          recipient_phone: cust.phone,
          recipient_name: cust.name,
          message_content: msg,
          channel: channel,
          message_type: 'PRICE_ALERT',
        });
      }

      showToast(
        `Price updated to ${currency}${newPrice} and notifications sent to ${preview.target_customers_count} past buyers!`,
        'success'
      );
      onSuccess();
      onClose();
    } catch (err) {
      showToast('Failed to broadcast price update', 'error');
    } finally {
      setBroadcasting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Price Update & Notification: ${product.name}`}
      subtitle={`Current Price: ${currency}${product.selling_price}/${product.unit}`}
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Price Inputs */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Price</span>
            <div className="text-base font-bold font-mono text-slate-300 mt-1">
              {currency}{product.selling_price.toFixed(2)} / {product.unit}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-indigo-400 font-bold uppercase block mb-1">
              Proposed New Price ({currency})
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono font-bold text-white focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleFetchPreview}
                disabled={loadingPreview}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shrink-0"
              >
                {loadingPreview ? 'Finding...' : 'Find Buyers'}
              </button>
            </div>
          </div>
        </div>

        {/* Buyers Discovery & Message Preview */}
        {preview && (
          <div className="space-y-4 animate-float-in">
            <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="text-xs font-bold text-white">
                    Found {preview.target_customers_count} Past Buyers of this Product
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {preview.customers.map((c) => c.name).join(', ') || 'No previous purchase records found.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Channel choice */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-300">Dispatch Channel:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('WHATSAPP')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
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
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                    channel === 'SMS'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  SMS
                </button>
              </div>
            </div>

            {/* Message Template Editor */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Notification Message Preview & Edit
              </label>
              <textarea
                rows={4}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white leading-relaxed focus:border-indigo-500 font-sans"
              />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          {preview && (
            <button
              type="button"
              onClick={handleApplyAndNotify}
              disabled={broadcasting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              {broadcasting ? (
                'Broadcasting...'
              ) : (
                <>
                  <Megaphone className="w-4 h-4" />
                  <span>Update Price & Notify {preview.target_customers_count} Customers</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
