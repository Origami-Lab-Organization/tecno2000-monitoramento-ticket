'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import AssistenciaForm from '@/components/AssistenciaForm';
import { getAssistenciaById, deleteAssistencia, updateAssistencia } from '@/lib/storage';
import { Assistencia, StatusAssistencia } from '@/types/assistencia';
import {
  ChevronLeft, ChevronDown, Edit2, Trash2, User, FileText,
  Package, Wrench, Truck, AlertTriangle, CheckCircle, X, Save,
} from 'lucide-react';

const STATUS_OPTIONS: StatusAssistencia[] = [
  'Aberto', 'Em Andamento', 'Aguardando Peças', 'Aguardando Cliente', 'Finalizado', 'Cancelado',
];

function DetailField({ label, value }: { label: string; value: string | number | boolean | undefined }) {
  if (typeof value === 'boolean') {
    return (
      <div>
        <p className="label">{label}</p>
        <div className={`flex items-center gap-1.5 text-sm font-medium ${value ? 'text-amber-700' : 'text-slate-400'}`}>
          {value ? <><CheckCircle className="w-4 h-4" />Sim</> : <><X className="w-4 h-4" />Não</>}
        </div>
      </div>
    );
  }
  return (
    <div>
      <p className="label">{label}</p>
      <p className="text-sm text-slate-800 font-medium">{value || <span className="text-slate-400 font-normal">—</span>}</p>
    </div>
  );
}

export default function AssistenciaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [at, setAt] = useState<Assistencia | null>(null);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [showDelete, setShowDelete] = useState(false);
  const [open, setOpen] = useState(false);
  const [backPath, setBackPath] = useState('/assistencias');

  // Status edit
  const [editingStatus, setEditingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusAssistencia>('Aberto');
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    setBackPath(from === 'motoristas' ? '/motoristas' : '/assistencias');
    const found = getAssistenciaById(id);
    if (!found) { window.location.href = '/assistencias'; return; }
    setAt(found);
    setSelectedStatus(found.status);
  }, [id]);

  const handleSaveStatus = () => {
    if (!at) return;
    setSavingStatus(true);
    const updated = updateAssistencia(at.id, { status: selectedStatus });
    if (updated) setAt(updated);
    setSavingStatus(false);
    setEditingStatus(false);
  };

  const handleDelete = () => {
    deleteAssistencia(id);
    router.push('/assistencias');
  };

  if (!at) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const formatDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
  const formatDateTime = (d: string) => d ? new Date(d).toLocaleString('pt-BR') : '—';

  if (mode === 'edit') {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-6">
            <button onClick={() => setMode('view')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3 transition-colors">
              <ChevronLeft className="w-4 h-4" />Voltar para detalhes
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Editar Assistência</h1>
            <p className="text-slate-500 text-sm mt-1">Pedido: {at.pedido || '—'} · {at.cliente}</p>
          </div>
          <AssistenciaForm assistencia={at} mode="edit" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">

        {/* Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => window.location.href = backPath}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {backPath === '/motoristas' ? 'Voltar para Motoristas' : 'Voltar para Assistências'}
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">
                  {at.pedido ? `Pedido #${at.pedido}` : 'Assistência Técnica'}
                </h1>

                {/* Status inline edit */}
                {editingStatus ? (
                  <div className="flex items-center gap-2">
                    <select
                      className="input-field py-1 text-sm"
                      value={selectedStatus}
                      onChange={e => setSelectedStatus(e.target.value as StatusAssistencia)}
                      autoFocus
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={handleSaveStatus}
                      disabled={savingStatus}
                      className="flex items-center gap-1 text-xs font-medium text-white bg-brand hover:bg-brand-dark px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Save className="w-3 h-3" />Salvar
                    </button>
                    <button
                      onClick={() => { setEditingStatus(false); setSelectedStatus(at.status); }}
                      className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <X className="w-3 h-3" />Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingStatus(true)}
                    className="group flex items-center gap-1.5"
                    title="Clique para alterar status"
                  >
                    <StatusBadge status={at.status} />
                    <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </button>
                )}

                {at.emitirRncPdcva && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <AlertTriangle className="w-3 h-3" />RNC/PDCVA
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm">
                Criado em {formatDateTime(at.createdAt)}
                {at.updatedAt !== at.createdAt && ` · Atualizado em ${formatDateTime(at.updatedAt)}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowDelete(true)} className="btn-danger">
                <Trash2 className="w-4 h-4" />Excluir
              </button>
              <button onClick={() => setMode('edit')} className="btn-primary">
                <Edit2 className="w-4 h-4" />Editar
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Dados da Ocorrência */}
            <div className="card p-6">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand" />Dados da Ocorrência
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                <DetailField label="Data Emissão" value={formatDate(at.dataEmissao)} />
                <DetailField label="Data Finalização" value={formatDate(at.dataFinalizacao)} />
                <DetailField label="Causa da Assistência" value={at.causaAssistencia} />
                <DetailField label="Status" value={at.status} />
              </div>

              {/* Assistência Técnica colapsável */}
              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-600" />Assistência Técnica
                  </h2>
                  <button
                    onClick={() => setOpen(o => !o)}
                    className="text-sm text-amber-600 hover:text-amber-800 transition-colors flex items-center gap-1"
                  >
                    {open ? <><X className="w-4 h-4" />Fechar detalhes</> : <><ChevronDown className="w-4 h-4" />Ver detalhes</>}
                  </button>
                </div>
                {open && (
                  <div className="card p-6 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="label">Motivo da Assistência</p>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap">{at.motivoAssistencia || <span className="text-slate-400">—</span>}</p>
                      </div>
                      <div>
                        <p className="label">Ações Corretivas</p>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap">{at.acoesCorretivas || <span className="text-slate-400">—</span>}</p>
                      </div>
                      <div>
                        <p className="label">Observação do Pedido</p>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap">{at.observacaoPedido || <span className="text-slate-400">—</span>}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="label">Observações Gerais</p>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap">{at.observacoes || <span className="text-slate-400">—</span>}</p>
                      </div>
                    </div>
                    {at.emitirRncPdcva && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span className="text-sm font-semibold text-amber-800">RNC/PDCVA marcado para emissão</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Dados do Pedido */}
            <div className="card p-6">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand" />Dados do Pedido
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <DetailField label="Pedido" value={at.pedido} />
                <DetailField label="Lote" value={at.lote} />
                <DetailField label="NF AT" value={at.nfAt} />
                <DetailField label="NF Venda" value={at.nfVenda} />
                <DetailField label="Setor" value={at.setor} />
              </div>
            </div>

            {/* Dados do Item */}
            <div className="card p-6">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-brand" />Dados do Item
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <DetailField label="Item" value={at.item} />
                <div className="col-span-2">
                  <DetailField label="Descrição do Item" value={at.descricaoItem} />
                </div>
                <DetailField label="Quantidade" value={at.quantidade as string} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-brand" />Cliente
              </h2>
              <div className="space-y-3">
                <DetailField label="Cliente" value={at.cliente} />
                <DetailField label="Cidade/UF" value={at.cidadeUF} />
                <DetailField label="Estado" value={at.estado} />
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand" />Logística
              </h2>
              <div className="space-y-3">
                <DetailField label="Motorista Responsável" value={at.motoristaResponsavel} />
                <DetailField label="Modo de Envio" value={at.modoEnvio} />
              </div>
            </div>

            <div className={`card p-6 ${at.emitirRncPdcva ? 'border-amber-300 bg-amber-50' : ''}`}>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${at.emitirRncPdcva ? 'text-amber-600' : 'text-slate-400'}`} />
                RNC / PDCVA
              </h2>
              <DetailField label="Emitir RNC/PDCVA" value={at.emitirRncPdcva} />
            </div>
          </div>
        </div>
      </main>

      {showDelete && (
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
              <button onClick={() => setShowDelete(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
              <button
                onClick={handleDelete}
                className="flex-1 justify-center bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
