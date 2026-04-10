"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getAssistenciasSnapshot, subscribeAssistencias } from "@/lib/storage";
import { Assistencia, StatusAssistencia } from "@/types/assistencia";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Search,
  ShieldAlert,
  Truck,
} from "lucide-react";

const STATUS_COLORS: Record<StatusAssistencia, string> = {
  Aberto: "bg-rose-500",
  "Em Andamento": "bg-amber-500",
  "Aguardando Peças": "bg-orange-500",
  "Aguardando Cliente": "bg-sky-500",
  Finalizado: "bg-emerald-500",
  Cancelado: "bg-slate-400",
};

const STATUS_LABELS: StatusAssistencia[] = [
  "Aberto",
  "Em Andamento",
  "Aguardando Peças",
  "Aguardando Cliente",
  "Finalizado",
  "Cancelado",
];

type DriverRow = {
  nome: string;
  total: number;
  openCount: number;
  latestDate: number;
  motivos: string[];
  topMotivo: string;
  topEstado: string;
  statusCounts: Record<StatusAssistencia, number>;
  ats: Assistencia[];
};

function formatDate(value: string) {
  if (!value) return "-";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
  }
  return new Date(value).toLocaleDateString("pt-BR");
}

function getDriverTone(row: DriverRow) {
  if (row.openCount > 0) {
    return {
      ring: "ring-amber-200",
      glow: "from-amber-500/20 via-amber-400/10 to-transparent",
      bar: "from-amber-500 to-orange-400",
    };
  }

  return {
    ring: "ring-emerald-200",
    glow: "from-emerald-500/20 via-emerald-400/10 to-transparent",
    bar: "from-emerald-500 to-teal-400",
  };
}

export default function MotoristasPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const assistencias = useSyncExternalStore(
    subscribeAssistencias,
    getAssistenciasSnapshot,
    () => []
  );

  const dashboard = useMemo(() => {
    const map = new Map<string, Assistencia[]>();

    assistencias.forEach((assistencia) => {
      const nome = assistencia.motoristaResponsavel?.trim();
      if (!nome) return;
      if (!map.has(nome)) map.set(nome, []);
      map.get(nome)?.push(assistencia);
    });

    const rows: DriverRow[] = [...map.entries()]
      .map(([nome, ats]) => {
        const sorted = [...ats].sort(
          (a, b) =>
            new Date(b.dataEmissao || b.createdAt).getTime() -
            new Date(a.dataEmissao || a.createdAt).getTime()
        );

        const statusCounts = STATUS_LABELS.reduce(
          (acc, status) => ({ ...acc, [status]: 0 }),
          {} as Record<StatusAssistencia, number>
        );
        const motivoMap = new Map<string, number>();
        const estadoMap = new Map<string, number>();

        sorted.forEach((item) => {
          statusCounts[item.status] += 1;
          if (item.motivoAssistencia) {
            motivoMap.set(
              item.motivoAssistencia,
              (motivoMap.get(item.motivoAssistencia) || 0) + 1
            );
          }
          if (item.estado) {
            estadoMap.set(item.estado, (estadoMap.get(item.estado) || 0) + 1);
          }
        });

        const total = sorted.length;
        const openCount =
          total - statusCounts.Finalizado - statusCounts.Cancelado;
        const latestDate = new Date(
          sorted[0]?.dataEmissao || sorted[0]?.createdAt || 0
        ).getTime();
        const topMotivo =
          [...motivoMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ||
          "Sem motivo";
        const topEstado =
          [...estadoMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

        return {
          nome,
          total,
          openCount,
          latestDate,
          motivos: [...motivoMap.keys()],
          topMotivo,
          topEstado,
          statusCounts,
          ats: sorted,
        };
      })
      .sort(
        (a, b) =>
          b.openCount - a.openCount ||
          b.total - a.total ||
          b.latestDate - a.latestDate
      );

    const filteredRows = rows.filter(
      (row) =>
        !search ||
        row.nome.toLowerCase().includes(search.toLowerCase()) ||
        row.topMotivo.toLowerCase().includes(search.toLowerCase())
    );

    const totalOccurrences = assistencias.length;
    const openOccurrences = assistencias.filter(
      (item) => item.status !== "Finalizado" && item.status !== "Cancelado"
    ).length;
    const activeDrivers = rows.filter((row) => row.openCount > 0).length;
    const highestTotal = Math.max(...rows.map((row) => row.total), 1);
    const highestOpen = Math.max(...rows.map((row) => row.openCount), 1);
    const spotlight = rows[0] || null;

    const motivos = [
      ...assistencias
        .reduce((acc, item) => {
          if (!item.motivoAssistencia) return acc;
          acc.set(
            item.motivoAssistencia,
            (acc.get(item.motivoAssistencia) || 0) + 1
          );
          return acc;
        }, new Map<string, number>())
        .entries(),
    ]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      rows,
      filteredRows,
      totalOccurrences,
      openOccurrences,
      activeDrivers,
      highestTotal,
      highestOpen,
      spotlight,
      motivos,
    };
  }, [assistencias, search]);

  const toggle = (nome: string) => {
    setExpanded((prev) => (prev === nome ? null : nome));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.10),_transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_42%,#f8fafc_100%)]">
      <Navbar />
      <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 px-4 py-8 sm:px-6">
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 px-6 py-7 text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.75)] sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.28),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(251,146,60,0.22),transparent_24%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.96))]" />
          <div className="absolute right-0 top-0 h-44 w-44 translate-x-10 -translate-y-10 rounded-full bg-white/10 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
                <Truck className="h-3.5 w-3.5" />
                Radar de Motoristas
              </span>
              <h1 className="mt-4 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">
                Ocorrências por motorista
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Ranking de concentração e carteira em aberto para mostrar rápido
                quem está puxando o problema e onde vale agir primeiro.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  Ocorrências
                </p>
                <p className="mt-2 text-3xl font-black">
                  {dashboard.totalOccurrences}
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Base total consolidada
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  Em aberto
                </p>
                <p className="mt-2 text-3xl font-black text-amber-300">
                  {dashboard.openOccurrences}
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Demandas ainda ativas
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  Com pendência
                </p>
                <p className="mt-2 text-3xl font-black text-rose-300">
                  {dashboard.activeDrivers}
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Motoristas com caso em aberto
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                  Painel de leitura rápida
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">
                  Quem mais concentra ocorrências
                </h2>
              </div>
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="input-field rounded-2xl border-slate-200 bg-slate-50 pl-9"
                  placeholder="Buscar motorista ou motivo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Motoristas ativos
                </p>
                <p className="mt-2 text-3xl font-black text-slate-900">
                  {dashboard.activeDrivers}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Com pelo menos 1 caso em aberto
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Em aberto
                </p>
                <p className="mt-2 text-3xl font-black text-amber-600">
                  {dashboard.openOccurrences}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Demandas ainda ativas
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Média por motorista
                </p>
                <p className="mt-2 text-3xl font-black text-slate-900">
                  {dashboard.rows.length
                    ? (
                        dashboard.totalOccurrences / dashboard.rows.length
                      ).toFixed(1)
                    : "0.0"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Distribuição da carteira
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Maior carteira
                </p>
                <p className="mt-2 text-lg font-black text-slate-900">
                  {dashboard.spotlight ? dashboard.spotlight.nome : "-"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {dashboard.spotlight
                    ? `${dashboard.spotlight.total} ocorrência(s)`
                    : "Sem dados"}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {dashboard.filteredRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                  <Truck className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-3 font-semibold text-slate-700">
                    Nenhum motorista encontrado
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Ajuste o termo buscado para voltar ao ranking.
                  </p>
                </div>
              ) : (
                dashboard.filteredRows.map((row, index) => {
                  const tone = getDriverTone(row);
                  const totalWidth = `${
                    (row.total / dashboard.highestTotal) * 100
                  }%`;
                  const openWidth = `${
                    (row.openCount / dashboard.highestOpen) * 100
                  }%`;

                  return (
                    <button
                      key={row.nome}
                      onClick={() => toggle(row.nome)}
                      className={`group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5 ${
                        expanded === row.nome ? `ring-2 ${tone.ring}` : ""
                      }`}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${
                          tone.glow
                        } opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
                          expanded === row.nome ? "opacity-100" : ""
                        }`}
                      />
                      <div className="relative">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                                #{index + 1}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="truncate text-base font-black text-slate-900 sm:text-lg">
                                    {row.nome}
                                  </p>
                                </div>
                                <p className="mt-1 truncate text-sm text-slate-500">
                                  Motivo dominante:{" "}
                                  <span className="font-semibold text-slate-700">
                                    {row.topMotivo}
                                  </span>
                                  {" · "}
                                  Estado mais recorrente:{" "}
                                  <span className="font-semibold text-slate-700">
                                    {row.topEstado}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                              <div>
                                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  <span>Ocorrências</span>
                                  <span>{row.total}</span>
                                </div>
                                <div className="mt-2 h-2.5 rounded-full bg-slate-100">
                                  <div
                                    className={`h-2.5 rounded-full bg-gradient-to-r ${tone.bar}`}
                                    style={{ width: totalWidth }}
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  <span>Em aberto</span>
                                  <span>{row.openCount}</span>
                                </div>
                                <div className="mt-2 h-2.5 rounded-full bg-slate-100">
                                  <div
                                    className="h-2.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
                                    style={{ width: openWidth }}
                                  />
                                </div>
                              </div>
                              <div className="rounded-2xl bg-slate-50 px-3 py-2">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  Atualização
                                </p>
                                <p className="mt-1 text-sm font-bold text-slate-900">
                                  {formatDate(
                                    row.ats[0]?.dataEmissao ||
                                      row.ats[0]?.createdAt
                                  )}
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

                        {expanded === row.nome && (
                          <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 xl:grid-cols-[0.7fr_1.3fr]">
                            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                <ShieldAlert className="h-4 w-4 text-sky-600" />
                                Composição da carteira
                              </div>
                              <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-200">
                                {STATUS_LABELS.map((status) => {
                                  const count = row.statusCounts[status];
                                  if (!count) return null;
                                  return (
                                    <div
                                      key={status}
                                      className={STATUS_COLORS[status]}
                                      style={{
                                        width: `${(count / row.total) * 100}%`,
                                      }}
                                      title={`${status}: ${count}`}
                                    />
                                  );
                                })}
                              </div>
                              <div className="mt-4 grid gap-2">
                                {STATUS_LABELS.map((status) => (
                                  <div
                                    key={status}
                                    className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"
                                  >
                                    <div className="flex items-center gap-2 text-slate-600">
                                      <span
                                        className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status]}`}
                                      />
                                      {status}
                                    </div>
                                    <span className="font-bold text-slate-900">
                                      {row.statusCounts[status]}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                                <div>
                                  <p className="text-sm font-black text-slate-900">
                                    Ocorrências detalhadas
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Clique em uma linha para abrir a AT
                                  </p>
                                </div>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="min-w-[860px] w-full">
                                  <thead>
                                    <tr className="border-b border-slate-200 bg-white">
                                      {[
                                        "Pedido",
                                        "Cliente",
                                        "Motivo",
                                        "Status",
                                        "Data",
                                        "Abrir",
                                      ].map((col) => (
                                        <th
                                          key={col}
                                          className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                                        >
                                          {col}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {row.ats.map((at) => (
                                      <tr
                                        key={at.id}
                                        onClick={() =>
                                          router.push(
                                            `/assistencias/${at.id}?from=motoristas`
                                          )
                                        }
                                        className="cursor-pointer border-b border-slate-100 transition hover:bg-sky-50/70"
                                      >
                                        <td className="px-4 py-3 text-sm font-bold text-slate-900">
                                          {at.pedido || "-"}
                                        </td>
                                        <td
                                          className="max-w-[220px] truncate px-4 py-3 text-sm text-slate-600"
                                          title={at.cliente}
                                        >
                                          {at.cliente}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                          {at.motivoAssistencia || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                                            <span
                                              className={`h-2 w-2 rounded-full ${
                                                STATUS_COLORS[at.status]
                                              }`}
                                            />
                                            {at.status}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500">
                                          {formatDate(
                                            at.dataEmissao || at.createdAt
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-sky-700">
                                          <span className="inline-flex items-center gap-1 font-semibold">
                                            Ver AT
                                            <ArrowUpRight className="h-4 w-4" />
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                  Spotlight
                </p>
                <h2 className="mt-1 text-xl font-black">
                  Motorista que mais pede ação
                </h2>
              </div>
              <div className="p-5">
                {dashboard.spotlight ? (
                  <>
                    <p className="text-lg font-black text-slate-900">
                      {dashboard.spotlight.nome}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Maior volume de pendências e concentração de ocorrências.
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                      <div className="rounded-2xl bg-rose-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
                          Ocorrências
                        </p>
                        <p className="mt-2 text-3xl font-black text-rose-700">
                          {dashboard.spotlight.total}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-amber-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                          Em aberto
                        </p>
                        <p className="mt-2 text-3xl font-black text-amber-700">
                          {dashboard.spotlight.openCount}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-sky-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                          Motivo líder
                        </p>
                        <p className="mt-2 text-base font-black text-sky-900">
                          {dashboard.spotlight.topMotivo}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    Sem dados para análise.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Motivos mais recorrentes
              </p>
              <div className="mt-4 space-y-3">
                {dashboard.motivos.map(([motivo, count]) => (
                  <div key={motivo}>
                    <div className="flex items-center justify-between text-sm">
                      <p className="max-w-[80%] font-semibold text-slate-700">
                        {motivo}
                      </p>
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        {count}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400"
                        style={{
                          width: `${
                            (count /
                              Math.max(dashboard.motivos[0]?.[1] || 1, 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Resumo
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Concentração</p>
                  <p className="mt-1">
                    {dashboard.spotlight
                      ? `${dashboard.spotlight.nome} lidera com ${dashboard.spotlight.total} ocorrência(s), sendo ${dashboard.spotlight.openCount} ainda em aberto.`
                      : "Sem dados suficientes."}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Dados atuais</p>
                  <p className="mt-1">
                    {dashboard.openOccurrences} ocorrência(s) ainda estão em
                    andamento, aguardando peças ou aguardando cliente.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Ação sugerida</p>
                  <p className="mt-1">
                    Priorizar os motoristas no topo do ranking e abrir a
                    conversa pelos motivos dominantes reduz o tempo de análise
                    na reunião.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
