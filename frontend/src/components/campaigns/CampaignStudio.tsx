import React, { useState, useEffect } from 'react';
import { Megaphone, Sparkles, Send, Users, CheckCircle2, MessageSquare, Tag, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { Campaign, PersonalizedOfferCustomer, Product, Customer } from '../../types';
import { campaignApi, productApi, messagingApi } from '../../services/api';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const CampaignStudio: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const currency = user?.currency || '₹';

  const [activeTab, setActiveTab] = useState<'bulk' | 'personalized' | 'history'>('personalized');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Bulk Campaign State
  const [title, setTitle] = useState<string>('Weekend Special Offer');
  const [audienceType, setAudienceType] = useState<string>('ALL');
  const [channel, setChannel] = useState<string>('WHATSAPP');
  const [discountPercent, setDiscountPercent] = useState<string>('20');
  const [messageTemplate, setMessageTemplate] = useState<string>(
    'Weekend Special Sale at {{business_name}}! 🎉\n\n' +
    'Get {{discount}} OFF on selected items this Saturday & Sunday!\n\n' +
    'Visit our store or message us to place your order. Thank you!'
  );
  const [sendingBulk, setSendingBulk] = useState<boolean>(false);

  // AI Personalized Offers State
  const [personalizedOffers, setPersonalizedOffers] = useState<PersonalizedOfferCustomer[]>([]);
  const [loadingPersonalized, setLoadingPersonalized] = useState<boolean>(false);
  const [selectedOffers, setSelectedOffers] = useState<number[]>([]);
  const [sendingPersonalized, setSendingPersonalized] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [campList, prodList] = await Promise.all([
        campaignApi.list(),
        productApi.list(),
      ]);
      setCampaigns(campList);
      setProducts(prodList);
      loadPersonalizedOffers();
    } catch (err) {
      console.error(err);
    }
  };

  const loadPersonalizedOffers = async () => {
    setLoadingPersonalized(true);
    try {
      const offers = await campaignApi.getPersonalizedOffers(10);
      setPersonalizedOffers(offers);
      // Auto-select all by default
      setSelectedOffers(offers.map((o) => o.customer_id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPersonalized(false);
    }
  };

  // Dispatch Bulk Campaign
  const handleSendBulkCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !messageTemplate.trim()) {
      showToast('Please enter campaign title and message', 'warning');
      return;
    }

    setSendingBulk(true);
    try {
      const res = await campaignApi.create({
        title: title.trim(),
        campaign_type: 'BULK_OFFER',
        channel: channel,
        audience_type: audienceType,
        message_template: messageTemplate,
        discount_percentage: discountPercent ? parseFloat(discountPercent) : undefined,
      });

      showToast(`Campaign broadcasted to ${res.recipient_count} customers!`, 'success');
      loadData();
      setActiveTab('history');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to dispatch campaign', 'error');
    } finally {
      setSendingBulk(false);
    }
  };

  // Dispatch AI Personalized Campaign
  const handleSendPersonalizedCampaign = async () => {
    if (selectedOffers.length === 0) {
      showToast('Please select at least one customer to receive personalized offer', 'warning');
      return;
    }

    setSendingPersonalized(true);
    try {
      const targetOffers = personalizedOffers.filter((o) => selectedOffers.includes(o.customer_id));
      for (const offer of targetOffers) {
        await messagingApi.send({
          customer_id: offer.customer_id,
          recipient_phone: offer.customer_phone,
          recipient_name: offer.customer_name,
          message_content: offer.personalized_message,
          channel: 'WHATSAPP',
          message_type: 'PERSONALIZED_OFFER',
        });
      }

      showToast(`Personalized offers sent to ${targetOffers.length} customers via WhatsApp!`, 'success');
      loadData();
    } catch (err) {
      showToast('Failed to dispatch personalized offers', 'error');
    } finally {
      setSendingPersonalized(false);
    }
  };

  const toggleSelectOffer = (id: number) => {
    setSelectedOffers((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Studio Navigation Tabs */}
      <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 max-w-xl">
        <button
          type="button"
          onClick={() => setActiveTab('personalized')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'personalized'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Personalized Offers</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bulk')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'bulk'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Bulk Announcements</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Campaign History</span>
        </button>
      </div>

      {/* TAB 1: AI PERSONALIZED OFFERS */}
      {activeTab === 'personalized' && (
        <div className="space-y-5">
          {/* Explanation Header */}
          <div className="glass-card p-5 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">AI Targeted Promotions Engine</h3>
                <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                  Instead of sending the same generic discount to everyone, SmartBiz AI analyzes what each customer buys (e.g. Ravi $\rightarrow$ Rice, Anil $\rightarrow$ Electronics) and prepares custom tailored offers!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendPersonalizedCampaign}
              disabled={sendingPersonalized || selectedOffers.length === 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>{sendingPersonalized ? 'Sending...' : `Send Offers to Selected (${selectedOffers.length})`}</span>
            </button>
          </div>

          {/* Cards of AI Personalized Recommendations */}
          {loadingPersonalized ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Analyzing customer purchase patterns...
            </div>
          ) : personalizedOffers.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No Purchase History Yet"
              description="As you create bills and record customer purchases, the AI will automatically suggest personalized offers here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personalizedOffers.map((offer) => {
                const isSelected = selectedOffers.includes(offer.customer_id);
                return (
                  <div
                    key={offer.customer_id}
                    onClick={() => toggleSelectOffer(offer.customer_id)}
                    className={`glass-card p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-indigo-500/60 bg-slate-900/90 shadow-xl shadow-indigo-500/10'
                        : 'border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">{offer.customer_name}</h4>
                        <span className="text-[11px] text-slate-400">📞 {offer.customer_phone}</span>
                      </div>
                      <Badge variant="info">{offer.suggested_discount}% Discount</Badge>
                    </div>

                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-3 text-xs flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Frequent Buy</span>
                        <span className="font-bold text-slate-200">{offer.frequent_product_name}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 text-[11px] text-slate-300 leading-relaxed italic whitespace-pre-wrap">
                      "{offer.personalized_message}"
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-indigo-400">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp Campaign</span>
                      </span>
                      <span>{isSelected ? 'Selected ✓' : 'Click to Select'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BULK CAMPAIGN */}
      {activeTab === 'bulk' && (
        <form onSubmit={handleSendBulkCampaign} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5 max-w-2xl">
          <div>
            <h3 className="text-base font-extrabold text-white">Broadcast Announcement or Offer</h3>
            <p className="text-xs text-slate-400">Send WhatsApp or SMS messages to your customer segments</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Campaign Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Festival Mega Sale"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Discount %</label>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="20"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono text-white focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Target Audience</label>
              <select
                value={audienceType}
                onChange={(e) => setAudienceType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500 font-medium"
              >
                <option value="ALL">All Registered Customers</option>
                <option value="OUTSTANDING">Customers with Pending Credit</option>
                <option value="PAST_BUYERS">Past Buyers of a Specific Product</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500 font-medium"
              >
                <option value="WHATSAPP">WhatsApp (Recommended)</option>
                <option value="SMS">SMS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Message Template (Variables: {'{{name}}'}, {'{{business_name}}'}, {'{{discount}}'})
            </label>
            <textarea
              rows={4}
              required
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white leading-relaxed focus:border-indigo-500 font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={sendingBulk}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{sendingBulk ? 'Broadcasting Messages...' : 'Launch & Dispatch Campaign'}</span>
          </button>
        </form>
      )}

      {/* TAB 3: CAMPAIGN HISTORY */}
      {activeTab === 'history' && (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          {campaigns.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No Campaigns Dispatched Yet"
              description="Create a bulk campaign or launch AI personalized offers to see campaign history."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Campaign Title</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Audience</th>
                    <th className="py-3 px-4 text-center">Recipients</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{c.title}</td>
                      <td className="py-3 px-4">
                        <Badge variant="neutral">{c.campaign_type}</Badge>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {c.channel}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{c.audience_type}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-white">
                        {c.recipient_count}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="success">SENT ✓</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
