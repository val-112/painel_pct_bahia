import type { Filters, PctData, Espacial } from "@/lib/pct";
import { useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";

interface Props {
  data: PctData;
  filters: Filters;
  setFilters: (f: Filters) => void;
  onClear: () => void;
}

const ESPACIAIS: Espacial[] = ["Polígono", "Ponto", "Município"];

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string | null) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterPanel({ data, filters, setFilters, onClear }: Props) {
  const opts = useMemo(() => {
    const muni = new Map<string, string>();
    const tipos = new Set<string>();
    const fontes = new Set<string>();
    const territorios = new Set<string>();
    const rpgas = new Set<string>();
    for (const r of data.base) {
      muni.set(r.codigo, r.municipio);
      if (r.territorio) territorios.add(r.territorio);
      if (r.tipo) tipos.add(r.tipo);
      if (r.fonte) fontes.add(r.fonte);
      if (r.rpga) rpgas.add(r.rpga);
    }
    return {
      municipios: [...muni.entries()]
        .map(([value, label]) => ({ value, label: `${label}` }))
        .sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
      tipos: [...tipos]
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
        .map((v) => ({ value: v, label: v })),
      fontes: [...fontes]
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
        .map((v) => ({ value: v, label: v })),
      territorios: [...territorios]
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
        .map((v) => ({ value: v, label: v })),
      rpgas: [...rpgas]
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
        .map((v) => ({ value: v, label: v })),
    };
  }, [data.base]);

  const set = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch });

  const activeCount =
    (filters.municipio ? 1 : 0) +
    (filters.territorio ? 1 : 0) +
    (filters.rpga ? 1 : 0) +
    (filters.tipo ? 1 : 0) +
    (filters.fonte ? 1 : 0) +
    (filters.espacial ? 1 : 0) +
    (filters.search ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Filtros
        </h2>
        {activeCount > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {activeCount} ativo{activeCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted-foreground">
          Buscar comunidade
        </span>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Nome, município ou ID…"
          className="w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </label>

      <Select
        label="Município"
        value={filters.municipio}
        options={opts.municipios}
        onChange={(v) => set({ municipio: v })}
      />
      <Select
        label="Território de identidade"
        value={filters.territorio}
        options={opts.territorios}
        onChange={(v) => set({ territorio: v })}
      />
      <Select
        label="RPGA / Bacia"
        value={filters.rpga}
        options={opts.rpgas}
        onChange={(v) => set({ rpga: v })}
      />
      <Select
        label="Tipo de comunidade"
        value={filters.tipo}
        options={opts.tipos}
        onChange={(v) => set({ tipo: v })}
      />
      <Select
        label="Fonte do dado"
        value={filters.fonte}
        options={opts.fontes}
        onChange={(v) => set({ fonte: v })}
      />
      <Select
        label="Tipo de dado espacial"
        value={filters.espacial}
        options={ESPACIAIS.map((v) => ({ value: v, label: v }))}
        onChange={(v) => set({ espacial: (v as Espacial) || null })}
      />

      <button
        onClick={onClear}
        disabled={activeCount === 0}
        className="w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        Limpar filtros
      </button>
    </div>
  );
}
