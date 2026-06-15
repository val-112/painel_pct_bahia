// Domain types + data loading + aggregation helpers for the PCT Bahia dashboard.

export type Espacial = "Polígono" | "Ponto" | "Município";

export interface PctRecord {
  id: string;
  nome: string;
  tipo: string;
  municipio: string;
  codigo: string;
  numRegistro: string;
  dataRegistro: string;
  etnia: string;
  fonte: string;
  maisDeUma: string;
  espacial: Espacial;
  lat: string;
  long: string;
  rpga: string;
}

export interface Filters {
  municipio: string | null; // codigo
  rpga: string | null;
  tipo: string | null;
  fonte: string | null;
  espacial: Espacial | null;
  search: string;
}

export const emptyFilters: Filters = {
  municipio: null,
  rpga: null,
  tipo: null,
  fonte: null,
  espacial: null,
  search: "",
};

type GeoJSONProperty = string | number | boolean | null | undefined;

export type GeoJSON = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: unknown;
    properties: Record<string, GeoJSONProperty>;
  }>;
};

export interface PctData {
  base: PctRecord[];
  municipios: GeoJSON;
  rpga: GeoJSON;
  poligonal: GeoJSON;
  pontos: GeoJSON;
}

const publicUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

export async function loadPctData(): Promise<PctData> {
  const [base, municipios, rpga, poligonal, pontos] = await Promise.all([
    fetch(publicUrl("data/base.json")).then((r) => r.json()),
    fetch(publicUrl("data/municipios.geojson")).then((r) => r.json()),
    fetch(publicUrl("data/rpga.geojson")).then((r) => r.json()),
    fetch(publicUrl("data/poligonal.geojson")).then((r) => r.json()),
    fetch(publicUrl("data/pontos.geojson")).then((r) => r.json()),
  ]);
  return { base, municipios, rpga, poligonal, pontos };
}

export function applyFilters(records: PctRecord[], f: Filters): PctRecord[] {
  const q = f.search.trim().toLowerCase();
  return records.filter((r) => {
    if (f.municipio && r.codigo !== f.municipio) return false;
    if (f.rpga && r.rpga !== f.rpga) return false;
    if (f.tipo && r.tipo !== f.tipo) return false;
    if (f.fonte && r.fonte !== f.fonte) return false;
    if (f.espacial && r.espacial !== f.espacial) return false;
    if (
      q &&
      !(
        r.nome.toLowerCase().includes(q) ||
        r.municipio.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      )
    )
      return false;
    return true;
  });
}

export interface MuniAgg {
  codigo: string;
  municipio: string;
  total: number;
  poligono: number;
  ponto: number;
  municipioOnly: number;
  byTipo: Record<string, number>;
  byFonte: Record<string, number>;
}

export function aggregateByMunicipio(records: PctRecord[]): Map<string, MuniAgg> {
  const m = new Map<string, MuniAgg>();
  for (const r of records) {
    let a = m.get(r.codigo);
    if (!a) {
      a = {
        codigo: r.codigo,
        municipio: r.municipio,
        total: 0,
        poligono: 0,
        ponto: 0,
        municipioOnly: 0,
        byTipo: {},
        byFonte: {},
      };
      m.set(r.codigo, a);
    }
    a.total++;
    if (r.espacial === "Polígono") a.poligono++;
    else if (r.espacial === "Ponto") a.ponto++;
    else a.municipioOnly++;
    a.byTipo[r.tipo] = (a.byTipo[r.tipo] || 0) + 1;
    a.byFonte[r.fonte] = (a.byFonte[r.fonte] || 0) + 1;
  }
  return m;
}

export interface RpgaAgg {
  nome: string;
  total: number;
  poligono: number;
  ponto: number;
  municipioOnly: number;
  municipios: Set<string>;
  byTipo: Record<string, number>;
}

export function aggregateByRpga(records: PctRecord[]): Map<string, RpgaAgg> {
  const m = new Map<string, RpgaAgg>();
  for (const r of records) {
    let a = m.get(r.rpga);
    if (!a) {
      a = {
        nome: r.rpga,
        total: 0,
        poligono: 0,
        ponto: 0,
        municipioOnly: 0,
        municipios: new Set(),
        byTipo: {},
      };
      m.set(r.rpga, a);
    }
    a.total++;
    if (r.espacial === "Polígono") a.poligono++;
    else if (r.espacial === "Ponto") a.ponto++;
    else a.municipioOnly++;
    a.municipios.add(r.codigo);
    a.byTipo[r.tipo] = (a.byTipo[r.tipo] || 0) + 1;
  }
  return m;
}

export function countBy<T extends string>(
  records: PctRecord[],
  key: (r: PctRecord) => T,
): Array<{ name: T; value: number }> {
  const m = new Map<T, number>();
  for (const r of records) m.set(key(r), (m.get(key(r)) || 0) + 1);
  return [...m.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export type MetricKey = "total" | "poligono" | "ponto" | "municipioOnly";

export const METRIC_LABEL: Record<MetricKey, string> = {
  total: "Total geral",
  poligono: "Com poligonal",
  ponto: "Com ponto",
  municipioOnly: "Somente município",
};

// Neutral light gray for "no records" — clearly distinct from the lightest
// blue step so empty municipalities never get confused with low-count ones.
export const CHORO_ZERO = "#e7e2d8";

// Sequential blue scale for the municipal choropleth. The first step is already
// a saturated light blue so municipalities with few records stay visible.
const CHORO_STEPS = ["#cfe3f0", "#a3c9e3", "#73aad2", "#4988bd", "#2f679f", "#1f4a78", "#123150"];

// Sequential orange/earth scale for the RPGA choropleth — warm ramp that
// reads as a clearly different family from the blue municipal map.
export const RPGA_CHORO_ZERO = "#e7e2d8";
const RPGA_STEPS = ["#f7ddc2", "#eebd92", "#e29c64", "#d27d3e", "#bb5f29", "#99481f", "#763516"];

// Fixed, cartographically legible class breaks. Highly skewed data (1 → 147),
// so equal-interval hides low counts; these "nice" breaks keep them visible.
const BREAK_TEMPLATE = [1, 4, 9, 24, 49, 99];

export function choroBuckets(maxVal: number): number[] {
  if (maxVal <= 1) return [];
  const out = BREAK_TEMPLATE.filter((b) => b < maxVal);
  return out.length ? out : [Math.max(1, Math.ceil(maxVal / 2))];
}

function colorFromSteps(value: number, buckets: number[], steps: string[], zero: string): string {
  if (value <= 0) return zero;
  let idx = 0;
  while (idx < buckets.length && value > buckets[idx]) idx++;
  return steps[Math.min(idx, steps.length - 1)];
}

export function choroColor(value: number, buckets: number[]): string {
  return colorFromSteps(value, buckets, CHORO_STEPS, CHORO_ZERO);
}

export function rpgaChoroColor(value: number, buckets: number[]): string {
  return colorFromSteps(value, buckets, RPGA_STEPS, RPGA_CHORO_ZERO);
}

export { CHORO_STEPS, RPGA_STEPS };

// Brand-aligned categorical palette: navy, orange, gold, light blue, teal…
export const TIPO_COLORS = [
  "#234e78",
  "#c2632f",
  "#c79a3a",
  "#5e8fbd",
  "#2f7d6e",
  "#9c5b3b",
  "#7a86b8",
  "#a98a2e",
  "#3a6c9e",
  "#bf7a52",
];

// Layer styling colors (kept in one place for legend + map consistency).
export const LAYER_COLORS = {
  rpga: "#c79a3a", // gold dashed outline
  poly: "#c2632f", // orange polygons
  ponto: "#1b4f7e", // deep blue points
  municipio: "#6f7f88", // subtle municipal reference outline
};

export function colorForIndex(i: number): string {
  return TIPO_COLORS[i % TIPO_COLORS.length];
}
