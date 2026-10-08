'use client';
import { useEffect, useState } from 'react';
import { advanceWorkflow, emptyWorkflow, readWorkflow, writeWorkflow, WORKFLOW_EVENT, type WorkflowState } from './browser-workflow';

export function useWorkflow() {
  const [state, setState] = useState<WorkflowState>(emptyWorkflow);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_APP_SCOPE !== 'demo') return;
    const refresh = () => {
      try {
        const current = readWorkflow();
        if (advanceWorkflow(current)) { writeWorkflow(current); return; }
        setState(current); setReady(true);
      } catch { setError('No se pudo guardar el cambio. Revisa el almacenamiento del navegador.'); setReady(true); }
    };
    refresh(); window.addEventListener(WORKFLOW_EVENT, refresh); window.addEventListener('storage', refresh);
    const timer = window.setInterval(refresh, 1000);
    return () => { clearInterval(timer); window.removeEventListener(WORKFLOW_EVENT, refresh); window.removeEventListener('storage', refresh); };
  }, []);
  return { state, ready, error };
}
