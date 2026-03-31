'use client';
import { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import { getAssistencias } from '@/lib/storage';
import { Assistencia } from '@/types/assistencia';
import { Search, Truck, ChevronRight, ChevronDown, AlertTriangle } from 'lucide-react';

export default function MotoristasPage() {
  const [assistencias, setAssistencias] = useState<Assistencia[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setAssistencias(getAssistencias());
  }, []);

  const rows = useMemo(() => {
    const map = new Map<string, Assistencia[]>();
    assistencias.forEach(a => {
      const nome = a.motoristaResponsavel || '(sem motorista)';
      if (!map.has(nome)) map.set(nome, []);
      map.get(nome)!.push(a);
    });
    return [...map.entries()]
      .map(([nome, ats]) => ({
        nome,
        total: ats.length,
        ats: [...ats].sort((a, b) => new Date(b.dataEmissao || b.createdAt).getTime() - new Date(a.dataEmissao || a.createdAt).getTime()),
        rnc: ats.filter(a => a.emitirRncPdcva).length,
        motivos: [...new Set(ats.map(a => a.motivoAssistencia).filter(Boolean))],
      }))
      .filter(r => !search || r.nome.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.total - a.total);
  }, [assistencias, search]);

  const toggle = (nome: string) => setExpanded(prev => prev === nome ? null : nome);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Ocorrências por Motorista</h1>
          <p className="text-slate-500 text-sm mt-1">
            {rows.length} motorista(s) · {assistencias.length} ocorrência(s) no total
          </p>
        </div>

        <div className="card p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              className="input-field pl-9"
              placeholder="Buscar motorista..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="card overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-12 text-center">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nenhum motorista encontrado</p>
            </div>
          ) : (
            <div>
              {rows.map(row => {
                const isOpen = expanded === row.nome;
                return (
                  <div key={row.nome} className="border-b border-slate-100 last:border-0">

                    {/* Linha do motorista */}
                    <button
                      onClick={() => toggle(row.nome)}
                      className={`w-full flex items-center gap-4 px-4 py-4 text-left transition-colors duration-150 ${isOpen ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                    >
                      <div className="flex-shrink-0">
                        {isOpen
                          ? <ChevronDown className="w-4 h-4 text-blue-500" />
                          : <ChevronRight className="w-4 h-4 text-slate-300" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{row.nome}</p>
                        {row.motivos.length > 0 && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {row.motivos.join(' · ')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {row.rnc > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />{row.rnc} RNC
                          </span>
                        )}
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                          row.total >= 4 ? 'bg-red-100 text-red-700'
                          : row.total >= 2 ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                        }`}>
                          {row.total}
                        </span>
                      </div>
                    </button>

                    {/* Detalhe expandido */}
                    {isOpen && (
                      <div className="bg-white border-t border-blue-100 overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                          <thead>
                            <tr className="bg-blue-50/60 border-b border-blue-100">
                              {['Pedido', 'Cliente', 'Motivo', 'Causa', 'Data Emissão', 'Status', 'RNC'].map(col => (
                                <th key={col} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2 whitespace-nowrap">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {row.ats.map(at => (
                              <tr
                                key={at.id}
                                className="hover:bg-blue-50/30 cursor-pointer transition-colors duration-150"
                                onClick={() => window.location.href = `/assistencias/${at.id}?from=motoristas`}
                              >
                                <td className="px-4 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                                  {at.pedido || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-700 max-w-[160px] truncate" title={at.cliente}>
                                  {at.cliente}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                  {at.motivoAssistencia || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate" title={at.causaAssistencia}>
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
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {at.emitirRncPdcva && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                      <AlertTriangle className="w-3 h-3" />RNC
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
