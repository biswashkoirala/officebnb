import { Sparkles } from 'lucide-react';

export default function DemoBadge() {
  return (
    <div className="fixed bottom-4 left-4 z-40 hidden items-center gap-1.5 rounded-full border border-ink-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-ink-500 shadow-card backdrop-blur sm:flex">
      <Sparkles size={13} className="text-brand-500" />
      Demo Mode — mock data, no real payments
    </div>
  );
}
