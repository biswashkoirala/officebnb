interface RevenueChartProps {
  data: { day: string; value: number }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const max = Math.max(...data.map((d) => d.value));

  return (
    <div className="flex h-56 items-end gap-3 sm:gap-5">
      {data.map((d) => {
        const heightPct = Math.max(6, Math.round((d.value / max) * 100));
        return (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-xs font-semibold text-ink-700">${d.value}</span>
            <div className="flex h-40 w-full items-end overflow-hidden rounded-lg bg-ink-50">
              <div
                className="w-full rounded-lg bg-gradient-to-t from-brand-600 to-brand-400 transition-all duration-500"
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-xs text-ink-400">{d.day.slice(0, 3)}</span>
          </div>
        );
      })}
    </div>
  );
}
