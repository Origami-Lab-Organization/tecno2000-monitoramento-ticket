'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import { getAssistencias } from '@/lib/storage';
import { Assistencia } from '@/types/assistencia';
import { PlusCircle, TrendingUp, Clock, CheckCircle, AlertTriangle, ArrowRight, Wrench } from 'lucide-react';

export default function Dashboard() {
  const [assistencias, setAssistencias] = useState<Assistencia[]>([]);

  useEffect(() => {
    setAssistencias(getAssistencias());
  }, []);

  const stats = {
    total: assistencias.length,
    abertas: assistencias.filter(a => a.status === 'Aberto').length,
    emAndamento: assistencias.filter(a => a.status === 'Em Andamento').length,
    finalizadas: assistencias.filter(a => a.status === 'Finalizado').length,
    rnc: assistencias.filter(a => a.emitirRncPdcva).length,
  };

  const recentes = assistencias
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statCards = [
    { label: 'Total de ATs', value: stats.total, icon: Wrench, bg: 'bg-blue-50', iconColor: 'text-blue-600', valueColor: 'text-blue-700' },
    { label: 'Em Aberto', value: stats.abertas, icon: AlertTriangle, bg: 'bg-amber-50', iconColor: 'text-amber-600', valueColor: 'text-amber-700' },
    { label: 'Em Andamento', value: stats.emAndamento, icon: Clock, bg: 'bg-indigo-50', iconColor: 'text-indigo-600', valueColor: 'text-indigo-700' },
    { label: 'Finalizadas', value: stats.finalizadas, icon: CheckCircle, bg: 'bg-emerald-50', iconColor: 'text-emerald-600', valueColor: 'text-emerald-700' },
    { label: 'RNC/PDCVA', value: stats.rnc, icon: TrendingUp, bg: 'bg-red-50', iconColor: 'text-red-600', valueColor: 'text-red-700' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Visão geral das assistências técnicas</p>
          </div>
          <Link href="/assistencias/nova" className="btn-primary">
            <PlusCircle className="w-4 h-4" />
            Nova Assistência
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`card p-5 ${card.bg} border-0`}>
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <div className={`text-3xl font-bold ${card.valueColor} mb-1`}>{card.value}</div>
                <div className="text-xs text-slate-600 font-medium">{card.label}</div>
              </div>
            );
          })}
        </div>

        {/* Recent */}
        <div className="card">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Assistências Recentes</h2>
            <Link href="/assistencias" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {recentes.length === 0 ? (
            <div className="p-12 text-center">
              <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nenhuma assistência cadastrada</p>
              <p className="text-slate-400 text-sm mt-1">Comece criando uma nova assistência técnica</p>
              <Link href="/assistencias/nova" className="btn-primary mt-4 inline-flex">
                <PlusCircle className="w-4 h-4" />
                Criar primeira AT
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Pedido</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Cliente</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Data Emissão</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentes.map((at) => (
                    <tr key={at.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{at.pedido || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{at.cliente}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{at.dataEmissao ? new Date(at.dataEmissao + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                      <td className="px-6 py-4"><StatusBadge status={at.status} /></td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/assistencias/${at.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          Ver detalhes →
                        </Link>
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
