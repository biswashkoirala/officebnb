import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  accent?: 'brand' | 'amber' | 'ink';
}

const accentClasses = {
  brand: 'bg-brand-50 text-brand-600',
  amber: 'bg-amber-glow/15 text-amber-glow',
  ink: 'bg-ink-100 text-ink-700',
};

export default function StatsCard({ label, value, icon: Icon, trend, accent = 'brand' }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClasses[accent]}`}>
          <Icon size={18} />
        </span>
        {trend && (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-2xl font-bold text-ink-950">{value}</p>
      <p className="mt-1 text-sm text-ink-500">{label}</p>
    </div>
  );
}
