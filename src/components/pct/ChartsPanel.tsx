import { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend as RLegend,
} from "recharts";
import { BarChart3, PieChart as PieIcon, Building2, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  aggregateByMunicipio,
  aggregateByRpga,
  colorForIndex,
  countBy,
  LAYER_COLORS,
  type Filters,
  type PctRecord,
} from "@/lib/pct";

interface Props {
  records: PctRecord[];
  filters: Filters;
  setFilters: (f: Filters) => void;
}

function Card({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h3>
      <div className="h-56">{children}</div>
    </div>
  );
}

const TIPO_TOP = 15;

export function ChartsPanel({ records, filters, setFilters }: Props) {
  const byTipo = useMemo(() => {
    const all = countBy(records, (r) => r.tipo);
    if (all.length <= TIPO_TOP) return all;
    const top = all.slice(0, TIPO_TOP);
    const rest = all.slice(TIPO_TOP).reduce((s, d) => s + d.value, 0);
    return [...top, { name: "Outros", value: rest }];
  }, [records]);

  const byFonte = useMemo(() => countBy(records, (r) => r.fonte), [records]);
  const topMuni = useMemo(() => {
    const agg = [...aggregateByMunicipio(records).values()].sort((a, b) => b.total - a.total).slice(0, 10);
    return agg.map((a) => ({ name: a.municipio, value: a.total, codigo: a.codigo }));
  }, [records]);
  const topRpga = useMemo(() => {
    const agg = [...aggregateByRpga(records).values()]
      .filter((a) => a.nome && a.nome !== "Não atribuída")
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
    return agg.map((a) => ({ name: a.nome, value: a.total }));
  }, [records]);
  const rpgaMax = Math.max(1, ...topRpga.map((r) => r.value));

  const toggle = (patch: Partial<Filters>, current: string | null, value: string) =>
    setFilters({ ...filters, ...(current === value ? Object.fromEntries(Object.keys(patch).map((k) => [k, null])) : patch) });

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {/* Tipos de comunidade — horizontal bars */}
      <Card title="Tipos de comunidade" icon={BarChart3}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byTipo} layout="vertical" margin={{ left: 8, right: 24 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
            <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={(d: any) => d.name !== "Outros" && toggle({ tipo: d.name }, filters.tipo, d.name)}
            >
              {byTipo.map((d, i) => (
                <Cell key={i} fill={d.name === "Outros" ? "#9aa6ad" : colorForIndex(i)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Fonte do dado — donut */}
      <Card title="Fonte dos dados" icon={PieIcon}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={byFonte}
              dataKey="value"
              nameKey="name"
              cx="38%"
              cy="50%"
              innerRadius={42}
              outerRadius={78}
              paddingAngle={1.5}
              onClick={(d: any) => toggle({ fonte: d.name }, filters.fonte, d.name)}
            >
              {byFonte.map((_, i) => (
                <Cell key={i} fill={colorForIndex(i)} cursor="pointer" />
              ))}
            </Pie>
            <Tooltip />
            <RLegend layout="vertical" align="right" verticalAlign="middle" iconSize={9} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Top municípios — horizontal bars */}
      <Card title="Top municípios com mais comunidades" icon={Building2}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topMuni} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
            <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Bar
              dataKey="value"
              fill="var(--color-primary)"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={(d: any) => toggle({ municipio: d.codigo }, filters.municipio, d.codigo)}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* RPGAs — lollipop / dot plot */}
      <Card title="RPGAs com mais comunidades" icon={Waves}>
        <div className="thin-scroll flex h-full flex-col justify-center gap-2 overflow-auto pr-1">
          {topRpga.length === 0 && <p className="text-center text-xs text-muted-foreground">Sem dados.</p>}
          {topRpga.map((r) => {
            const active = filters.rpga === r.name;
            return (
              <button
                key={r.name}
                onClick={() => toggle({ rpga: r.name }, filters.rpga, r.name)}
                className="group grid grid-cols-[140px_1fr_auto] items-center gap-2 text-left"
                title={r.name}
              >
                <span className={`truncate text-[11px] ${active ? "font-bold text-primary" : "text-foreground"}`}>
                  {r.name.replace(/^RPGA d[oae]s?\s*/i, "")}
                </span>
                <span className="relative flex items-center">
                  <span className="h-[2px] w-full rounded bg-border" />
                  <span
                    className="absolute h-[6px] rounded-full transition-all"
                    style={{ width: `${(r.value / rpgaMax) * 100}%`, background: LAYER_COLORS.rpga, opacity: active ? 1 : 0.8 }}
                  />
                  <span
                    className="absolute h-3 w-3 -translate-x-1/2 rounded-full border-2 border-card shadow"
                    style={{ left: `${(r.value / rpgaMax) * 100}%`, background: active ? "var(--color-primary)" : LAYER_COLORS.poly }}
                  />
                </span>
                <span className="w-7 text-right text-[11px] font-semibold tabular-nums text-muted-foreground">{r.value}</span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
