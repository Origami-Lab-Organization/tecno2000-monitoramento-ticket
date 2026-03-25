export type StatusAssistencia =
  | 'Aberto'
  | 'Em Andamento'
  | 'Aguardando Peças'
  | 'Aguardando Cliente'
  | 'Finalizado'
  | 'Cancelado';

export type ModoEnvio =
  | 'Retirada'
  | 'Transportadora'
  | 'Motoboy'
  | 'Correios'
  | 'Frota Própria'
  | '';

export interface Assistencia {
  id: string;
  pedido: string;
  lote: string;
  dataEmissao: string;
  cliente: string;
  cidadeUF: string;
  estado: string;
  nfAt: string;
  nfVenda: string;
  item: string;
  descricaoItem: string;
  quantidade: number | string;
  causaAssistencia: string;
  acoesCorretivas: string;
  motivoAssistencia: string;
  motoristaResponsavel: string;
  setor: string;
  observacaoPedido: string;
  dataFinalizacao: string;
  status: StatusAssistencia;
  modoEnvio: ModoEnvio;
  emitirRncPdcva: boolean;
  observacoes: string;
  createdAt: string;
  updatedAt: string;
}
