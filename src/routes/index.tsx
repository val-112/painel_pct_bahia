import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useMemo, useState } from "react";
import {
  aggregateByMunicipio,
  aggregateByRpga,
  aggregateByTerritorio,
  applyFilters,
  emptyFilters,
  loadPctData,
  type Filters,
  type PctRecord,
} from "@/lib/pct";
import { KpiCards } from "@/components/pct/KpiCards";
import { FilterPanel } from "@/components/pct/FilterPanel";
import { ChartsPanel } from "@/components/pct/ChartsPanel";
import { DataTable } from "@/components/pct/DataTable";
import { LayerControl, type LayerState } from "@/components/pct/LayerControl";
import { AboutDialog } from "@/components/pct/AboutDialog";
import { ActiveFilters } from "@/components/pct/ActiveFilters";

const MapPanel = lazy(() =>
  import("@/components/pct/MapPanel").then((m) => ({ default: m.MapPanel })),
);
const publicUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
const bannerUrl = publicUrl("images/banner.png");
const panelLogoUrl = publicUrl("images/painel-logo.png");
const logoUrl = publicUrl("images/rioz-logo.jpg");

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel de Comunidades Tradicionais da Bahia" },
      {
        name: "description",
        content:
          "Dashboard geoespacial interativo dos Povos e Comunidades Tradicionais (PCT) da Bahia: mapa, filtros, KPIs, gráficos, municípios, Territórios de Identidade e RPGAs.",
      },
      { property: "og:title", content: "Painel de Comunidades Tradicionais da Bahia" },
      {
        property: "og:description",
        content:
          "Visualização territorial interativa dos PCT da Bahia por município, Território de Identidade e RPGA.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["pct-data"],
    queryFn: loadPctData,
    staleTime: Infinity,
  });

  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [layers, setLayers] = useState<LayerState>({
    mode: "geo",
    poly: true,
    pontos: true,
    muniOutline: true,
    territorioOutline: false,
    rpgaOutline: false,
    metric: "total",
  });
  const [focus, setFocus] = useState<PctRecord | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const filtered = useMemo(() => (data ? applyFilters(data.base, filters) : []), [data, filters]);
  const muniAgg = useMemo(() => aggregateByMunicipio(filtered), [filtered]);
  const territorioAgg = useMemo(() => aggregateByTerritorio(filtered), [filtered]);
  const rpgaAgg = useMemo(() => aggregateByRpga(filtered), [filtered]);
  const filteredIds = useMemo(() => new Set(filtered.map((r) => r.id)), [filtered]);

  const muniNameByCode = useMemo(() => {
    const m = new Map<string, string>();
    data?.base.forEach((r) => m.set(r.codigo, r.municipio));
    return m;
  }, [data]);

  const chipValues = {
    municipio: filters.municipio
      ? (muniNameByCode.get(filters.municipio) ?? filters.municipio)
      : null,
    territorio: filters.territorio,
    rpga: filters.rpga,
    tipo: filters.tipo,
    fonte: filters.fonte,
    espacial: filters.espacial,
    search: filters.search || null,
  };

  const onRow = (r: PctRecord) => {
    setFocus(r);
    if (r.espacial === "Ponto") setLayers((l) => ({ ...l, mode: "geo", pontos: true }));
    else if (r.espacial === "Polígono") setLayers((l) => ({ ...l, mode: "geo", poly: true }));
    else setLayers((l) => ({ ...l, mode: "muni" }));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="relative overflow-hidden border-b border-border">
        <img
          src={bannerUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-card/70 via-card/30 to-card/55" />
        <div className="relative mx-auto flex max-w-[1700px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-6 sm:py-7">
          <h1 className="min-w-0 max-w-full flex-1">
            <img
              src={panelLogoUrl}
              alt="Painel de Comunidades Tradicionais da Bahia"
              className="h-auto max-h-24 w-full max-w-[760px] rounded-md bg-white/95 p-2 shadow-sm ring-1 ring-white/70"
            />
          </h1>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card/85 px-3 py-1.5 shadow-sm backdrop-blur">
              <AboutDialog />
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                v1.0
              </span>
              <span className="hidden text-[11px] font-semibold text-foreground/80 sm:block">
                © Valdenir Barbosa · Instituto Rios e Raízes
              </span>
            </div>
            <img
              src={logoUrl}
              alt="Instituto Rios e Raízes"
              className="h-11 w-11 shrink-0 rounded-full bg-white p-0.5 shadow-md ring-1 ring-border"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1700px] space-y-4 px-4 py-4">
        {isLoading && (
          <div className="py-20 text-center text-muted-foreground">
            Carregando dados territoriais…
          </div>
        )}
        {error && (
          <div className="py-20 text-center text-destructive">Erro ao carregar os dados.</div>
        )}

        {data && (
          <>
            <KpiCards records={filtered} />
            <ActiveFilters
              filters={chipValues}
              labels={{
                municipio: "Município",
                territorio: "Território de identidade",
                rpga: "RPGA",
                tipo: "Tipo",
                fonte: "Fonte",
                espacial: "Espacial",
                search: "Busca",
              }}
              onRemove={(k) => setFilters({ ...filters, [k]: k === "search" ? "" : null })}
            />

            <div className="flex flex-col gap-4 lg:flex-row">
              {sidebarOpen && (
                <aside className="thin-scroll w-full shrink-0 space-y-5 self-start rounded-lg border border-border bg-card p-4 shadow-sm lg:max-h-[78vh] lg:w-72 lg:overflow-auto">
                  <LayerControl layers={layers} setLayers={setLayers} />
                  <div className="border-t border-border pt-4">
                    <FilterPanel
                      data={data}
                      filters={filters}
                      setFilters={setFilters}
                      onClear={() => setFilters(emptyFilters)}
                    />
                  </div>
                </aside>
              )}

              <section className="relative min-h-[60vh] flex-1 lg:h-[78vh]">
                <button
                  onClick={() => setSidebarOpen((o) => !o)}
                  className="absolute left-2 top-2 z-[500] rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground shadow hover:bg-accent"
                >
                  {sidebarOpen ? "◀ Ocultar painel" : "▶ Painel"}
                </button>
                <Suspense
                  fallback={
                    <div className="flex h-full items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      Carregando mapa…
                    </div>
                  }
                >
                  <MapPanel
                    data={data}
                    muniAgg={muniAgg}
                    territorioAgg={territorioAgg}
                    rpgaAgg={rpgaAgg}
                    filteredIds={filteredIds}
                    layers={layers}
                    selectedMuni={filters.municipio}
                    selectedTerritorio={filters.territorio}
                    selectedRpga={filters.rpga}
                    focus={focus}
                    onMuniClick={(c) =>
                      setFilters((f) => ({ ...f, municipio: f.municipio === c ? null : c }))
                    }
                    onRpgaClick={(n) =>
                      setFilters((f) => ({ ...f, rpga: f.rpga === n ? null : n }))
                    }
                    onTerritorioClick={(n) =>
                      setFilters((f) => ({
                        ...f,
                        territorio: f.territorio === n ? null : n,
                      }))
                    }
                  />
                </Suspense>
              </section>
            </div>

            <ChartsPanel records={filtered} filters={filters} setFilters={setFilters} />

            <DataTable records={filtered} onRowClick={onRow} selectedId={focus?.id ?? null} />

            <footer className="space-y-1 py-4 text-center text-xs text-muted-foreground">
              <div>
                Dados: base analítica PCT · {data.base.length.toLocaleString("pt-BR")} registros ·
                camadas municipais, territórios de identidade, RPGA, polígonos e pontos.
              </div>
              <div className="font-medium text-foreground/80">
                © Valdenir Barbosa | Instituto Rios e Raízes | v1.0
              </div>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
