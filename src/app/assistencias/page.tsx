'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import { getAssistencias, deleteAssistencia } from '@/lib/storage';
import { Assistencia, StatusAssistencia } from '@/types/assistencia';
import { PlusCircle, Search, Filter, Trash2, Eye, AlertTriangle, Wrench } from 'lucide-react';

const STATUS_FILTER_OPTIONS: (StatusAssistencia | 'Todos')[] = [
  'Todos', 'Aberto', 'Em Andamento', 'Aguardando Peças', 'Aguardando Cliente', 'Finalizado', 'Cancelado'
];

export default function AssistenciasPage() {
  const [assistencias, setAssistencias] = useState<Assistencia[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusAssistencia | 'Todos'>('Todos');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    setAssistencias(getAssistencias());
  }, []);

  const filtered = useMemo(() => {
    return assistencias
      .filter(a => {
        const matchStatus = statusFilter === 'Todos' || a.status === statusFilter;
        const matchSearch = !search ||
          a.cliente.toLowerCase().includes(search.toLowerCase()) ||
          a.pedido.toLowerCase().includes(search.toLowerCase()) ||
          a.descricaoItem.toLowerCase().includes(search.toLowerCase()) ||
          a.nfVenda.toLowerCase().includes(search.toLowerCase()) ||
          a.nfAt.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [assistencias, search, statusFilter]);

  const handleDelete = (id: string) => {
    deleteAssistencia(id);
    setAssistencias(getAssistencias());
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Assistências Técnicas</h1>
            <p className="text-slate-500 text-sm mt-1">{filtered.length} registro(s) encontrado(s)</p>
          </div>
          <Link href="/assistencias/nova" className="btn-primary">
            <PlusCircle className="w-4 h-4" />
            Nova Assistência
          </Link>
        </div>

        <div className="card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="input-field pl-9"
                placeholder="Buscar por cliente, pedido, NF, descrição..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select
                className="input-field min-w-[160px]"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusAssistencia | 'Todos')}
              >
                {STATUS_FILTER_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">
                {assistencias.length === 0 ? 'Nenhuma assistência cadastrada' : 'Nenhum resultado encontrado'}
              </p>
              {assistencias.length === 0 && (
                <Link href="/assistencias/nova" className="btn-primary mt-4 inline-flex">
                  <PlusCircle className="w-4 h-4" />
                  Criar primeira AT
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Pedido', 'Cliente', 'Cidade/UF', 'Emissão', 'Item', 'NF Venda', 'Motorista', 'Status', 'RNC', 'Ações'].map(col => (
                      <th key={col} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((at) => (
                    <tr
                      key={at.id}
                      className="hover:bg-brand-50/40 transition-colors duration-150 cursor-pointer group"
                      onClick={() => window.location.href = `/assistencias/${at.id}`}
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">{at.pedido || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 max-w-[180px] truncate font-medium">{at.cliente}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{at.cidadeUF || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                        {at.dataEmissao ? new Date(at.dataEmissao + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{at.item || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{at.nfVenda || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{at.motoristaResponsavel || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={at.status} /></td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {at.emitirRncPdcva && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />RNC
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/assistencias/${at.id}`}
                            className="p-1.5 text-slate-500 hover:text-brand hover:bg-brand-50 rounded-lg transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm(at.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Confirmar exclusão</h3>
                <p className="text-sm text-slate-500">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger flex-1 justify-center bg-red-600 text-white hover:bg-red-700 border-0">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
