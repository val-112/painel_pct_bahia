import {
  choroBuckets,
  choroColor,
  rpgaChoroColor,
  LAYER_COLORS,
  type MetricKey,
  METRIC_LABEL,
} from "@/lib/pct";
import type { MapMode } from "./LayerControl";

interface Props {
  mode: MapMode;
  maxVal: number;
  rpgaMax: number;
  metric: MetricKey;
  showRpga: boolean;
  showPoly: boolean;
  showPontos: boolean;
  showMuniOutline: boolean;
}

function buildRanges(buckets: number[], colorFn: (v: number, b: number[]) => string) {
  const ranges: Array<{ color: string; label: string }> = [];
  ranges.push({ color: colorFn(0, buckets), label: "Sem registro" });
  let prev = 1;
  buckets.forEach((b) => {
    ranges.push({ color: colorFn(b, buckets), label: prev === b ? `${b}` : `${prev}–${b}` });
    prev = b + 1;
  });
  ranges.push({
    color: colorFn((buckets[buckets.length - 1] ?? 0) + 1, buckets),
    label: `${prev}+`,
  });
  return ranges;
}

export function Legend({
  mode,
  maxVal,
  rpgaMax,
  metric,
  showRpga,
  showPoly,
  showPontos,
  showMuniOutline,
}: Props) {
  const showMuniChoro = mode === "muni";
  const showRpgaChoro = mode === "rpga";

  const muniRanges = showMuniChoro ? buildRanges(choroBuckets(maxVal), choroColor) : [];
  const rpgaRanges = showRpgaChoro ? buildRanges(choroBuckets(rpgaMax), rpgaChoroColor) : [];

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-[500] max-w-[240px] rounded-lg border border-border bg-card/95 p-3 text-xs shadow-md backdrop-blur">
      {showMuniChoro && (
        <>
          <div className="mb-1.5 font-semibold text-foreground">
            {METRIC_LABEL[metric]} por município
          </div>
          <div className="space-y-1">
            {muniRanges.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-5 rounded-sm border border-black/10"
                  style={{ background: r.color }}
                />
                <span className="text-muted-foreground">{r.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {showRpgaChoro && (
        <>
          <div className="mb-1.5 font-semibold text-foreground">Total de comunidades por RPGA</div>
          <div className="space-y-1">
            {rpgaRanges.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-5 rounded-sm border border-black/10"
                  style={{ background: r.color }}
                />
                <span className="text-muted-foreground">{r.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {(showRpga || showPoly || showPontos || showMuniOutline) && (
        <div
          className={`space-y-1 ${showMuniChoro || showRpgaChoro ? "mt-2 border-t border-border pt-2" : ""}`}
        >
          {showPoly && (
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-5 rounded-sm border-2"
                style={{ borderColor: LAYER_COLORS.poly, background: `${LAYER_COLORS.poly}33` }}
              />
              <span className="text-muted-foreground">Polígono PCT</span>
            </div>
          )}
          {showPontos && (
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full border border-white"
                style={{ background: LAYER_COLORS.ponto }}
              />
              <span className="text-muted-foreground">Ponto PCT</span>
            </div>
          )}
          {showMuniOutline && (
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-5 rounded-sm border-2 bg-transparent"
                style={{ borderColor: LAYER_COLORS.municipio }}
              />
              <span className="text-muted-foreground">Limite municipal</span>
            </div>
          )}
          {showRpga && (
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-5 rounded-sm border-2 bg-transparent"
                style={{ borderColor: LAYER_COLORS.rpga }}
              />
              <span className="text-muted-foreground">RPGA / bacia</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
