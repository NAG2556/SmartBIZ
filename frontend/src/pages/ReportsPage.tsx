import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Printer, TrendingUp, Package, Users, Calendar } from 'lucide-react';
import { TopProductItem, DashboardStats } from '../types';
import { analyticsApi } from '../services/api';
import { CreditAgingList } from '../components/analytics/CreditAgingList';
import { useAuth } from '../context/AuthContext';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const currency = user?.currency || '₹';

  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [prodData, statsData] = await Promise.all([
        analyticsApi.getTopProducts(10),
        analyticsApi.getDashboard(),
      ]);
      setTopProducts(prodData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-white">Business Intelligence & Executive Reports</h3>
          <p className="text-xs text-slate-400">Comprehensive sales, inventory turnover, and credit aging analytics</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Credit Aging Section */}
      <CreditAgingList />

      {/* Top Best Selling Products & Services Report */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-400" />
            Best-Selling Products & Revenue Contribution
          </h4>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Generating product report...
          </div>
        ) : topProducts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No sales recorded yet to calculate best-selling items.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Product / Service</th>
                  <th className="py-3 px-4 text-center">Total Quantity Sold</th>
                  <th className="py-3 px-4 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
                      {p.total_quantity_sold}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {currency}{p.total_revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
