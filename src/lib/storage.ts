import { Assistencia } from '@/types/assistencia';

const STORAGE_KEY = 'tecno2000_assistencias';
const STORAGE_EVENT = 'tecno2000-assistencias-updated';

let cachedRawAssistencias: string | null | undefined;
let cachedAssistencias: Assistencia[] = [];

function emitAssistenciasUpdate() {
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function readAssistenciasFromStorage(): Assistencia[] {
  const data = localStorage.getItem(STORAGE_KEY);

  if (data === cachedRawAssistencias) {
    return cachedAssistencias;
  }

  cachedRawAssistencias = data;

  if (!data) {
    cachedAssistencias = [];
    return cachedAssistencias;
  }

  try {
    cachedAssistencias = JSON.parse(data);
  } catch {
    cachedAssistencias = [];
  }

  return cachedAssistencias;
}

export function getAssistencias(): Assistencia[] {
  if (typeof window === 'undefined') return [];
  return readAssistenciasFromStorage();
}

export function getAssistenciasSnapshot(): Assistencia[] {
  if (typeof window === 'undefined') return [];
  return readAssistenciasFromStorage();
}

export function subscribeAssistencias(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleChange = () => onStoreChange();

  window.addEventListener(STORAGE_EVENT, handleChange);
  window.addEventListener('storage', handleChange);

  return () => {
    window.removeEventListener(STORAGE_EVENT, handleChange);
    window.removeEventListener('storage', handleChange);
  };
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
  emitAssistenciasUpdate();
  return newAssistencia;
}

export function updateAssistencia(id: string, data: Partial<Assistencia>): Assistencia | null {
  const assistencias = getAssistencias();
  const index = assistencias.findIndex(a => a.id === id);
  if (index === -1) return null;
  const updated = { ...assistencias[index], ...data, updatedAt: new Date().toISOString() };
  assistencias[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assistencias));
  emitAssistenciasUpdate();
  return updated;
}

export function deleteAssistencia(id: string): boolean {
  const assistencias = getAssistencias();
  const filtered = assistencias.filter(a => a.id !== id);
  if (filtered.length === assistencias.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  emitAssistenciasUpdate();
  return true;
}

export function getAssistenciaById(id: string): Assistencia | null {
  const assistencias = getAssistencias();
  return assistencias.find(a => a.id === id) || null;
}
