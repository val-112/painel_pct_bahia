/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Popup,
  LayersControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  choroBuckets,
  choroColor,
  rpgaChoroColor,
  territorioChoroColor,
  LAYER_COLORS,
  METRIC_LABEL,
  type MetricKey,
  type MuniAgg,
  type RpgaAgg,
  type TerritorioAgg,
  type PctData,
  type PctRecord,
} from "@/lib/pct";
import type { LayerState } from "./LayerControl";
import { Legend } from "./Legend";

interface Props {
  data: PctData;
  muniAgg: Map<string, MuniAgg>;
  territorioAgg: Map<string, TerritorioAgg>;
  rpgaAgg: Map<string, RpgaAgg>;
  filteredIds: Set<string>;
  layers: LayerState;
  selectedMuni: string | null;
  selectedTerritorio: string | null;
  selectedRpga: string | null;
  focus: PctRecord | null;
  onMuniClick: (codigo: string) => void;
  onTerritorioClick: (nome: string) => void;
  onRpgaClick: (nome: string) => void;
}

const BAHIA_CENTER: [number, number] = [-12.5, -41.7];

function metricVal(a: MuniAgg | undefined, m: MetricKey): number {
  if (!a) return 0;
  return m === "total"
    ? a.total
    : m === "poligono"
      ? a.poligono
      : m === "ponto"
        ? a.ponto
        : a.municipioOnly;
}

function topEntries(rec: Record<string, number>, n = 3): string {
  return (
    Object.entries(rec)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k, v]) => `${k} (${v})`)
      .join(", ") || "—"
  );
}

function FocusController({ data, focus }: { data: PctData; focus: PctRecord | null }) {
  const map = useMap();
  useEffect(() => {
    if (!focus) return;
    try {
      if (focus.espacial === "Ponto" && focus.lat && focus.long) {
        map.flyTo([parseFloat(focus.lat), parseFloat(focus.long)], 11, { duration: 0.8 });
      } else if (focus.espacial === "Polígono") {
        const f = data.poligonal.features.find((x) => x.properties?.id === focus.id);
        if (f) map.flyToBounds(L.geoJSON(f as any).getBounds(), { duration: 0.8, maxZoom: 11 });
      } else {
        const f = data.municipios.features.find((x) => x.properties?.codigo === focus.codigo);
        if (f) map.flyToBounds(L.geoJSON(f as any).getBounds(), { duration: 0.8, maxZoom: 9 });
      }
    } catch {
      /* noop */
    }
  }, [focus, map, data]);
  return null;
}

export function MapPanel({
  data,
  muniAgg,
  territorioAgg,
  rpgaAgg,
  filteredIds,
  layers,
  selectedMuni,
  selectedTerritorio,
  selectedRpga,
  focus,
  onMuniClick,
  onTerritorioClick,
  onRpgaClick,
}: Props) {
  const showMuniChoro = layers.mode === "muni";
  const showTerritorioChoro = layers.mode === "territorio";
  const showRpgaChoro = layers.mode === "rpga";
  const showRpgaOutline = layers.mode === "geo" && layers.rpgaOutline;
  const showTerritorioOutline = layers.mode === "geo" && layers.territorioOutline;
  const showPoly = layers.mode === "geo" && layers.poly;
  const showPontos = layers.mode === "geo" && layers.pontos;
  const showMuniOutline = layers.mode === "geo" && layers.muniOutline;

  const maxVal = useMemo(() => {
    let mx = 0;
    for (const a of muniAgg.values()) mx = Math.max(mx, metricVal(a, layers.metric));
    return mx;
  }, [muniAgg, layers.metric]);

  const rpgaMax = useMemo(() => {
    let mx = 0;
    for (const a of rpgaAgg.values()) mx = Math.max(mx, a.total);
    return mx;
  }, [rpgaAgg]);

  const territorioMax = useMemo(() => {
    let mx = 0;
    for (const a of territorioAgg.values()) mx = Math.max(mx, a.total);
    return mx;
  }, [territorioAgg]);

  const buckets = useMemo(() => choroBuckets(maxVal), [maxVal]);
  const territorioBuckets = useMemo(() => choroBuckets(territorioMax), [territorioMax]);
  const rpgaBuckets = useMemo(() => choroBuckets(rpgaMax), [rpgaMax]);

  const polyFC = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: data.poligonal.features.filter((f) => filteredIds.has(f.properties?.id)),
    }),
    [data.poligonal, filteredIds],
  );
  const ptFeatures = useMemo(
    () => data.pontos.features.filter((f) => filteredIds.has(f.properties?.id)),
    [data.pontos, filteredIds],
  );

  const muniStyle = (feature: any) => {
    const code = feature.properties.codigo;
    const v = metricVal(muniAgg.get(code), layers.metric);
    return {
      fillColor: choroColor(v, buckets),
      fillOpacity: 0.88,
      color: selectedMuni === code ? "#123150" : "#aebfcd",
      weight: selectedMuni === code ? 2.5 : 0.5,
    };
  };

  const muniOutlineStyle = (feature: any) => {
    const code = feature.properties.codigo;
    return {
      color: selectedMuni === code ? "#3f4f58" : LAYER_COLORS.municipio,
      weight: selectedMuni === code ? 1.8 : 0.8,
      opacity: selectedMuni === code ? 0.95 : 0.58,
      fillColor: LAYER_COLORS.municipio,
      fillOpacity: selectedMuni === code ? 0.08 : 0.015,
    };
  };

  const territorioStyle = (feature: any) => {
    const nome = feature.properties.nomti;
    const v = territorioAgg.get(nome)?.total ?? 0;
    return {
      fillColor: territorioChoroColor(v, territorioBuckets),
      fillOpacity: 0.85,
      color: selectedTerritorio === nome ? "#0b5654" : "#74aaa6",
      weight: selectedTerritorio === nome ? 3 : 0.9,
    };
  };

  const territorioOutlineStyle = (feature: any) => {
    const nome = feature.properties.nomti;
    return {
      color: selectedTerritorio === nome ? "#0b5654" : LAYER_COLORS.territorio,
      weight: selectedTerritorio === nome ? 3 : 1.6,
      opacity: selectedTerritorio === nome ? 0.95 : 0.65,
      fillColor: LAYER_COLORS.territorio,
      fillOpacity: selectedTerritorio === nome ? 0.1 : 0.025,
      dashArray: "5 3",
    };
  };

  const choroKey = `choro-${layers.metric}-${maxVal}-${filteredIds.size}-${selectedMuni}`;
  const territorioChoroKey = `territoriochoro-${territorioMax}-${filteredIds.size}-${selectedTerritorio}`;
  const territorioKey = `territorio-${selectedTerritorio}`;
  const rpgaChoroKey = `rpgachoro-${rpgaMax}-${filteredIds.size}-${selectedRpga}`;
  const rpgaKey = `rpga-${selectedRpga}`;
  const polyKey = `poly-${polyFC.features.length}`;
  const muniOutlineKey = `muni-outline-${selectedMuni}`;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-border shadow-sm">
      <MapContainer center={BAHIA_CENTER} zoom={6} className="h-full w-full" preferCanvas>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Mapa claro">
            <TileLayer
              attribution="&copy; OpenStreetMap, &copy; CARTO"
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satélite">
            <TileLayer
              attribution="&copy; Esri, Maxar, Earthstar Geographics"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Mapa escuro">
            <TileLayer
              attribution="&copy; OpenStreetMap, &copy; CARTO"
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Municipios choropleth */}
        {showMuniChoro && (
          <GeoJSON
            key={choroKey}
            data={data.municipios as any}
            style={muniStyle as any}
            onEachFeature={(feature: any, layer: any) => {
              const code = feature.properties.codigo;
              layer.on("click", () => onMuniClick(code));
              const a = muniAgg.get(code);
              const html = `<div class="pct-popup"><h4>${feature.properties.municipio}</h4>
                <div class="row"><span>Código</span><span>${code}</span></div>
                <div class="row"><span>RPGA</span><span>${feature.properties.rpga ?? "—"}</span></div>
                <div class="row"><span>Total geral</span><span>${a?.total ?? 0}</span></div>
                <div class="row"><span>Com poligonal</span><span>${a?.poligono ?? 0}</span></div>
                <div class="row"><span>Com ponto</span><span>${a?.ponto ?? 0}</span></div>
                <div class="row"><span>Somente município</span><span>${a?.municipioOnly ?? 0}</span></div>
                <div class="row"><span>Segmentos</span><span>${a ? topEntries(a.byTipo) : "—"}</span></div>
                <div class="row"><span>Fontes</span><span>${a ? topEntries(a.byFonte) : "—"}</span></div>
                <div style="margin-top:6px;font-size:11px;color:#234e78;font-weight:600">Clique para filtrar este município</div></div>`;
              layer.bindPopup(html, { maxWidth: 280 });
            }}
          />
        )}

        {/* Territory Identity choropleth */}
        {showTerritorioChoro && (
          <GeoJSON
            key={territorioChoroKey}
            data={data.territorios as any}
            style={territorioStyle as any}
            onEachFeature={(feature: any, layer: any) => {
              const nome = feature.properties.nomti;
              layer.on("click", () => onTerritorioClick(nome));
              const a = territorioAgg.get(nome);
              const html = `<div class="pct-popup"><h4>${nome}</h4>
                <div class="row"><span>Código</span><span>${feature.properties.codti ?? "—"}</span></div>
                <div class="row"><span>Total geral</span><span>${a?.total ?? 0}</span></div>
                <div class="row"><span>Com poligonal</span><span>${a?.poligono ?? 0}</span></div>
                <div class="row"><span>Somente ponto</span><span>${a?.ponto ?? 0}</span></div>
                <div class="row"><span>Somente município</span><span>${a?.municipioOnly ?? 0}</span></div>
                <div class="row"><span>Municípios</span><span>${a?.municipios.size ?? 0}</span></div>
                <div class="row"><span>Principais segmentos</span><span>${a ? topEntries(a.byTipo) : "—"}</span></div>
                <div style="margin-top:6px;font-size:11px;color:${LAYER_COLORS.territorio};font-weight:600">Clique para filtrar por este território</div></div>`;
              layer.bindPopup(html, { maxWidth: 280 });
            }}
          />
        )}

        {/* RPGA choropleth (Dados por RPGA mode) */}
        {showRpgaChoro && (
          <GeoJSON
            key={rpgaChoroKey}
            data={data.rpga as any}
            style={(feature: any) => {
              const nome = feature.properties.nome;
              const v = rpgaAgg.get(nome)?.total ?? 0;
              return {
                fillColor: rpgaChoroColor(v, rpgaBuckets),
                fillOpacity: 0.85,
                color: selectedRpga === nome ? "#763516" : "#b89a78",
                weight: selectedRpga === nome ? 3 : 0.8,
              } as any;
            }}
            onEachFeature={(feature: any, layer: any) => {
              const nome = feature.properties.nome;
              layer.on("click", () => onRpgaClick(nome));
              const a = rpgaAgg.get(nome);
              const html = `<div class="pct-popup"><h4>${nome}</h4>
                <div class="row"><span>Total geral</span><span>${a?.total ?? 0}</span></div>
                <div class="row"><span>Com poligonal</span><span>${a?.poligono ?? 0}</span></div>
                <div class="row"><span>Somente ponto</span><span>${a?.ponto ?? 0}</span></div>
                <div class="row"><span>Somente município</span><span>${a?.municipioOnly ?? 0}</span></div>
                <div class="row"><span>Municípios</span><span>${a?.municipios.size ?? 0}</span></div>
                <div class="row"><span>Principais segmentos</span><span>${a ? topEntries(a.byTipo) : "—"}</span></div>
                <div style="margin-top:6px;font-size:11px;color:#bb5f29;font-weight:600">Clique para filtrar por esta RPGA</div></div>`;
              layer.bindPopup(html, { maxWidth: 280 });
            }}
          />
        )}

        {/* Municipal reference boundaries */}
        {showMuniOutline && (
          <GeoJSON
            key={muniOutlineKey}
            data={data.municipios as any}
            style={muniOutlineStyle as any}
            onEachFeature={(feature: any, layer: any) => {
              const code = feature.properties.codigo;
              layer.on("click", () => onMuniClick(code));
              const a = muniAgg.get(code);
              layer.bindPopup(
                `<div class="pct-popup"><h4>${feature.properties.municipio}</h4>
                  <div class="row"><span>Código</span><span>${code}</span></div>
                  <div class="row"><span>Total geral</span><span>${a?.total ?? 0}</span></div>
                  <div style="margin-top:6px;font-size:11px;color:${LAYER_COLORS.municipio};font-weight:600">Clique para filtrar este município</div></div>`,
                { maxWidth: 280 },
              );
            }}
          />
        )}

        {/* Territory Identity outlines (geo mode toggle) */}
        {showTerritorioOutline && (
          <GeoJSON
            key={territorioKey}
            data={data.territorios as any}
            style={territorioOutlineStyle as any}
            onEachFeature={(feature: any, layer: any) => {
              const nome = feature.properties.nomti;
              layer.on("click", () => onTerritorioClick(nome));
              const a = territorioAgg.get(nome);
              layer.bindPopup(
                `<div class="pct-popup"><h4>${nome}</h4>
                  <div class="row"><span>Código</span><span>${feature.properties.codti ?? "—"}</span></div>
                  <div class="row"><span>Total geral</span><span>${a?.total ?? 0}</span></div>
                  <div style="margin-top:6px;font-size:11px;color:${LAYER_COLORS.territorio};font-weight:600">Clique para filtrar por este território</div></div>`,
                { maxWidth: 280 },
              );
            }}
          />
        )}

        {/* RPGA outlines (geo mode toggle) */}
        {showRpgaOutline && (
          <GeoJSON
            key={rpgaKey}
            data={data.rpga as any}
            style={(feature: any) =>
              ({
                color: LAYER_COLORS.rpga,
                weight: selectedRpga === feature.properties.nome ? 4 : 2,
                fillColor: LAYER_COLORS.rpga,
                fillOpacity: selectedRpga === feature.properties.nome ? 0.12 : 0.04,
                dashArray: "4 3",
              }) as any
            }
            onEachFeature={(feature: any, layer: any) => {
              const nome = feature.properties.nome;
              layer.on("click", () => onRpgaClick(nome));
              const a = rpgaAgg.get(nome);
              layer.bindPopup(
                `<div class="pct-popup"><h4>${nome}</h4>
                  <div class="row"><span>Total geral</span><span>${a?.total ?? 0}</span></div>
                  <div class="row"><span>Bacias</span><span>${feature.properties.bacias ?? "—"}</span></div>
                  <div class="row"><span>Região</span><span>${feature.properties.regiao ?? "—"}</span></div>
                  <div style="margin-top:6px;font-size:11px;color:${LAYER_COLORS.rpga};font-weight:600">Clique para filtrar por esta RPGA</div></div>`,
                { maxWidth: 280 },
              );
            }}
          />
        )}

        {/* Polygon PCT layer */}
        {showPoly && polyFC.features.length > 0 && (
          <GeoJSON
            key={polyKey}
            data={polyFC as any}
            style={() =>
              ({
                color: LAYER_COLORS.poly,
                weight: 1,
                fillColor: LAYER_COLORS.poly,
                fillOpacity: 0.15,
              }) as any
            }
            onEachFeature={(feature: any, layer: any) => {
              const p = feature.properties;
              layer.bindPopup(popupForFeature(p), { maxWidth: 280 });
            }}
          />
        )}

        {/* Point PCT layer */}
        {showPontos &&
          ptFeatures.map((f, i) => {
            const c = f.geometry.coordinates;
            return (
              <CircleMarker
                key={`pt-${f.properties?.id ?? i}`}
                center={[c[1], c[0]]}
                radius={5}
                pathOptions={{
                  color: "#ffffff",
                  weight: 1,
                  fillColor: LAYER_COLORS.ponto,
                  fillOpacity: 0.95,
                }}
              >
                <Popup>
                  <span dangerouslySetInnerHTML={{ __html: popupForFeature(f.properties) }} />
                </Popup>
              </CircleMarker>
            );
          })}

        <FocusController data={data} focus={focus} />
      </MapContainer>

      <Legend
        mode={layers.mode}
        maxVal={maxVal}
        territorioMax={territorioMax}
        rpgaMax={rpgaMax}
        metric={layers.metric}
        showRpga={showRpgaOutline}
        showTerritorio={showTerritorioOutline}
        showPoly={showPoly}
        showPontos={showPontos}
        showMuniOutline={showMuniOutline}
      />

      <div className="pointer-events-none absolute left-1/2 top-3 z-[500] max-w-[60%] -translate-x-1/2 rounded-md bg-card/90 px-3 py-1 text-center text-xs font-semibold text-foreground shadow backdrop-blur">
        {showMuniChoro
          ? `${METRIC_LABEL[layers.metric]} por município`
          : showTerritorioChoro
            ? "Total de comunidades por Território de Identidade"
            : showRpgaChoro
              ? "Total de comunidades por RPGA"
              : "Localização dos territórios"}
      </div>
    </div>
  );
}

function popupForFeature(p: any): string {
  if (!p || !p.nome) return `<div class="pct-popup"><h4>${p?.id ?? "Registro"}</h4></div>`;
  return `<div class="pct-popup"><h4>${p.nome}</h4>
    <div class="row"><span>ID-PCT</span><span>${p.id}</span></div>
    <div class="row"><span>Segmento</span><span>${p.tipo}</span></div>
    <div class="row"><span>Município</span><span>${p.municipio} (${p.codigo})</span></div>
    <div class="row"><span>RPGA</span><span>${p.rpga}</span></div>
    <div class="row"><span>Fonte</span><span>${p.fonte}</span></div>
    <div class="row"><span>Dado espacial</span><span>${p.espacial}</span></div>
    <div class="row"><span>Nº registro</span><span>${p.numRegistro || "—"}</span></div>
    <div class="row"><span>Data registro</span><span>${p.dataRegistro || "—"}</span></div>
    <div class="row"><span>Em +1 fonte</span><span>${p.maisDeUma || "Não"}</span></div></div>`;
}
