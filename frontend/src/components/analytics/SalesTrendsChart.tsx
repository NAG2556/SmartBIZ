import React from 'react';
import { SalesTrendItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SalesTrendsChartProps {
  data: SalesTrendItem[];
}

export const SalesTrendsChart: React.FC<SalesTrendsChartProps> = ({ data }) => {
  const { user } = useAuth();
  const currency = user?.currency || '₹';

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-slate-500 text-xs">No sales data recorded yet.</div>;
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.sales, d.collection, d.credit)), 100);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
          Daily Sales vs Collections vs Credit Generated
        </h4>
        <div className="flex items-center gap-4 text-[11px] font-medium">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
            <span className="text-slate-300">Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
            <span className="text-slate-300">Collection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
            <span className="text-slate-300">Credit</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-800">
        {data.map((item, idx) => {
          const salesHeight = Math.max(8, (item.sales / maxVal) * 100);
          const collHeight = Math.max(8, (item.collection / maxVal) * 100);
          const creditHeight = Math.max(8, (item.credit / maxVal) * 100);

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
              {/* Bars Group */}
              <div className="flex items-end gap-1 w-full justify-center h-full">
                {/* Sales Bar */}
                <div
                  style={{ height: `${salesHeight}%` }}
                  className="w-2.5 sm:w-3.5 bg-indigo-500 rounded-t-sm transition-all group-hover:brightness-125 relative"
                  title={`Sales: ${currency}${item.sales}`}
                />
                {/* Collection Bar */}
                <div
                  style={{ height: `${collHeight}%` }}
                  className="w-2.5 sm:w-3.5 bg-emerald-400 rounded-t-sm transition-all group-hover:brightness-125 relative"
                  title={`Collection: ${currency}${item.collection}`}
                />
                {/* Credit Bar */}
                <div
                  style={{ height: `${creditHeight}%` }}
                  className="w-2.5 sm:w-3.5 bg-amber-400 rounded-t-sm transition-all group-hover:brightness-125 relative"
                  title={`Credit: ${currency}${item.credit}`}
                />
              </div>

              {/* Date Label */}
              <span className="text-[10px] font-mono text-slate-400 mt-1 whitespace-nowrap">
                {item.date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
