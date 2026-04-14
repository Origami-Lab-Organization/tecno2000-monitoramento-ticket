"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Search,
  ShieldAlert,
  Truck,
} from "lucide-react";

/* ── Filtros de período ── */

type PeriodFilter = "30d" | "90d" | "6m" | "1y" | "all" | "custom";

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "6m", label: "Últimos 6 meses" },
  { value: "1y", label: "Último ano" },
  { value: "all", label: "Todo período" },
  { value: "custom", label: "Personalizado" },
];

function getPeriodStartDate(period: PeriodFilter): Date | null {
  if (period === "all") return null;
  const now = new Date();
  switch (period) {
    case "30d": return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    case "90d": return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
    case "6m": return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case "1y": return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default: return null;
  }
}

/* ── Tipos da API TudoEntregue ── */

interface TudoEntregueOccurrence {
  OccurrenceCode: string;
  OccurrenceDescription: string;
  OccurrenceName: string;
  OccurrenceDocument: string;
  OccurrenceDate: string;
  OccurrenceDateUTC: string;
  Latitude: number;
  Longitude: number;
  Images: { ImageUrl: string }[];
  Observation: string;
  Finisher: boolean;
  ReportProblem: boolean;
}

interface TudoEntregueStatus {
  Status: number;
  StatusDescription: string;
  Date: string;
}

interface TudoEntregueOrder {
  Driver: {
    Name: string;
    PhoneCountry: string;
    PhoneNumber: string;
    Tags: string;
  };
  DestinationAddress: {
    Name: string;
    Address: string;
    City: string;
    State: string;
    ZipCode: string;
  };
  OrderID: string;
  OrderNumber: string;
  OrderDescription: string;
  Documents: {
    DocumentNumber: string;
    DocumentDescription: string;
    Volume: number;
    Weight: number;
  }[];
  Occurrences: TudoEntregueOccurrence[];
  Status: TudoEntregueStatus[];
  DepartureDate: string;
  ScheduleDate: string;
  TrackingUrl: string;
}

/* ── Tipos internos do dashboard ── */

interface OrderRow {
  orderNumber: string;
  destino: string;
  cidade: string;
  estado: string;
  nf: string;
  dataPartida: string;
  ultimoStatus: string;
  occurrences: TudoEntregueOccurrence[];
  trackingUrl: string;
}

interface DriverRow {
  nome: string;
  telefone: string;
  tags: string[];
  totalOcorrencias: number;
  totalPedidos: number;
  entregues: number;
  totalATs: number;
  latestDate: number;
  topDestino: string;
  topEstado: string;
  orders: OrderRow[];
  occurrenceCounts: Record<string, number>;
  atCounts: Record<string, number>;
}

/* ── Helpers ── */

function formatDate(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
}

function parseTags(tags: string): string[] {
  if (!tags) return [];
  return tags
    .split("||")
    .map((t) => t.trim())
    .filter(Boolean);
}

function getLastStatus(statuses: TudoEntregueStatus[]): string {
  if (!statuses.length) return "Sem status";
  const sorted = [...statuses].sort(
    (a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()
  );
  return sorted[0].StatusDescription;
}

function getDriverTone(row: DriverRow) {
  if (row.totalATs > 0) {
    return {
      ring: "ring-rose-200",
      glow: "from-rose-500/20 via-rose-400/10 to-transparent",
      bar: "from-rose-500 to-amber-400",
    };
  }
  return {
    ring: "ring-emerald-200",
    glow: "from-emerald-500/20 via-emerald-400/10 to-transparent",
    bar: "from-emerald-500 to-teal-400",
  };
}

// Códigos de ocorrência que fazem parte do fluxo normal de entrega
const NORMAL_DELIVERY_CODES = new Set(["01", "04"]); // ENTREGUE, MATERIAL DESCARREGADO

function isAssistenciaTecnica(occ: TudoEntregueOccurrence) {
  return !NORMAL_DELIVERY_CODES.has(occ.OccurrenceCode);
}

const OCC_COLORS: Record<string, { bg: string; text: string; light: string; border: string }> = {
  ENTREGUE: { bg: "bg-emerald-500", text: "text-emerald-700", light: "bg-emerald-50", border: "border-emerald-200" },
  AT: { bg: "bg-rose-500", text: "text-rose-700", light: "bg-rose-50", border: "border-rose-200" },
  ETAPA: { bg: "bg-slate-400", text: "text-slate-600", light: "bg-slate-50", border: "border-slate-200" },
};

function getOccColor(occ: TudoEntregueOccurrence) {
  if (isAssistenciaTecnica(occ)) return OCC_COLORS.AT;
  if (occ.OccurrenceCode === "01") return OCC_COLORS.ENTREGUE;
  return OCC_COLORS.ETAPA;
}

/* ── Cache local (localStorage, TTL 5 min) ── */

const CACHE_KEY = "tecno2000_orders_cache";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

function readCache(): TudoEntregueOrder[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data: TudoEntregueOrder[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch { /* quota exceeded — ignora */ }
}

/* ── Componente principal ── */

export default function MotoristasPage() {
  const [orders, setOrders] = useState<TudoEntregueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    // 1. Tenta carregar do cache primeiro (instantâneo)
    const cached = readCache();
    if (cached) {
      setOrders(cached);
      setLoading(false);
      setLastUpdated(new Date(JSON.parse(localStorage.getItem(CACHE_KEY)!).timestamp));
    }

    // 2. Busca da API (em background se já tem cache)
    if (cached) setRefreshing(true);

    fetch("/api/orders")
      .then((res) => {
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setOrders(data);
        writeCache(data);
        setLastUpdated(new Date());
      })
      .catch((err) => {
        if (!cached) setError(err.message);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  const dashboard = useMemo(() => {
    // Filtro de data
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (period === "custom") {
      if (customStart) startDate = new Date(customStart + "T00:00:00");
      if (customEnd) endDate = new Date(customEnd + "T23:59:59");
    } else {
      startDate = getPeriodStartDate(period);
    }

    const dateFiltered = orders.filter((o) => {
      const dep = o.DepartureDate ? new Date(o.DepartureDate) : null;
      if (!dep) return false;
      if (startDate && dep < startDate) return false;
      if (endDate && dep > endDate) return false;
      return true;
    });

    // Só pedidos que têm pelo menos 1 assistência técnica (ocorrência fora do fluxo normal)
    const ordersWithOcc = dateFiltered.filter((o) =>
      o.Occurrences.some((occ) => isAssistenciaTecnica(occ))
    );

    const map = new Map<string, { driver: TudoEntregueOrder["Driver"]; orders: TudoEntregueOrder[] }>();

    ordersWithOcc.forEach((order) => {
      const nome = order.Driver?.Name?.trim();
      if (!nome) return;
      const key = nome.toLowerCase();
      if (!map.has(key)) map.set(key, { driver: order.Driver, orders: [] });
      map.get(key)!.orders.push(order);
    });

    const rows: DriverRow[] = [...map.values()]
      .map(({ driver, orders: driverOrders }) => {
        const sorted = [...driverOrders].sort(
          (a, b) =>
            new Date(b.DepartureDate || "0").getTime() -
            new Date(a.DepartureDate || "0").getTime()
        );

        const occurrenceCounts: Record<string, number> = {};
        const atCounts: Record<string, number> = {};
        const estadoMap = new Map<string, number>();
        const destinoMap = new Map<string, number>();
        let entregues = 0;
        let totalATs = 0;

        const orderRows: OrderRow[] = sorted.map((order) => {
          const lastStatus = getLastStatus(order.Status);
          const dest = order.DestinationAddress;

          if (dest?.State) {
            estadoMap.set(dest.State, (estadoMap.get(dest.State) || 0) + 1);
          }
          if (dest?.Name) {
            destinoMap.set(dest.Name, (destinoMap.get(dest.Name) || 0) + 1);
          }

          order.Occurrences.forEach((occ) => {
            const desc = occ.OccurrenceDescription?.trim() || "Sem descrição";
            occurrenceCounts[desc] = (occurrenceCounts[desc] || 0) + 1;
            if (isAssistenciaTecnica(occ)) {
              totalATs++;
              atCounts[desc] = (atCounts[desc] || 0) + 1;
            }
            if (occ.OccurrenceCode === "01") entregues++;
          });

          return {
            orderNumber: order.OrderNumber,
            destino: dest?.Name || "-",
            cidade: dest?.City || "-",
            estado: dest?.State || "-",
            nf: order.Documents?.[0]?.DocumentNumber || "-",
            dataPartida: order.DepartureDate,
            ultimoStatus: lastStatus,
            occurrences: order.Occurrences,
            trackingUrl: order.TrackingUrl || "",
          };
        });

        const totalPedidos = sorted.length;
        const totalOcorrencias = Object.values(occurrenceCounts).reduce((a, b) => a + b, 0);
        const latestDate = new Date(sorted[0]?.DepartureDate || "0").getTime();
        const topEstado =
          [...estadoMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
        const topDestino =
          [...destinoMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

        return {
          nome: driver.Name?.trim() || "Sem nome",
          telefone: `${driver.PhoneCountry || "55"}${driver.PhoneNumber || ""}`,
          tags: parseTags(driver.Tags),
          totalOcorrencias: totalOcorrencias,
          totalPedidos,
          entregues,
          totalATs,
          latestDate,
          topDestino,
          topEstado,
          orders: orderRows,
          occurrenceCounts,
          atCounts,
        };
      })
      .sort(
        (a, b) =>
          b.totalATs - a.totalATs ||
          b.totalPedidos - a.totalPedidos ||
          b.latestDate - a.latestDate
      );

    const filteredRows = rows.filter(
      (row) =>
        !search ||
        row.nome.toLowerCase().includes(search.toLowerCase()) ||
        row.topDestino.toLowerCase().includes(search.toLowerCase()) ||
        row.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    );

    const totalOrders = ordersWithOcc.length;
    const totalOccurrences = ordersWithOcc.reduce((s, o) => s + o.Occurrences.length, 0);
    const totalEntregues = rows.reduce((s, r) => s + r.entregues, 0);
    const totalATs = rows.reduce((s, r) => s + r.totalATs, 0);
    const highestTotal = Math.max(...rows.map((r) => r.totalPedidos), 1);
    const spotlight = rows[0] || null;

    const topOccurrences = Object.entries(
      ordersWithOcc.reduce<Record<string, number>>((acc, order) => {
        order.Occurrences.forEach((occ) => {
          const desc = occ.OccurrenceDescription?.trim() || "Sem descrição";
          acc[desc] = (acc[desc] || 0) + 1;
        });
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      rows,
      filteredRows,
      totalOrders,
      totalOccurrences,
      totalEntregues,
      totalATs,
      highestTotal,
      spotlight,
      topOccurrences,
    };
  }, [orders, search, period, customStart, customEnd]);

  const toggle = (nome: string) =>
    setExpanded((prev) => (prev === nome ? null : nome));

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,93,119,0.10),_transparent_32%),linear-gradient(180deg,#f8fafc_0%,#e6f0f3_42%,#f8fafc_100%)]">
      <Navbar />
      <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 px-4 py-8 sm:px-6">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden rounded-[28px] border border-brand-700 bg-brand-700 px-6 py-7 text-white shadow-[0_30px_80px_-40px_rgba(0,93,119,0.75)] sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,93,119,0.35),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(112,111,111,0.22),transparent_24%),linear-gradient(135deg,rgba(0,74,95,0.95),rgba(0,56,71,0.98))]" />
          <div className="absolute right-0 top-0 h-44 w-44 translate-x-10 -translate-y-10 rounded-full bg-white/10 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-brand-100">
                <Truck className="h-3.5 w-3.5" />
                Radar de Motoristas
              </span>
              <h1 className="mt-4 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">
                Ocorrências por motorista
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Volume de ocorrências registradas no Tudo Entregue por motorista.
                Só aparecem pedidos com pelo menos uma ocorrência.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                {refreshing && (
                  <span className="inline-flex items-center gap-1.5 text-brand-200">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Atualizando...
                  </span>
                )}
                {lastUpdated && !refreshing && (
                  <span>Atualizado às {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  Ocorrências
                </p>
                <p className="mt-2 text-3xl font-black">
                  {loading ? "-" : dashboard.totalOccurrences}
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Total registradas
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  Pedidos
                </p>
                <p className="mt-2 text-3xl font-black text-emerald-300">
                  {loading ? "-" : dashboard.totalOrders}
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  No período filtrado
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  Assist. Técnicas
                </p>
                <p className="mt-2 text-3xl font-black text-rose-300">
                  {loading ? "-" : dashboard.totalATs}
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Transbordo, sinistro, recusa, etc.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Loading / Error ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <span className="text-sm font-medium text-slate-600">
              Carregando dados do Tudo Entregue...
            </span>
            <span className="text-xs text-slate-400">
              Buscando pedidos com ocorrências. Isso pode levar até 2 minutos na primeira vez.
            </span>
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="font-semibold text-rose-700">Erro ao carregar dados</p>
            <p className="mt-1 text-sm text-rose-600">{error}</p>
          </div>
        )}

        {/* ── Main content ── */}
        {!loading && !error && (
          <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            {/* Painel principal */}
            <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                    Painel de leitura rápida
                  </p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">
                    Ranking de motoristas
                  </h2>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full max-w-2xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      className="input-field rounded-2xl border-slate-200 bg-slate-50 pl-9"
                      placeholder="Buscar motorista, destino ou placa..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <select
                      className="input-field rounded-2xl border-slate-200 bg-slate-50 min-w-[160px]"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
                    >
                      {PERIOD_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Filtro de data personalizado */}
              {period === "custom" && (
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <Calendar className="h-4 w-4 text-brand flex-shrink-0" />
                  <div className="flex items-center gap-2 text-sm">
                    <label className="text-slate-500 font-medium">De:</label>
                    <input
                      type="date"
                      className="input-field rounded-xl py-1.5 max-w-[160px]"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                    />
                    <label className="text-slate-500 font-medium">Até:</label>
                    <input
                      type="date"
                      className="input-field rounded-xl py-1.5 max-w-[160px]"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Cards resumo */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Motoristas
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {dashboard.rows.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Com ocorrências</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Total ocorrências
                  </p>
                  <p className="mt-2 text-3xl font-black text-brand">
                    {dashboard.totalOccurrences}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Registradas no sistema</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Média/motorista
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {dashboard.rows.length
                      ? (dashboard.totalOccurrences / dashboard.rows.length).toFixed(1)
                      : "0"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Ocorrências por motorista</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Maior volume
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-900">
                    {dashboard.spotlight?.nome || "-"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {dashboard.spotlight
                      ? `${dashboard.spotlight.totalPedidos} pedido(s), ${dashboard.spotlight.totalOcorrencias} ocorrência(s)`
                      : "Sem dados"}
                  </p>
                </div>
              </div>

              {/* Legenda */}
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">
                  Legenda dos indicadores
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-1 h-3 w-3 rounded-full bg-brand flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800">Ocorrências</p>
                      <p className="text-xs text-slate-500">Todas as ocorrências registradas no Tudo Entregue (entregas + descargas + ATs)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-1 h-3 w-3 rounded-full bg-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800">Entregues</p>
                      <p className="text-xs text-slate-500">Pedidos finalizados com sucesso pelo motorista (código 01 - ENTREGUE)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-1 h-3 w-3 rounded-full bg-rose-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800">Assist. Técnicas</p>
                      <p className="text-xs text-slate-500">Ocorrências fora do fluxo normal: transbordo, sinistro, recusa, divergência, devolução</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-1 h-3 w-3 rounded-full bg-slate-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800">Pedidos</p>
                      <p className="text-xs text-slate-500">Total de pedidos com pelo menos uma ocorrência registrada no período</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de motoristas */}
              <div className="mt-4 space-y-3">
                {dashboard.filteredRows.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                    <Truck className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-700">
                      Nenhum motorista encontrado
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Ajuste o termo buscado ou verifique a conexão com o Tudo Entregue.
                    </p>
                  </div>
                ) : (
                  dashboard.filteredRows.map((row, index) => {
                    const tone = getDriverTone(row);
                    const totalWidth = `${(row.totalPedidos / dashboard.highestTotal) * 100}%`;

                    return (
                      <div
                        key={row.nome}
                        className={`group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                          expanded === row.nome ? `ring-2 ${tone.ring}` : ""
                        }`}
                      >
                        <button
                          onClick={() => toggle(row.nome)}
                          className="w-full p-4 text-left sm:p-5"
                        >
                          <div
                            className={`absolute inset-0 bg-gradient-to-r ${tone.glow} opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
                              expanded === row.nome ? "opacity-100" : ""
                            }`}
                          />
                          <div className="relative">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-sm font-black text-white">
                                    #{index + 1}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-base font-black text-slate-900 sm:text-lg">
                                      {row.nome}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                      {row.tags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                      <span className="text-xs text-slate-400">
                                        Estado principal: <span className="font-semibold text-slate-600">{row.topEstado}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-5">
                                  <div>
                                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                      <span>Pedidos</span>
                                      <span>{row.totalPedidos}</span>
                                    </div>
                                    <div className="mt-2 h-2.5 rounded-full bg-slate-100">
                                      <div
                                        className={`h-2.5 rounded-full bg-gradient-to-r ${tone.bar}`}
                                        style={{ width: totalWidth }}
                                      />
                                    </div>
                                  </div>
                                  <div className="rounded-2xl bg-brand-50 px-3 py-2 text-center">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
                                      Ocorrências
                                    </p>
                                    <p className="mt-1 text-lg font-black text-brand-700">
                                      {row.totalOcorrencias}
                                    </p>
                                  </div>
                                  <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-center">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                                      Entregues
                                    </p>
                                    <p className="mt-1 text-lg font-black text-emerald-700">
                                      {row.entregues}
                                    </p>
                                  </div>
                                  <div className="rounded-2xl bg-rose-50 px-3 py-2 text-center">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-600">
                                      Assist. Técnicas
                                    </p>
                                    <p className="mt-1 text-lg font-black text-rose-700">
                                      {row.totalATs}
                                    </p>
                                  </div>
                                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-center">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                      Última entrega
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-slate-900">
                                      {formatDate(row.orders[0]?.dataPartida)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-start">
                                {expanded === row.nome ? (
                                  <ChevronDown className="h-5 w-5 text-slate-400" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-slate-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* ── Detalhes expandidos ── */}
                        {expanded === row.nome && (
                          <div className="border-t border-slate-200 p-4 sm:p-5">
                            <div className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
                              {/* Composição de ocorrências */}
                              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                    <ShieldAlert className="h-4 w-4 text-brand" />
                                    Resumo de ocorrências
                                  </div>
                                  <span className="text-xs font-semibold text-slate-500">
                                    {Object.values(row.occurrenceCounts).reduce((a, b) => a + b, 0)} total
                                  </span>
                                </div>

                                {/* Assistências técnicas (destaque) */}
                                {row.totalATs > 0 && (
                                  <div className="mt-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600 mb-2">
                                      Assistências Técnicas ({row.totalATs})
                                    </p>
                                    <div className="grid gap-1.5">
                                      {Object.entries(row.atCounts)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([desc, count]) => (
                                          <div
                                            key={desc}
                                            className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${OCC_COLORS.AT.light} border ${OCC_COLORS.AT.border}`}
                                          >
                                            <div className="flex items-center gap-2.5">
                                              <span
                                                className={`h-3 w-3 rounded-full ${OCC_COLORS.AT.bg}`}
                                                style={{ boxShadow: "0 0 0 2px rgba(255,255,255,0.8)" }}
                                              />
                                              <span className={`font-semibold ${OCC_COLORS.AT.text}`}>
                                                {desc}
                                              </span>
                                            </div>
                                            <span className={`font-black text-base ${OCC_COLORS.AT.text}`}>
                                              {count}
                                            </span>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}

                                {/* Fluxo normal de entrega */}
                                <div className="mt-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">
                                    Fluxo de entrega
                                  </p>
                                  <div className="grid gap-1.5">
                                    {Object.entries(row.occurrenceCounts)
                                      .filter(([desc]) => !row.atCounts[desc])
                                      .sort((a, b) => b[1] - a[1])
                                      .map(([desc, count]) => {
                                        const isEntregue = desc.toUpperCase().includes("ENTREG");
                                        const colors = isEntregue ? OCC_COLORS.ENTREGUE : OCC_COLORS.ETAPA;
                                        return (
                                          <div
                                            key={desc}
                                            className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${colors.light} border ${colors.border}`}
                                          >
                                            <div className="flex items-center gap-2.5">
                                              <span
                                                className={`h-3 w-3 rounded-full ${colors.bg}`}
                                                style={{ boxShadow: "0 0 0 2px rgba(255,255,255,0.8)" }}
                                              />
                                              <span className={`font-semibold ${colors.text}`}>
                                                {desc}
                                              </span>
                                            </div>
                                            <span className={`font-black text-base ${colors.text}`}>
                                              {count}
                                            </span>
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              </div>

                              {/* Tabela de pedidos */}
                              <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                                  <p className="text-sm font-black text-slate-900">
                                    Pedidos do motorista
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {row.orders.length} pedido(s) — clique para ver ocorrências
                                  </p>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="min-w-[700px] w-full">
                                    <thead>
                                      <tr className="border-b border-slate-200 bg-white">
                                        {["Pedido", "NF", "Destino", "Cidade/UF", "Data", "Status"].map(
                                          (col) => (
                                            <th
                                              key={col}
                                              className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                                            >
                                              {col}
                                            </th>
                                          )
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {row.orders.map((order) => (
                                        <>
                                          <tr
                                            key={order.orderNumber}
                                            onClick={() =>
                                              setExpandedOrder(
                                                expandedOrder === order.orderNumber
                                                  ? null
                                                  : order.orderNumber
                                              )
                                            }
                                            className="cursor-pointer border-b border-slate-100 transition hover:bg-brand-50/70"
                                          >
                                            <td className="px-4 py-3 text-sm font-bold text-slate-900">
                                              #{order.orderNumber}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                              {order.nf}
                                            </td>
                                            <td
                                              className="max-w-[200px] truncate px-4 py-3 text-sm text-slate-600"
                                              title={order.destino}
                                            >
                                              {order.destino}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-500">
                                              {order.cidade}/{order.estado}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-500">
                                              {formatDate(order.dataPartida)}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                                {order.ultimoStatus}
                                              </span>
                                            </td>
                                          </tr>

                                          {/* Ocorrências do pedido expandido */}
                                          {expandedOrder === order.orderNumber &&
                                            order.occurrences.length > 0 && (
                                              <tr key={`${order.orderNumber}-occ`}>
                                                <td colSpan={6} className="bg-slate-50 p-4">
                                                  <div className="space-y-3">
                                                    {order.occurrences.map((occ, i) => {
                                                      const colors = getOccColor(occ);
                                                      return (
                                                        <div
                                                          key={i}
                                                          className={`rounded-xl border ${colors.border} ${colors.light} p-3`}
                                                        >
                                                          <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1">
                                                              <div className="flex items-center gap-2">
                                                                <span className={`h-2.5 w-2.5 rounded-full ${colors.bg}`} />
                                                                <span className={`text-sm font-bold ${colors.text}`}>
                                                                  {occ.OccurrenceDescription}
                                                                </span>
                                                                <span className="text-xs text-slate-400">
                                                                  Cod: {occ.OccurrenceCode}
                                                                </span>
                                                              </div>
                                                              {occ.OccurrenceName && (
                                                                <p className="mt-1 text-xs text-slate-600">
                                                                  Recebedor: <span className="font-semibold">{occ.OccurrenceName}</span>
                                                                  {occ.OccurrenceDocument && occ.OccurrenceDocument !== "000000" && (
                                                                    <> — Doc: {occ.OccurrenceDocument}</>
                                                                  )}
                                                                </p>
                                                              )}
                                                              {occ.Observation && (
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                  {occ.Observation}
                                                                </p>
                                                              )}
                                                              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                                                <span>{formatDate(occ.OccurrenceDate)}</span>
                                                                {occ.Latitude !== 0 && (
                                                                  <span className="inline-flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3" />
                                                                    {occ.Latitude.toFixed(4)}, {occ.Longitude.toFixed(4)}
                                                                  </span>
                                                                )}
                                                              </div>
                                                            </div>
                                                            {occ.Images?.length > 0 && (
                                                              <div className="flex gap-2">
                                                                {occ.Images.slice(0, 3).map((img, j) => (
                                                                  <a
                                                                    key={j}
                                                                    href={img.ImageUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white hover:border-brand transition-colors"
                                                                    title="Ver foto"
                                                                  >
                                                                    <ImageIcon className="h-5 w-5 text-slate-400" />
                                                                  </a>
                                                                ))}
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </td>
                                              </tr>
                                            )}
                                        </>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── Sidebar ── */}
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-brand-700 bg-brand-700 px-5 py-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">
                    Spotlight
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    Motorista com mais ocorrências
                  </h2>
                </div>
                <div className="p-5">
                  {dashboard.spotlight ? (
                    <>
                      <p className="text-lg font-black text-slate-900">
                        {dashboard.spotlight.nome}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Maior volume de ocorrências registradas.
                      </p>
                      <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                        <div className="rounded-2xl bg-brand-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                            Pedidos
                          </p>
                          <p className="mt-2 text-3xl font-black text-brand-700">
                            {dashboard.spotlight.totalPedidos}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-emerald-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                            Entregues
                          </p>
                          <p className="mt-2 text-3xl font-black text-emerald-700">
                            {dashboard.spotlight.entregues}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-rose-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
                            Assist. Técnicas
                          </p>
                          <p className="mt-2 text-3xl font-black text-rose-700">
                            {dashboard.spotlight.totalATs}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">Sem dados para análise.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Ocorrências mais registradas
                </p>
                <div className="mt-4 space-y-3">
                  {dashboard.topOccurrences.map(([desc, count]) => (
                    <div key={desc}>
                      <div className="flex items-center justify-between text-sm">
                        <p className="max-w-[80%] font-semibold text-slate-700">
                          {desc}
                        </p>
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          {count}
                        </span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-brand via-brand-300 to-brand-200"
                          style={{
                            width: `${
                              (count /
                                Math.max(dashboard.topOccurrences[0]?.[1] || 1, 1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {dashboard.topOccurrences.length === 0 && (
                    <p className="text-sm text-slate-400">Sem ocorrências registradas.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Resumo
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Volume</p>
                    <p className="mt-1">
                      {dashboard.rows.length} motorista(s) com {dashboard.totalOrders} pedido(s) finalizado(s) no Tudo Entregue.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Assistências Técnicas</p>
                    <p className="mt-1">
                      {dashboard.totalATs} assistência(s) técnica(s) registrada(s) (transbordo, sinistro, recusa, divergência, etc.)
                    </p>
                  </div>
                  {dashboard.spotlight && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">Destaque</p>
                      <p className="mt-1">
                        {dashboard.spotlight.nome} lidera com {dashboard.spotlight.totalPedidos} pedido(s) e {dashboard.spotlight.totalOcorrencias} ocorrência(s).
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
