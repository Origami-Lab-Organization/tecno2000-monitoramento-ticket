'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Assistencia, StatusAssistencia, ModoEnvio } from '@/types/assistencia';
import { saveAssistencia, updateAssistencia } from '@/lib/storage';
import { Save, X, AlertCircle } from 'lucide-react';

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

const STATUS_OPTIONS: StatusAssistencia[] = [
  'Aberto', 'Em Andamento', 'Aguardando Peças', 'Aguardando Cliente', 'Finalizado', 'Cancelado'
];

const MODO_ENVIO_OPTIONS: ModoEnvio[] = [
  '', 'Retirada', 'Transportadora', 'Motoboy', 'Correios', 'Frota Própria'
];

const SETOR_OPTIONS = [
  '', 'Comercial', 'Técnico', 'Logística', 'Administrativo', 'Produção', 'Qualidade'
];

interface Props {
  assistencia?: Assistencia;
  mode: 'create' | 'edit';
}

type FormData = Omit<Assistencia, 'id' | 'createdAt' | 'updatedAt'>;

const defaultForm: FormData = {
  pedido: '',
  lote: '',
  dataEmissao: '',
  cliente: '',
  cidadeUF: '',
  estado: '',
  nfAt: '',
  nfVenda: '',
  item: '',
  descricaoItem: '',
  quantidade: '',
  causaAssistencia: '',
  acoesCorretivas: '',
  motivoAssistencia: '',
  motoristaResponsavel: '',
  setor: '',
  observacaoPedido: '',
  dataFinalizacao: '',
  status: 'Aberto',
  modoEnvio: '',
  emitirRncPdcva: false,
  observacoes: '',
};

export default function AssistenciaForm({ assistencia, mode }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(
    assistencia ? {
      pedido: assistencia.pedido,
      lote: assistencia.lote,
      dataEmissao: assistencia.dataEmissao,
      cliente: assistencia.cliente,
      cidadeUF: assistencia.cidadeUF,
      estado: assistencia.estado,
      nfAt: assistencia.nfAt,
      nfVenda: assistencia.nfVenda,
      item: assistencia.item,
      descricaoItem: assistencia.descricaoItem,
      quantidade: assistencia.quantidade,
      causaAssistencia: assistencia.causaAssistencia,
      acoesCorretivas: assistencia.acoesCorretivas,
      motivoAssistencia: assistencia.motivoAssistencia,
      motoristaResponsavel: assistencia.motoristaResponsavel,
      setor: assistencia.setor,
      observacaoPedido: assistencia.observacaoPedido,
      dataFinalizacao: assistencia.dataFinalizacao,
      status: assistencia.status,
      modoEnvio: assistencia.modoEnvio,
      emitirRncPdcva: assistencia.emitirRncPdcva,
      observacoes: assistencia.observacoes,
    } : defaultForm
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [saving, setSaving] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.cliente.trim()) newErrors.cliente = 'Cliente é obrigatório';
    if (!form.dataEmissao) newErrors.dataEmissao = 'Data de emissão é obrigatória';
    if (!form.status) newErrors.status = 'Status é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string | boolean | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (mode === 'create') {
        const saved = saveAssistencia(form);
        router.push(`/assistencias/${saved.id}`);
      } else if (assistencia) {
        updateAssistencia(assistencia.id, form);
        router.push(`/assistencias/${assistencia.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 1: Dados do Pedido */}
      <div className="card p-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-brand-100 text-brand rounded-full flex items-center justify-center text-xs font-bold">1</span>
          Dados do Pedido
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Pedido</label>
            <input
              type="text"
              className="input-field"
              value={form.pedido}
              onChange={e => handleChange('pedido', e.target.value)}
              placeholder="Nº do pedido"
            />
          </div>
          <div>
            <label className="label">Lote</label>
            <input
              type="text"
              className="input-field"
              value={form.lote}
              onChange={e => handleChange('lote', e.target.value)}
              placeholder="Nº do lote"
            />
          </div>
          <div>
            <label className="label">
              Data Emissão <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={`input-field ${errors.dataEmissao ? 'border-red-300 bg-red-50' : ''}`}
              value={form.dataEmissao}
              onChange={e => handleChange('dataEmissao', e.target.value)}
            />
            {errors.dataEmissao && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.dataEmissao}
              </p>
            )}
          </div>
          <div>
            <label className="label">Data Finalização</label>
            <input
              type="date"
              className="input-field"
              value={form.dataFinalizacao}
              onChange={e => handleChange('dataFinalizacao', e.target.value)}
            />
          </div>
          <div>
            <label className="label">NF AT</label>
            <input
              type="text"
              className="input-field"
              value={form.nfAt}
              onChange={e => handleChange('nfAt', e.target.value)}
              placeholder="Nota fiscal AT"
            />
          </div>
          <div>
            <label className="label">NF Venda</label>
            <input
              type="text"
              className="input-field"
              value={form.nfVenda}
              onChange={e => handleChange('nfVenda', e.target.value)}
              placeholder="Nota fiscal venda"
            />
          </div>
          <div>
            <label className="label">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              className={`input-field ${errors.status ? 'border-red-300 bg-red-50' : ''}`}
              value={form.status}
              onChange={e => handleChange('status', e.target.value as StatusAssistencia)}
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Setor</label>
            <select
              className="input-field"
              value={form.setor}
              onChange={e => handleChange('setor', e.target.value)}
            >
              {SETOR_OPTIONS.map(s => <option key={s} value={s}>{s || 'Selecione...'}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Dados do Cliente */}
      <div className="card p-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-brand-100 text-brand rounded-full flex items-center justify-center text-xs font-bold">2</span>
          Dados do Cliente
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="label">
              Cliente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`input-field ${errors.cliente ? 'border-red-300 bg-red-50' : ''}`}
              value={form.cliente}
              onChange={e => handleChange('cliente', e.target.value)}
              placeholder="Nome do cliente"
            />
            {errors.cliente && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.cliente}
              </p>
            )}
          </div>
          <div>
            <label className="label">Cidade/UF</label>
            <input
              type="text"
              className="input-field"
              value={form.cidadeUF}
              onChange={e => handleChange('cidadeUF', e.target.value)}
              placeholder="Ex: São Paulo/SP"
            />
          </div>
          <div>
            <label className="label">Estado</label>
            <select
              className="input-field"
              value={form.estado}
              onChange={e => handleChange('estado', e.target.value)}
            >
              <option value="">Selecione...</option>
              {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Motorista Responsável</label>
            <input
              type="text"
              className="input-field"
              value={form.motoristaResponsavel}
              onChange={e => handleChange('motoristaResponsavel', e.target.value)}
              placeholder="Nome do motorista"
            />
          </div>
          <div>
            <label className="label">Modo de Envio</label>
            <select
              className="input-field"
              value={form.modoEnvio}
              onChange={e => handleChange('modoEnvio', e.target.value as ModoEnvio)}
            >
              {MODO_ENVIO_OPTIONS.map(m => <option key={m} value={m}>{m || 'Selecione...'}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Dados do Item */}
      <div className="card p-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-brand-100 text-brand rounded-full flex items-center justify-center text-xs font-bold">3</span>
          Dados do Item
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Item</label>
            <input
              type="text"
              className="input-field"
              value={form.item}
              onChange={e => handleChange('item', e.target.value)}
              placeholder="Código do item"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="label">Descrição do Item</label>
            <input
              type="text"
              className="input-field"
              value={form.descricaoItem}
              onChange={e => handleChange('descricaoItem', e.target.value)}
              placeholder="Descrição completa do item"
            />
          </div>
          <div>
            <label className="label">Quantidade</label>
            <input
              type="number"
              className="input-field"
              value={form.quantidade}
              onChange={e => handleChange('quantidade', e.target.value)}
              placeholder="Qtd"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Assistência */}
      <div className="card p-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-brand-100 text-brand rounded-full flex items-center justify-center text-xs font-bold">4</span>
          Assistência Técnica
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Causa da Assistência</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.causaAssistencia}
              onChange={e => handleChange('causaAssistencia', e.target.value)}
              placeholder="Descreva a causa da assistência..."
            />
          </div>
          <div>
            <label className="label">Motivo da Assistência</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.motivoAssistencia}
              onChange={e => handleChange('motivoAssistencia', e.target.value)}
              placeholder="Motivo da assistência..."
            />
          </div>
          <div>
            <label className="label">Ações Corretivas</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.acoesCorretivas}
              onChange={e => handleChange('acoesCorretivas', e.target.value)}
              placeholder="Ações corretivas tomadas..."
            />
          </div>
          <div>
            <label className="label">Observação do Pedido</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.observacaoPedido}
              onChange={e => handleChange('observacaoPedido', e.target.value)}
              placeholder="Observações sobre o pedido..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Observações Gerais</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.observacoes}
              onChange={e => handleChange('observacoes', e.target.value)}
              placeholder="Observações adicionais..."
            />
          </div>
        </div>

        {/* RNC / PDCVA */}
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={form.emitirRncPdcva}
                onChange={e => handleChange('emitirRncPdcva', e.target.checked)}
              />
              <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${form.emitirRncPdcva ? 'bg-amber-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.emitirRncPdcva ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-800">Emitir RNC / PDCVA</span>
              <p className="text-xs text-slate-500">Marque se necessário emitir Relatório de Não Conformidade ou PDCVA</p>
            </div>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 py-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary min-w-[140px] justify-center"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : mode === 'create' ? 'Criar Assistência' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
}
