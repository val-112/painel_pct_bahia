import { METRIC_LABEL, type MetricKey } from "@/lib/pct";
import { Layers3, MapPinned, Waves, Map as MapIcon, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type MapMode = "geo" | "muni" | "rpga";

export interface LayerState {
  mode: MapMode;
  poly: boolean;
  pontos: boolean;
  rpgaOutline: boolean;
  metric: MetricKey;
}

interface Props {
  layers: LayerState;
  setLayers: (l: LayerState) => void;
}

function Toggle({ checked, onChange, label, dot }: { checked: boolean; onChange: (v: boolean) => void; label: string; dot: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />
      <span className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: dot }} />
      <span className="text-foreground">{label}</span>
    </label>
  );
}

const MODES: Array<{ id: MapMode; label: string; icon: LucideIcon; hint: string }> = [
  {
    id: "geo",
    label: "Localização dos territórios",
    icon: MapPinned,
    hint: "Mostra os pontos e polígonos das comunidades. Ligue/desligue pontos, polígonos e RPGAs/bacias.",
  },
  {
    id: "muni",
    label: "Dados por município",
    icon: MapIcon,
    hint: "Escala de cores por município com o total geral de comunidades (polígono, ponto e somente município).",
  },
  {
    id: "rpga",
    label: "Dados por RPGA",
    icon: Waves,
    hint: "Escala de cores por RPGA/bacia com o total geral de comunidades. Clique em uma RPGA para detalhes.",
  },
];

export function LayerControl({ layers, setLayers }: Props) {
  const setMode = (id: MapMode) => {
    if (id === "geo") setLayers({ ...layers, mode: "geo", poly: true, pontos: true });
    else setLayers({ ...layers, mode: id });
  };

  return (
    <div className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
        <Layers3 className="h-4 w-4 text-primary" />
        Modos do mapa
      </h2>

      <div className="grid grid-cols-1 gap-1.5">
        {MODES.map((m) => {
          const active = layers.mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              aria-pressed={active}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-semibold transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-input bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              <m.icon className="h-4 w-4 shrink-0" />
              {m.label}
            </button>
          );
        })}
      </div>

      <p className="flex gap-1.5 rounded-md bg-muted/60 px-2 py-1.5 text-[11px] leading-snug text-muted-foreground">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
        {MODES.find((m) => m.id === layers.mode)?.hint}
      </p>

      {layers.mode === "geo" && (
        <div className="border-t border-border pt-2">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Camadas</div>
          <Toggle label="Polígonos PCT" dot="#c2632f" checked={layers.poly} onChange={(v) => setLayers({ ...layers, poly: v })} />
          <Toggle label="Pontos PCT" dot="#1b4f7e" checked={layers.pontos} onChange={(v) => setLayers({ ...layers, pontos: v })} />
          <Toggle label="RPGAs / Bacias" dot="#c79a3a" checked={layers.rpgaOutline} onChange={(v) => setLayers({ ...layers, rpgaOutline: v })} />
        </div>
      )}

      {layers.mode === "muni" && (
        <div className="border-t border-border pt-2">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Métrica</div>
          <select
            value={layers.metric}
            onChange={(e) => setLayers({ ...layers, metric: e.target.value as MetricKey })}
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
          >
            {(Object.keys(METRIC_LABEL) as MetricKey[]).map((k) => (
              <option key={k} value={k}>
                {METRIC_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
