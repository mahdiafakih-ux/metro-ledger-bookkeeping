export function BarList({ items, formatValue }: { items: { label: string; revenue: number }[]; formatValue?: (v: number) => string }) {
  if (items.length === 0) return <p className="py-10 text-center text-sm text-navy-400">No data yet</p>;
  const max = Math.max(...items.map((i) => i.revenue), 1);
  const fmt = formatValue ?? ((v: number) => `$${v.toLocaleString()}`);

  return (
    <div className="space-y-3">
      {items.map((item: any) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-navy-700">{item.label}</span>
            <span className="font-semibold text-navy-900">{fmt(item.revenue)}</span>
          </div>
          <div className="h-2 rounded-full bg-navy-100">
            <div className="h-full rounded-full bg-accent-500" style={{ width: `${(item.revenue / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
