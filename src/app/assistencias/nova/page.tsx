import Navbar from '@/components/Navbar';
import AssistenciaForm from '@/components/AssistenciaForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function NovaAssistenciaPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href="/assistencias" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Voltar para listagem
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Nova Assistência Técnica</h1>
          <p className="text-slate-500 text-sm mt-1">Preencha os campos abaixo para registrar uma nova AT</p>
        </div>
        <AssistenciaForm mode="create" />
      </main>
    </div>
  );
}
