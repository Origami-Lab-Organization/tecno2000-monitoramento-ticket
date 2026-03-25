import { StatusAssistencia } from '@/types/assistencia';

const statusConfig: Record<StatusAssistencia, { bg: string; text: string; dot: string }> = {
  'Aberto': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  'Em Andamento': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Aguardando Peças': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  'Aguardando Cliente': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'Finalizado': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Cancelado': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export default function StatusBadge({ status }: { status: StatusAssistencia }) {
  const config = statusConfig[status] || statusConfig['Aberto'];
  return (
    <span className={`status-badge ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5`} />
      {status}
    </span>
  );
}
