import type { PctRecord } from "@/lib/pct";
import { aggregateByMunicipio } from "@/lib/pct";
import { useMemo } from "react";
import { Users, Hexagon, MapPin, Building2, Map, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Props {
  records: PctRecord[];
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 shadow-sm transition-shadow hover:shadow-md">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold leading-none tabular-nums text-foreground">
          {value.toLocaleString("pt-BR")}
        </div>
        <div className="mt-1 text-[11px] font-medium leading-tight text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export function KpiCards({ records }: Props) {
  const k = useMemo(() => {
    let poligono = 0,
      ponto = 0,
      municipioOnly = 0;
    for (const r of records) {
      if (r.espacial === "Polígono") poligono++;
      else if (r.espacial === "Ponto") ponto++;
      else municipioOnly++;
    }
    const municipios = aggregateByMunicipio(records).size;
    const rpgas = new Set(records.map((r) => r.rpga).filter((v) => v && v !== "Não atribuída")).size;
    return { total: records.length, poligono, ponto, municipioOnly, municipios, rpgas };
  }, [records]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Kpi label="Total geral de comunidades" value={k.total} icon={Users} tone="bg-primary/10 text-primary" />
      <Kpi label="Total com poligonal" value={k.poligono} icon={Hexagon} tone="bg-brand-orange/15 text-brand-orange" />
      <Kpi label="Total somente ponto" value={k.ponto} icon={MapPin} tone="bg-brand-blue/15 text-brand-blue" />
      <Kpi label="Total somente município" value={k.municipioOnly} icon={Building2} tone="bg-brand-gold/20 text-brand-gold" />
      <Kpi label="Municípios com registros" value={k.municipios} icon={Map} tone="bg-primary/10 text-primary" />
      <Kpi label="RPGAs/bacias com registros" value={k.rpgas} icon={Waves} tone="bg-brand-blue/15 text-brand-blue" />
    </div>
  );
}
