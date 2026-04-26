interface StatItem {
  label: string;
  value: string | number;
}

interface Props {
  items: StatItem[];
}

export function ResultStatsGrid({ items }: Props) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 max-[960px]:grid-cols-1">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-md border-2 border-foreground p-3 bg-muted"
        >
          <span className="block text-[0.78rem] uppercase tracking-[0.12em] text-muted-fg">
            {label}
          </span>
          <strong className="text-[1.25rem] font-heading">{value}</strong>
        </div>
      ))}
    </div>
  );
}
