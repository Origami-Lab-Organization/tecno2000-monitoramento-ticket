'use client';
import { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { Search, Filter, Wrench, Eye, MapPin, Image as ImageIcon, ChevronDown, ChevronRight, Calendar } from 'lucide-react';

const NORMAL_CODES = new Set(["01", "04"]);

interface TudoEntregueOccurrence {
  OccurrenceCode: string;
  OccurrenceDescription: string;
  OccurrenceName: string;
  OccurrenceDocument: string;
  OccurrenceDate: string;
  Latitude: number;
  Longitude: number;
  Images: { ImageUrl: string }[];
  Observation: string;
  Finisher: boolean;
  ReportProblem: boolean;
}

interface TudoEntregueOrder {
  Driver: { Name: string; PhoneNumber: string; Tags: string };
  DestinationAddress: { Name: string; City: string; State: string };
  OrderID: string;
  OrderNumber: string;
  Documents: { DocumentNumber: string; Volume: number; Weight: number }[];
  Occurrences: TudoEntregueOccurrence[];
  DepartureDate: string;
}

interface ATRow {
  id: string;
  pedido: string;
  nf: string;
  destino: string;
  cidadeUF: string;
  motorista: string;
  dataPartida: string;
  ocorrencia: TudoEntregueOccurrence;
}

type OccFilter = 'Todos' | string;

function formatDate(value: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
}

export default function AssistenciasPage() {
  const [orders, setOrders] = useState<TudoEntregueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [occFilter, setOccFilter] = useState<OccFilter>('Todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Extrai todas as ATs dos pedidos
  const { rows, occTypes } = useMemo(() => {
    const rows: ATRow[] = [];
    const occTypesSet = new Set<string>();

    orders.forEach((order) => {
      order.Occurrences.forEach((occ, i) => {
        if (NORMAL_CODES.has(occ.OccurrenceCode)) return;
        const desc = occ.OccurrenceDescription?.trim() || 'Sem descrição';
        occTypesSet.add(desc);
        rows.push({
          id: `${order.OrderID}-${i}`,
          pedido: order.OrderNumber,
          nf: order.Documents?.[0]?.DocumentNumber || '-',
          destino: order.DestinationAddress?.Name || '-',
          cidadeUF: `${order.DestinationAddress?.City || '-'}/${order.DestinationAddress?.State || '-'}`,
          motorista: order.Driver?.Name?.trim() || '-',
          dataPartida: order.DepartureDate,
          ocorrencia: occ,
        });
      });
    });

    rows.sort((a, b) => new Date(b.ocorrencia.OccurrenceDate).getTime() - new Date(a.ocorrencia.OccurrenceDate).getTime());

    return { rows, occTypes: ['Todos', ...Array.from(occTypesSet).sort()] };
  }, [orders]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchOcc = occFilter === 'Todos' || r.ocorrencia.OccurrenceDescription?.trim() === occFilter;
      const matchSearch = !search ||
        r.motorista.toLowerCase().includes(search.toLowerCase()) ||
        r.pedido.toLowerCase().includes(search.toLowerCase()) ||
        r.destino.toLowerCase().includes(search.toLowerCase()) ||
        r.ocorrencia.Observation?.toLowerCase().includes(search.toLowerCase());
      return matchOcc && matchSearch;
    });
  }, [rows, search, occFilter]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Assistências Técnicas</h1>
            <p className="text-slate-500 text-sm mt-1">
              {loading ? 'Carregando...' : `${filtered.length} ocorrência(s) encontrada(s) de ${rows.length} total`}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="input-field pl-9"
                placeholder="Buscar por motorista, pedido, destino ou observação..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select
                className="input-field min-w-[200px]"
                value={occFilter}
                onChange={e => setOccFilter(e.target.value)}
              >
                {occTypes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Carregando dados do Tudo Entregue...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">
                {rows.length === 0 ? 'Nenhuma assistência técnica encontrada' : 'Nenhum resultado para o filtro aplicado'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['', 'Pedido', 'NF', 'Destino', 'Cidade/UF', 'Motorista', 'Data', 'Ocorrência', 'Observação'].map(col => (
                      <th key={col} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((at) => {
                    const isExpanded = expandedId === at.id;
                    const occ = at.ocorrencia;
                    return (
                      <>
                        <tr
                          key={at.id}
                          className="hover:bg-brand-50/40 transition-colors duration-150 cursor-pointer group"
                          onClick={() => setExpandedId(isExpanded ? null : at.id)}
                        >
                          <td className="px-4 py-3 w-8">
                            {isExpanded
                              ? <ChevronDown className="w-4 h-4 text-slate-400" />
                              : <ChevronRight className="w-4 h-4 text-slate-400" />
                            }
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">#{at.pedido}</td>
                          <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{at.nf}</td>
                          <td className="px-4 py-3 text-sm text-slate-700 max-w-[180px] truncate font-medium" title={at.destino}>{at.destino}</td>
                          <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{at.cidadeUF}</td>
                          <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap font-medium">{at.motorista}</td>
                          <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{formatDate(occ.OccurrenceDate)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              occ.ReportProblem
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${occ.ReportProblem ? 'bg-rose-500' : 'bg-amber-500'}`} />
                              {occ.OccurrenceDescription?.trim()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate" title={occ.Observation}>
                            {occ.Observation || '-'}
                          </td>
                        </tr>

                        {/* Detalhe expandido */}
                        {isExpanded && (
                          <tr key={`${at.id}-detail`}>
                            <td colSpan={9} className="bg-slate-50 px-6 py-4">
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                  <p className="label">Código da Ocorrência</p>
                                  <p className="text-sm font-medium text-slate-800">{occ.OccurrenceCode}</p>
                                </div>
                                <div>
                                  <p className="label">Recebedor</p>
                                  <p className="text-sm font-medium text-slate-800">
                                    {occ.OccurrenceName || '-'}
                                    {occ.OccurrenceDocument && occ.OccurrenceDocument !== '000000' && occ.OccurrenceDocument !== '' && (
                                      <span className="text-slate-400 ml-1">({occ.OccurrenceDocument})</span>
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="label">Data/Hora</p>
                                  <p className="text-sm font-medium text-slate-800">
                                    {occ.OccurrenceDate ? new Date(occ.OccurrenceDate).toLocaleString('pt-BR') : '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="label">Localização</p>
                                  {occ.Latitude && occ.Latitude !== 0 ? (
                                    <p className="text-sm font-medium text-slate-800 flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5 text-brand" />
                                      {occ.Latitude.toFixed(4)}, {occ.Longitude.toFixed(4)}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-slate-400">Sem localização</p>
                                  )}
                                </div>
                              </div>

                              {occ.Observation && (
                                <div className="mt-4">
                                  <p className="label">Observação completa</p>
                                  <p className="text-sm text-slate-800 bg-white rounded-lg border border-slate-200 p-3">
                                    {occ.Observation}
                                  </p>
                                </div>
                              )}

                              {occ.Images?.length > 0 && (
                                <div className="mt-4">
                                  <p className="label">Fotos ({occ.Images.length})</p>
                                  <div className="flex gap-2 mt-1">
                                    {occ.Images.map((img, j) => (
                                      <a
                                        key={j}
                                        href={img.ImageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-16 w-16 items-center justify-center rounded-lg border border-slate-200 bg-white hover:border-brand transition-colors"
                                        title="Ver foto"
                                      >
                                        <ImageIcon className="h-6 w-6 text-slate-400" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                                <span>Pedido #{at.pedido}</span>
                                <span>NF {at.nf}</span>
                                <span>Partida: {formatDate(at.dataPartida)}</span>
                                {occ.Finisher && <span className="text-rose-500 font-semibold">Finalizador</span>}
                                {occ.ReportProblem && <span className="text-rose-500 font-semibold">Problema reportado</span>}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
