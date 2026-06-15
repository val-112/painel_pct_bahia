interface Props {
  filters: Record<string, any>;
  labels: Record<string, string>;
  onRemove: (key: string) => void;
}

export function ActiveFilters({ filters, labels, onRemove }: Props) {
  const chips = Object.entries(filters).filter(([, v]) => v != null && v !== "");
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-muted-foreground">Filtros ativos:</span>
      {chips.map(([key, value]) => (
        <button
          key={key}
          onClick={() => onRemove(key)}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <span className="text-muted-foreground">{labels[key]}:</span>
          <span className="max-w-[180px] truncate">{String(value)}</span>
          <span aria-hidden className="font-bold">
            ×
          </span>
        </button>
      ))}
    </div>
  );
}
