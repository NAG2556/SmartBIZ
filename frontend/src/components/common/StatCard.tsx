import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  colorScheme?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  colorScheme = 'indigo',
  onClick,
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
      glow: 'hover:border-indigo-500/40',
      badge: 'bg-indigo-500/20 text-indigo-300',
    },
    emerald: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      glow: 'hover:border-emerald-500/40',
      badge: 'bg-emerald-500/20 text-emerald-300',
    },
    amber: {
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      glow: 'hover:border-amber-500/40',
      badge: 'bg-amber-500/20 text-amber-300',
    },
    rose: {
      bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
      glow: 'hover:border-rose-500/40',
      badge: 'bg-rose-500/20 text-rose-300',
    },
    sky: {
      bg: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
      glow: 'hover:border-sky-500/40',
      badge: 'bg-sky-500/20 text-sky-300',
    },
  };

  const scheme = colorMap[colorScheme];

  return (
    <div
      onClick={onClick}
      className={`glass-card p-5 rounded-2xl transition-all duration-300 ${scheme.glow} ${
        onClick ? 'cursor-pointer hover:-translate-y-1' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-xl border ${scheme.bg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{value}</div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            {trend && (
              <span className={`font-medium ${trendPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {trend}
              </span>
            )}
            {subtitle && <span className="text-slate-400">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
