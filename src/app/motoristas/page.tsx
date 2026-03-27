'use client';
import { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import { getAssistencias } from '@/lib/storage';
import { Assistencia } from '@/types/assistencia';
import { Search, X, ChevronRight, ChevronDown, Truck } from 'lucide-react';

interface MotoristaRow {
  nome: string;
  total: number;
  ultimaData: string;
  ultimoPedido: string;
  ultimoMotivo: string;
  ultimoStatus: Assistencia['status'];
}

const SESSION_KEY = 'motoristas_filtros';

export default function MotoristasPage() {
  const [assistencias, setAssistencias] = useState<Assistencia[]>([]);
  const [selectedMotorista, setSelectedMotorista] = useState<string | null>(null);
  const [filterMotorista, setFilterMotorista] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');

  // Carrega dados e restaura filtros salvos ao montar
  useEffect(() => {
    setAssistencias(getAssistencias());
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const f = JSON.parse(saved);
        setFilterMotorista(f.filterMotorista ?? '');
        setFilterTipo(f.filterTipo ?? '');
        setFilterCliente(f.filterCliente ?? '');
        setFilterDataInicio(f.filterDataInicio ?? '');
        setFilterDataFim(f.filterDataFim ?? '');
        setSelectedMotorista(f.selectedMotorista ?? null);
      }
    } catch { /* sessionStorage indisponível */ }
  }, []);

  // Persiste filtros no sessionStorage sempre que mudam
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        filterMotorista, filterTipo, filterCliente,
        filterDataInicio, filterDataFim, selectedMotorista,
      }));
    } catch { /* sessionStorage indisponível */ }
  }, [filterMotorista, filterTipo, filterCliente, filterDataInicio, filterDataFim, selectedMotorista]);

  const tiposOcorrencia = useMemo(() => {
    const tipos = assistencias.map(a => a.motivoAssistencia).filter(Boolean);
    return [...new Set(tipos)].sort();
  }, [assistencias]);

  // Tickets passando por todos os filtros menos o de motorista (para calcular summary dos motoristas)
  const ticketsFiltrados = useMemo(() => {
    return assistencias.filter(a => {
      const matchTipo = !filterTipo || a.motivoAssistencia === filterTipo;
      const matchCliente = !filterCliente || a.cliente.toLowerCase().includes(filterCliente.toLowerCase());
      const matchInicio = !filterDataInicio || a.dataEmissao >= filterDataInicio;
      const matchFim = !filterDataFim || a.dataEmissao <= filterDataFim;
      return matchTipo && matchCliente && matchInicio && matchFim;
    });
  }, [assistencias, filterTipo, filterCliente, filterDataInicio, filterDataFim]);

  // Resumo por motorista
  const motoristaRows = useMemo((): MotoristaRow[] => {
    const map = new Map<string, Assistencia[]>();
    ticketsFiltrados.forEach(a => {
      const nome = a.motoristaResponsavel || '(sem motorista)';
      if (!map.has(nome)) map.set(nome, []);
      map.get(nome)!.push(a);
    });

    return [...map.entries()]
      .map(([nome, tickets]) => {
        const sorted = [...tickets].sort(
          (a, b) => new Date(b.dataEmissao || b.createdAt).getTime() - new Date(a.dataEmissao || a.createdAt).getTime()
        );
        const ultima = sorted[0];
        return {
          nome,
          total: tickets.length,
          ultimaData: ultima.dataEmissao,
          ultimoPedido: ultima.pedido,
          ultimoMotivo: ultima.motivoAssistencia,
          ultimoStatus: ultima.status,
        };
      })
      .filter(row => !filterMotorista || row.nome.toLowerCase().includes(filterMotorista.toLowerCase()))
      .sort((a, b) => b.total - a.total);
  }, [ticketsFiltrados, filterMotorista]);

  // Tickets da tabela de baixo (todos os filtros + motorista selecionado + busca por texto)
  const ticketsDetalhes = useMemo(() => {
    return ticketsFiltrados
      .filter(a => {
        const nome = a.motoristaResponsavel || '(sem motorista)';
        const matchSelected = !selectedMotorista || nome === selectedMotorista;
        const matchFilter = !filterMotorista || nome.toLowerCase().includes(filterMotorista.toLowerCase());
        return matchSelected && matchFilter;
      })
      .sort((a, b) => new Date(b.dataEmissao || b.createdAt).getTime() - new Date(a.dataEmissao || a.createdAt).getTime());
  }, [ticketsFiltrados, selectedMotorista, filterMotorista]);

  const hasFilters = filterMotorista || filterTipo || filterCliente || filterDataInicio || filterDataFim;

  const clearFilters = () => {
    setFilterMotorista('');
    setFilterTipo('');
    setFilterCliente('');
    setFilterDataInicio('');
    setFilterDataFim('');
    setSelectedMotorista(null);
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* noop */ }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ocorrências por Motorista</h1>
            <p className="text-slate-500 text-sm mt-1">
              {motoristaRows.length} motorista(s) · {ticketsFiltrados.length} ocorrência(s) no total
            </p>
          </div>
          {(hasFilters || selectedMotorista) && (
            <button onClick={clearFilters} className="btn-secondary">
              <X className="w-4 h-4" />
              Limpar filtros
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="input-field pl-9"
                placeholder="Buscar motorista..."
                value={filterMotorista}
                onChange={e => {
                  setFilterMotorista(e.target.value);
                  if (!e.target.value) setSelectedMotorista(null);
                }}
              />
            </div>
            <select
              className="input-field"
              value={filterTipo}
              onChange={e => setFilterTipo(e.target.value)}
            >
              <option value="">Todos os tipos de ocorrência</option>
              {tiposOcorrencia.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="input-field pl-9"
                placeholder="Buscar cliente..."
                value={filterCliente}
                onChange={e => setFilterCliente(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                className="input-field flex-1"
                title="Data início"
                value={filterDataInicio}
                onChange={e => setFilterDataInicio(e.target.value)}
              />
              <input
                type="date"
                className="input-field flex-1"
                title="Data fim"
                value={filterDataFim}
                onChange={e => setFilterDataFim(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabela de motoristas */}
        <div className="card overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <Truck className="w-4 h-4 text-slate-400" />
            <h2 className="font-bold text-slate-900">Motoristas</h2>
            <span className="text-sm text-slate-400 font-normal ml-1">— clique para filtrar ocorrências</span>
          </div>

          {motoristaRows.length === 0 ? (
            <div className="p-12 text-center">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nenhum motorista encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Motorista', 'Total de Ocorrências', 'Data da Última Ocorrência', 'Último Pedido', 'Motivo da Última Ocorrência', 'Status da Última Ocorrência', ''].map(col => (
                      <th
                        key={col}
                        className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {motoristaRows.map((row) => {
                    const isSelected = selectedMotorista === row.nome;
                    return (
                      <tr
                        key={row.nome}
                        onClick={() => setSelectedMotorista(isSelected ? null : row.nome)}
                        className={`transition-colors duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 hover:bg-blue-100/70'
                            : 'hover:bg-blue-50/40'
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                            {row.nome}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                            row.total >= 4
                              ? 'bg-red-100 text-red-700'
                              : row.total >= 2
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {row.total}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                          {row.ultimaData
                            ? new Date(row.ultimaData + 'T00:00:00').toLocaleDateString('pt-BR')
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-700 whitespace-nowrap">
                          {row.ultimoPedido || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                          {row.ultimoMotivo || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={row.ultimoStatus} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isSelected
                            ? <ChevronDown className="w-4 h-4 text-blue-500" />
                            : <ChevronRight className="w-4 h-4 text-slate-300" />
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tabela de ocorrências */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">
              {selectedMotorista
                ? <>Ocorrências de <span className="text-blue-700">{selectedMotorista}</span></>
                : 'Todas as Ocorrências'}
            </h2>
            <div className="flex items-center gap-3">
              {selectedMotorista && (
                <button
                  onClick={() => setSelectedMotorista(null)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Ver todos
                </button>
              )}
              <span className="text-sm text-slate-500">{ticketsDetalhes.length} registro(s)</span>
            </div>
          </div>

          {ticketsDetalhes.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500 font-medium">Nenhuma ocorrência encontrada</p>
              <p className="text-slate-400 text-sm mt-1">Ajuste os filtros ou selecione um motorista acima</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Pedido', 'Cliente', 'Motorista', 'Tipo de Ocorrência', 'Descrição do Problema', 'Data Emissão', 'Status'].map(col => (
                      <th
                        key={col}
                        className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ticketsDetalhes.map((at) => (
                    <tr
                      key={at.id}
                      className="hover:bg-blue-50/40 transition-colors duration-150 cursor-pointer group"
                      onClick={() => window.location.href = `/assistencias/${at.id}?from=motoristas`}
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                        {at.pedido || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700 max-w-[160px] truncate" title={at.cliente}>
                        {at.cliente}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {at.motoristaResponsavel || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {at.motivoAssistencia || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 max-w-[220px] truncate" title={at.causaAssistencia}>
                        {at.causaAssistencia || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                        {at.dataEmissao
                          ? new Date(at.dataEmissao + 'T00:00:00').toLocaleDateString('pt-BR')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={at.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
