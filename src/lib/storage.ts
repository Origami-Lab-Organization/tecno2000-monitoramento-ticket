import { Assistencia } from '@/types/assistencia';

const STORAGE_KEY = 'tecno2000_assistencias';

export function getAssistencias(): Assistencia[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveAssistencia(assistencia: Omit<Assistencia, 'id' | 'createdAt' | 'updatedAt'>): Assistencia {
  const assistencias = getAssistencias();
  const now = new Date().toISOString();
  const newAssistencia: Assistencia = {
    ...assistencia,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  assistencias.push(newAssistencia);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assistencias));
  return newAssistencia;
}

export function updateAssistencia(id: string, data: Partial<Assistencia>): Assistencia | null {
  const assistencias = getAssistencias();
  const index = assistencias.findIndex(a => a.id === id);
  if (index === -1) return null;
  const updated = { ...assistencias[index], ...data, updatedAt: new Date().toISOString() };
  assistencias[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assistencias));
  return updated;
}

export function deleteAssistencia(id: string): boolean {
  const assistencias = getAssistencias();
  const filtered = assistencias.filter(a => a.id !== id);
  if (filtered.length === assistencias.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function getAssistenciaById(id: string): Assistencia | null {
  const assistencias = getAssistencias();
  return assistencias.find(a => a.id === id) || null;
}
