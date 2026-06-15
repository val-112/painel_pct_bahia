import { useMemo, useState } from "react";
import type { PctRecord } from "@/lib/pct";

interface Props {
  records: PctRecord[];
  onRowClick: (r: PctRecord) => void;
  selectedId: string | null;
}

type SortKey = keyof PctRecord;
const COLS: Array<{ key: SortKey; label: string }> = [
  { key: "id", label: "ID-PCT" },
  { key: "nome", label: "Comunidade" },
  { key: "tipo", label: "Tipo" },
  { key: "municipio", label: "Município" },
  { key: "codigo", label: "Cód. Mun." },
  { key: "rpga", label: "RPGA" },
  { key: "fonte", label: "Fonte" },
  { key: "espacial", label: "Dado espacial" },
  { key: "numRegistro", label: "Nº registro" },
  { key: "dataRegistro", label: "Data" },
  { key: "maisDeUma", label: "+1 fonte" },
  { key: "lat", label: "Lat" },
  { key: "long", label: "Long" },
];

const PAGE_SIZE = 25;

export function DataTable({ records, onRowClick, selectedId }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("nome");
  const [asc, setAsc] = useState(true);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = s ? records.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(s))) : records;
    const sorted = [...base].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), "pt-BR", { numeric: true });
      return asc ? cmp : -cmp;
    });
    return sorted;
  }, [records, q, sortKey, asc]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const sort = (key: SortKey) => {
    if (key === sortKey) setAsc(!asc);
    else {
      setSortKey(key);
      setAsc(true);
    }
  };

  const exportCsv = () => {
    const header = COLS.map((c) => c.label).join(";");
    const lines = filtered.map((r) => COLS.map((c) => `"${String(r[c.key] ?? "").replace(/"/g, '""')}"`).join(";"));
    const csv = "\uFEFF" + [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "comunidades_pct_bahia.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
          Registros detalhados <span className="text-muted-foreground">({filtered.length.toLocaleString("pt-BR")})</span>
        </h2>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar na tabela…"
            className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button onClick={exportCsv} className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="thin-scroll max-h-[420px] overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-secondary">
            <tr>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  onClick={() => sort(c.key)}
                  className="cursor-pointer whitespace-nowrap px-2.5 py-2 font-semibold text-secondary-foreground hover:bg-accent"
                >
                  {c.label}
                  {sortKey === c.key && <span className="ml-1">{asc ? "▲" : "▼"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => onRowClick(r)}
                className={`cursor-pointer border-t border-border transition-colors hover:bg-accent/60 ${selectedId === r.id ? "bg-primary/10" : ""}`}
              >
                {COLS.map((c) => (
                  <td key={c.key} className="max-w-[200px] truncate whitespace-nowrap px-2.5 py-1.5 text-foreground" title={String(r[c.key] ?? "")}>
                    {String(r[c.key] ?? "") || "—"}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLS.length} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border p-2 text-xs">
        <span className="text-muted-foreground">
          Página {safePage + 1} de {pageCount}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            className="rounded-md border border-input px-2.5 py-1 font-medium disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
            disabled={safePage >= pageCount - 1}
            className="rounded-md border border-input px-2.5 py-1 font-medium disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
