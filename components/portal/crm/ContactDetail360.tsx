'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookmarkPlus, Building2, Calendar, CheckCircle2, ChevronRight, Circle, Clock, ExternalLink, FileText, Globe, Layers, Mail, MessageSquare, Phone, Plus, Send, Tag, Trash2, X } from 'lucide-react';
import { cn, formatCurrency, formatPortalDate, formatPortalDateTime, formatPortalTime } from '@/lib/utils';
import type { ContactDetail, AccessibleProject, ClientDocument, ClientReservationPayment } from '@/lib/data/crm';
import type { ContactLeadReport, LeadReportTarget } from '@/lib/data/crm';
import LeadReportingDialog from '@/components/portal/crm/LeadReportingDialog';
import ClientDocumentsPanel from '@/components/portal/crm/ClientDocumentsPanel';
import ReservationPaymentPanel from '@/components/portal/crm/ReservationPaymentPanel';
import { addContactActivityAction, addContactNoteAction, createOpportunityAction, addProjectToOpportunityAction, addUnitToOpportunityAction, removeUnitFromOpportunityAction, requestUnitReservationAction, getAvailableUnitsAction, toggleTaskCompleteAction, updateOpportunityStageAction } from '@/app/portal/crm/actions';

type Props = {
  contact: ContactDetail;
  reportTargets?: LeadReportTarget[];
  leadReports?: ContactLeadReport[];
  accessibleProjects?: AccessibleProject[];
  clientDocuments?: ClientDocument[];
  reservationPayments?: ClientReservationPayment[];
};

export default function ContactDetail360({ contact, reportTargets = [], leadReports = [], accessibleProjects = [], clientDocuments = [], reservationPayments = [] }: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'notes' | 'activities' | 'tasks'>('all');
  const [noteBody, setNoteBody] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const [activityType, setActivityType] = useState<'call' | 'whatsapp' | 'meeting' | 'task' | null>(null);
  const [activitySubject, setActivitySubject] = useState('');
  const [activityDetails, setActivityDetails] = useState('');
  const [activityDueAt, setActivityDueAt] = useState('');
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  const [notice, setNotice] = useState('');
  const notify = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 2500);
  };

  // Negotiation state
  const [showNewOppModal, setShowNewOppModal] = useState(false);
  const [newOppProjectId, setNewOppProjectId] = useState('');
  const [isPending, startTransition] = useTransition();

  // Unit selector state
  const [selectingUnitsForProject, setSelectingUnitsForProject] = useState<{ oppId: number; projectId: number; projectName: string } | null>(null);
  const [availableUnits, setAvailableUnits] = useState<Awaited<ReturnType<typeof getAvailableUnitsAction>>>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Reservation request state
  const [reservationModal, setReservationModal] = useState<{ oppId: number; unitId: number; unitCode: string; price: number; currency: string } | null>(null);
  const [reservationNotes, setReservationNotes] = useState('');

  const primaryOpp = contact.opportunities[0];

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBody.trim()) return;
    setIsAddingNote(true);
    const res = await addContactNoteAction(contact.id, noteBody);
    setIsAddingNote(false);
    if (res.success) {
      setNoteBody('');
      notify('Nota agregada al timeline.');
    } else {
      notify(res.error || 'Error al agregar nota.');
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityType || !activitySubject.trim()) return;
    setIsSubmittingActivity(true);
    const res = await addContactActivityAction(contact.id, activityType, activitySubject, activityDetails, activityDueAt);
    setIsSubmittingActivity(false);
    if (res.success) {
      setActivityType(null);
      setActivitySubject('');
      setActivityDetails('');
      setActivityDueAt('');
      notify('Actividad registrada en el timeline.');
    } else {
      notify(res.error || 'Error al registrar actividad.');
    }
  };

  const handleToggleTask = async (activityId: number, currentCompleted: boolean) => {
    const res = await toggleTaskCompleteAction(activityId, contact.id, !currentCompleted);
    if (res.success) notify(!currentCompleted ? 'Tarea completada' : 'Tarea reabierta');
  };

  const handleStageChange = async (newStage: string) => {
    if (!primaryOpp) return;
    const res = await updateOpportunityStageAction(primaryOpp.id, newStage, contact.id);
    if (res.success) notify(`Etapa actualizada a: ${newStage.toUpperCase()}`);
    else notify(res.error || 'Error al cambiar etapa.');
  };

  const handleCreateOpportunity = () => {
    startTransition(async () => {
      const res = await createOpportunityAction(contact.id, newOppProjectId ? Number(newOppProjectId) : undefined);
      if (res.success) {
        setShowNewOppModal(false);
        setNewOppProjectId('');
        notify(res.message || 'Negociación creada.');
        window.location.reload();
      } else {
        notify(res.error || 'Error al crear negociación.');
      }
    });
  };

  const handleAddProject = (oppId: number, projectId: number) => {
    startTransition(async () => {
      const res = await addProjectToOpportunityAction(oppId, projectId, contact.id);
      if (res.success) {
        notify('Proyecto vinculado.');
        window.location.reload();
      } else {
        notify(res.error || 'Error.');
      }
    });
  };

  const handleOpenUnitSelector = async (oppId: number, projectId: number, projectName: string) => {
    setSelectingUnitsForProject({ oppId, projectId, projectName });
    setLoadingUnits(true);
    const units = await getAvailableUnitsAction(projectId);
    setAvailableUnits(units);
    setLoadingUnits(false);
  };

  const handleAddUnit = (oppId: number, unitId: number) => {
    startTransition(async () => {
      const res = await addUnitToOpportunityAction(oppId, unitId, contact.id);
      if (res.success) {
        notify('Unidad vinculada.');
        setSelectingUnitsForProject(null);
        window.location.reload();
      } else {
        notify(res.error || 'Error.');
      }
    });
  };

  const handleRemoveUnit = (oppId: number, unitId: number) => {
    startTransition(async () => {
      const res = await removeUnitFromOpportunityAction(oppId, unitId, contact.id);
      if (res.success) {
        notify('Unidad removida.');
        window.location.reload();
      } else {
        notify(res.error || 'Error.');
      }
    });
  };

  const handleRequestReservation = () => {
    if (!reservationModal) return;
    startTransition(async () => {
      const res = await requestUnitReservationAction(reservationModal.oppId, reservationModal.unitId, contact.id, reservationNotes);
      if (res.success) {
        setReservationModal(null);
        setReservationNotes('');
        notify(res.message || 'Solicitud de reserva enviada.');
        window.location.reload();
      } else {
        notify(res.error || 'Error.');
      }
    });
  };

  const timelineItems = [
    ...contact.notes.map((n) => ({
      id: `note-${n.id}`,
      type: 'note' as const,
      title: 'Nota interna',
      body: n.body,
      date: n.createdAt,
    })),
    ...contact.activities.map((a) => ({
      id: `act-${a.id}`,
      rawId: a.id,
      type: a.kind as 'call' | 'email' | 'whatsapp' | 'meeting' | 'visit' | 'task' | 'system',
      title: a.subject,
      body: a.details,
      date: a.createdAt,
      dueAt: a.dueAt,
      completedAt: a.completedAt,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTimeline = timelineItems.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'notes') return item.type === 'note';
    if (activeTab === 'activities') return item.type === 'call' || item.type === 'whatsapp' || item.type === 'meeting' || item.type === 'email';
    if (activeTab === 'tasks') return item.type === 'task';
    return true;
  });

  const pendingTasks = contact.activities.filter((a) => a.kind === 'task' && !a.completedAt);

  const linkedProjectIds = new Set(primaryOpp?.projects.map((p) => p.id) || []);
  const unlinkedProjects = accessibleProjects.filter((p) => !linkedProjectIds.has(p.id));

  const canRequestReservation = primaryOpp && ['negotiation', 'reservation', 'proposal', 'qualified'].includes(primaryOpp.stage);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-4 rounded-2xl shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Link href="/portal/clientes" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="min-w-0 break-words text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{contact.fullName}</h1>
              <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500">{contact.publicCode}</span>
              {contact.classification && <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-700">{contact.classification}</span>}
            </div>
            <p className="text-xs text-slate-400 mt-0.5"><LocalizedText text={"Ficha 360 · Registrado el "} />{formatPortalDate(contact.createdAt)}</p>
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <Link
            href={`/inversionista/${contact.publicCode}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir vista que ve el cliente con sus pagos, contratos y avances de obra"
            className="inline-flex min-w-0 min-h-10 items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-2.5 text-center text-xs font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-100 sm:h-10 sm:px-3.5"
          >
            <ExternalLink className="h-4 w-4 text-indigo-600" />
            <LocalizedText text={"Portal Cliente"} />
          </Link>
          <LeadReportingDialog contactId={contact.id} contactName={contact.fullName} targets={reportTargets} reports={leadReports} />
          <button type="button" onClick={() => setShowNewOppModal(true)} className="inline-flex min-w-0 min-h-10 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-2.5 text-center text-xs font-bold text-blue-800 transition hover:bg-blue-100 sm:h-10 sm:px-4">
            <Plus className="h-4 w-4" /><LocalizedText text={" Nueva Negociación"} /></button>
          <a href={`https://wa.me/${contact.phoneNormalized || contact.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 min-h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-2.5 text-center text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:h-10 sm:px-4">
            <MessageSquare className="h-4 w-4" /><LocalizedText text={" Chat WhatsApp"} /></a>
          <Link href={`/portal/proposals/new?contactId=${contact.id}`} className="inline-flex min-w-0 min-h-10 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-2.5 text-center text-xs font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 sm:h-10 sm:px-4">
            <FileText className="h-4 w-4" /><LocalizedText text={" Nueva Propuesta"} /></Link>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* COLUMNA 1: PERFIL */}
        <div className="space-y-5 lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 font-extrabold text-white text-lg shadow-md shadow-blue-200">
                {contact.firstName[0]}{contact.lastName?.[0] || ''}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold text-slate-900 truncate text-base">{contact.fullName}</h2>
                <p className="text-xs text-slate-400 truncate">{contact.email || 'Sin correo'}</p>
                <p className="text-xs font-bold text-blue-600 mt-0.5">{contact.phone}</p>
              </div>
            </div>
            <hr className="border-slate-100" />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2"><LocalizedText text={"Canales de Contacto (DND)"} /></p>
              <div className="grid grid-cols-2 gap-2">
                <div className={cn('flex items-center gap-2 rounded-xl p-2 text-xs font-semibold', contact.dnd.whatsapp ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700')}>
                  <MessageSquare className="h-4 w-4" /><LocalizedText text={" WhatsApp: "} />{contact.dnd.whatsapp ? 'No' : 'Activo'}
                </div>
                <div className={cn('flex items-center gap-2 rounded-xl p-2 text-xs font-semibold', contact.dnd.email ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700')}>
                  <Mail className="h-4 w-4" /><LocalizedText text={" Email: "} />{contact.dnd.email ? 'No' : 'Activo'}
                </div>
                <div className={cn('flex items-center gap-2 rounded-xl p-2 text-xs font-semibold', contact.dnd.calls ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-700')}>
                  <Phone className="h-4 w-4" /><LocalizedText text={" Llamadas: "} />{contact.dnd.calls ? 'No' : 'Activo'}
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 text-xs font-semibold text-slate-600">
                  <Globe className="h-4 w-4 text-slate-400" /><LocalizedText text={" Idioma: "} />{contact.preferredLanguage.toUpperCase()}
                </div>
              </div>
            </div>
            <hr className="border-slate-100" />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2"><LocalizedText text={"Etiquetas (Tags)"} /></p>
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((t) => (
                  <span key={t.id} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                    <Tag className="h-3 w-3 text-blue-500" /> {t.name}
                  </span>
                ))}
              </div>
            </div>
            <hr className="border-slate-100" />
            <div className="space-y-2.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400"><LocalizedText text={"Campos Personalizados"} /></p>
              <div className="space-y-2 text-xs">
                <div className="flex flex-wrap justify-between gap-x-3 py-1 border-b border-slate-50">
                  <span className="text-slate-400"><LocalizedText text={"Origen"} /></span>
                  <span className="font-bold text-slate-800">{contact.source || 'Referido'}</span>
                </div>
                <div className="flex flex-wrap justify-between gap-x-3 py-1 border-b border-slate-50">
                  <span className="text-slate-400"><LocalizedText text={"País de Residencia"} /></span>
                  <span className="font-bold text-slate-800">{contact.country || 'No especificado'}</span>
                </div>
                <div className="flex justify-between gap-3 py-1 border-b border-slate-50">
                  <span className="text-slate-400"><LocalizedText text={"Protección comercial"} /></span>
                  <span className="text-right font-bold text-slate-700">{leadReports.some((r) => r.status === 'protected') ? 'Activa por desarrollo' : leadReports.some((r) => r.status === 'pending') ? <LocalizedText text={"En validación"} /> : <LocalizedText text={"Sin reportar"} />}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA 2: TIMELINE */}
        <div className="space-y-5 lg:col-span-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button type="button" onClick={() => setActivityType(activityType === 'call' ? null : 'call')}
                className={cn('flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition', activityType === 'call' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100')}>
                <Phone className="h-3.5 w-3.5" /><LocalizedText text={" + Llamada"} /></button>
              <button type="button" onClick={() => setActivityType(activityType === 'whatsapp' ? null : 'whatsapp')}
                className={cn('flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition', activityType === 'whatsapp' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}>
                <MessageSquare className="h-3.5 w-3.5" /><LocalizedText text={" + WhatsApp"} /></button>
              <button type="button" onClick={() => setActivityType(activityType === 'meeting' ? null : 'meeting')}
                className={cn('flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition', activityType === 'meeting' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100')}>
                <Calendar className="h-3.5 w-3.5" /><LocalizedText text={" + Reunión"} /></button>
              <button type="button" onClick={() => setActivityType(activityType === 'task' ? null : 'task')}
                className={cn('flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition', activityType === 'task' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100')}>
                <Clock className="h-3.5 w-3.5" /><LocalizedText text={" + Tarea"} /></button>
            </div>
            {activityType && (
              <form onSubmit={handleAddActivity} className="mt-4 border-t border-slate-100 pt-4 space-y-3">
                <p className="text-xs font-extrabold text-slate-800"><LocalizedText text={"Registrar "} />{activityType === 'call' ? 'Llamada' : activityType === 'whatsapp' ? 'Mensaje WhatsApp' : activityType === 'meeting' ? <LocalizedText text={"Reunión"} /> : 'Tarea'}
                </p>
                <UITranslationBoundary attributes={["placeholder"]}><input required value={activitySubject} onChange={(e) => setActivitySubject(e.target.value)} placeholder="Asunto o motivo" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-blue-400 focus:bg-white" /></UITranslationBoundary>
                <UITranslationBoundary attributes={["placeholder"]}><textarea rows={2} value={activityDetails} onChange={(e) => setActivityDetails(e.target.value)} placeholder="Detalles..." className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none focus:border-blue-400 focus:bg-white" /></UITranslationBoundary>
                {activityType === 'task' && <input type="datetime-local" value={activityDueAt} onChange={(e) => setActivityDueAt(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none" />}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setActivityType(null)} className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100"><LocalizedText text={"Cancelar"} /></button>
                  <button type="submit" disabled={isSubmittingActivity} className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700">{isSubmittingActivity ? 'Guardando...' : <LocalizedText text={"Guardar actividad"} />}</button>
                </div>
              </form>
            )}
            <form onSubmit={handleAddNote} className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
              <UITranslationBoundary attributes={["placeholder"]}><input value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Escribe una nota rápida sobre este contacto..." className="h-10 min-w-0 w-full flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-blue-400 focus:bg-white" /></UITranslationBoundary>
              <button type="submit" disabled={isAddingNote || !noteBody.trim()} className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">
                <Send className="h-3.5 w-3.5" /><LocalizedText text={" Nota"} /></button>
            </form>
          </div>

          {/* Timeline Feed */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="min-w-0 border-b border-slate-100 pb-3">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-800"><LocalizedText text={"Timeline Omnicanal"} /></p>
              <div className="flex max-w-full items-center gap-1 overflow-x-auto text-[11px] font-bold [scrollbar-width:thin]">
                {[
                  { key: 'all' as const, label: `Todo (${timelineItems.length})` },
                  { key: 'notes' as const, label: 'Notas' },
                  { key: 'activities' as const, label: 'Llamadas/WhatsApp' },
                  { key: 'tasks' as const, label: 'Tareas' },
                ].map((tab) => (
                  <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={cn('shrink-0 whitespace-nowrap px-2.5 py-1 rounded-lg transition', activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100')}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            {filteredTimeline.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Clock className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="font-bold text-slate-600 text-xs"><LocalizedText text={"Sin actividades registradas"} /></p>
                <p className="text-[11px] text-slate-400 mt-0.5"><LocalizedText text={"Usa los botones superiores para registrar llamadas, notas o tareas."} /></p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTimeline.map((item) => {
                  const isNote = item.type === 'note';
                  const isTask = item.type === 'task';
                  const isCall = item.type === 'call';
                  const isWhatsapp = item.type === 'whatsapp';
                  return (
                  <div key={item.id} className="flex min-w-0 gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:bg-slate-50">
                      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm', isNote ? 'bg-blue-600' : isTask ? 'bg-amber-600' : isCall ? 'bg-purple-600' : isWhatsapp ? 'bg-emerald-600' : 'bg-slate-600')}>
                        {isNote ? <FileText className="h-4 w-4" /> : isTask ? <Clock className="h-4 w-4" /> : isCall ? <Phone className="h-4 w-4" /> : isWhatsapp ? <MessageSquare className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-bold text-slate-900 text-xs">{item.title}</p>
                          <span className="text-[10px] text-slate-400">{formatPortalTime(item.date)} · {formatPortalDate(item.date)}</span>
                        </div>
                        {item.body && <p className="mt-1 text-xs text-slate-600 leading-relaxed whitespace-pre-line">{item.body}</p>}
                        {isTask && 'dueAt' in item && item.dueAt && (
                          <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-amber-700">
                            <Calendar className="h-3.5 w-3.5" /><LocalizedText text={" Vence: "} />{formatPortalDateTime(item.dueAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA 3: PIPELINE, PROYECTOS, UNIDADES, TAREAS */}
        <div className="space-y-5 lg:col-span-3">
          {/* Pipeline */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400"><LocalizedText text={"Etapa del Embudo (Pipeline)"} /></p>
            {primaryOpp ? (
              <div className="space-y-1.5">
                <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-[10px] font-bold tracking-wide text-slate-500">{primaryOpp.publicCode}</p>
                {[
                  { key: 'new', label: '1. Nuevo Lead' },
                  { key: 'contacted', label: '2. Contactado' },
                  { key: 'qualified', label: '3. Calificado' },
                  { key: 'proposal', label: '4. Propuesta Enviada' },
                  { key: 'negotiation', label: '5. En Negociación' },
                  { key: 'won', label: '6. Cierre Ganado' },
                ].map((s) => {
                  const isCurrent = primaryOpp.stage === s.key;
                  return (
                    <button key={s.key} type="button" onClick={() => handleStageChange(s.key)}
                      className={cn('flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition text-left', isCurrent ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-50 text-slate-700 hover:bg-slate-100')}>
                      <span>{s.label}</span>
                      {isCurrent && <CheckCircle2 className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-400 mb-3"><LocalizedText text={"Sin negociación activa"} /></p>
                <button type="button" onClick={() => setShowNewOppModal(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
                  <Plus className="h-3.5 w-3.5" /><LocalizedText text={" Crear Negociación"} /></button>
              </div>
            )}
          </div>

          {/* Projects & Units */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400"><LocalizedText text={"Proyectos de Interés"} /></p>
            </div>

            {primaryOpp?.projects && primaryOpp.projects.length > 0 ? (
              primaryOpp.projects.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                  <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-blue-600" /> {p.name}
                  </p>

                  {/* Units linked to this project */}
                  {primaryOpp.units.length > 0 && (
                    <div className="space-y-1">
                      {primaryOpp.units.map((u) => (
                        <div key={u.id} className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-xs border border-slate-100">
                          <div>
                            <span className="font-bold text-slate-800">{u.unitNumber}</span>
                            <span className="text-slate-400 ml-2">{formatCurrency(u.price, primaryOpp.currency)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {canRequestReservation && (
                              <button type="button" onClick={() => setReservationModal({ oppId: primaryOpp.id, unitId: u.id, unitCode: u.unitNumber, price: u.price, currency: primaryOpp.currency })}
                                className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 hover:bg-amber-100">
                                <BookmarkPlus className="h-3 w-3 inline mr-0.5" /><LocalizedText text={" Reservar"} /></button>
                            )}
                            <button type="button" onClick={() => handleRemoveUnit(primaryOpp.id, u.id)} disabled={isPending}
                              className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => handleOpenUnitSelector(primaryOpp.id, p.id, p.name)}
                      className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline">
                      <Plus className="h-3 w-3" /><LocalizedText text={" Seleccionar unidad"} /></button>
                    <Link href={`/portal/projects/${p.slug}`} className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:underline ml-auto"><LocalizedText text={"Ver proyecto "} /><ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400"><LocalizedText text={"Sin proyectos vinculados."} /></p>
            )}

            {/* Add project dropdown */}
            {primaryOpp && unlinkedProjects.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <select
                  onChange={(e) => { if (e.target.value) handleAddProject(primaryOpp.id, Number(e.target.value)); e.target.value = ''; }}
                  className="h-9 w-full rounded-lg border border-dashed border-slate-300 bg-white px-3 text-xs text-slate-600 outline-none"
                  defaultValue=""
                >
                  <option value="" disabled><LocalizedText text={"+ Vincular proyecto..."} /></option>
                  {unlinkedProjects.map((p) => <option key={p.id} value={p.id}>{p.developerName} — {p.name}</option>)}
                </select>
              </div>
            )}

            {primaryOpp?.budgetMax && (
              <div className="rounded-xl bg-blue-50 p-3 text-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block"><LocalizedText text={"Presupuesto Declarado"} /></span>
                <span className="text-sm font-extrabold text-slate-900 mt-1 block">{formatCurrency(primaryOpp.budgetMax, primaryOpp.currency)}</span>
              </div>
            )}
          </div>

          {/* Pending Tasks */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400"><LocalizedText text={"Tareas Pendientes ("} />{pendingTasks.length})</p>
            {pendingTasks.length === 0 ? (
              <p className="text-xs text-slate-400"><LocalizedText text={"No hay tareas pendientes para este contacto."} /></p>
            ) : (
              <div className="space-y-2">
                {pendingTasks.map((t) => (
                  <div key={t.id} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                    <button type="button" onClick={() => handleToggleTask(t.id, false)} className="mt-0.5 text-slate-400 hover:text-emerald-600">
                      <Circle className="h-4 w-4" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900">{t.subject}</p>
                      {t.dueAt && <p className="text-[10px] font-semibold text-amber-600 mt-0.5"><LocalizedText text={" Vence: "} />{formatPortalDate(t.dueAt)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ClientDocumentsPanel contactId={contact.id} documents={clientDocuments} />
      <ReservationPaymentPanel contactId={contact.id} reservations={reservationPayments} />

      {/* New Opportunity Modal */}
      {showNewOppModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700"><LocalizedText text={" Nueva Negociación"} /></p>
                <h2 className="mt-1 text-lg font-extrabold text-slate-950"><LocalizedText text={"Abrir negociación para "} />{contact.fullName}</h2>
              </div>
              <button type="button" onClick={() => setShowNewOppModal(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <label className="block text-xs font-bold text-slate-700"><LocalizedText text={"Proyecto inicial (opcional)"} /><select value={newOppProjectId} onChange={(e) => setNewOppProjectId(e.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500">
                  <option value=""><LocalizedText text={"Sin proyecto específico"} /></option>
                  {accessibleProjects.map((p) => <option key={p.id} value={p.id}>{p.developerName} — {p.name}</option>)}
                </select>
              </label>
              <p className="text-xs text-slate-500"><LocalizedText text={"Se creará una nueva oportunidad en etapa &quot;Nuevo Lead&quot;. Podrás agregar proyectos y unidades después."} /></p>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
              <button type="button" onClick={() => setShowNewOppModal(false)} className="h-10 rounded-lg px-4 text-xs font-bold text-slate-600 hover:bg-slate-100"><LocalizedText text={"Cancelar"} /></button>
              <button type="button" onClick={handleCreateOpportunity} disabled={isPending}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                <Plus className="h-3.5 w-3.5" /> {isPending ? 'Creando...' : <LocalizedText text={" Crear Negociación"} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unit Selector Modal */}
      {selectingUnitsForProject && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700"><LocalizedText text={"Seleccionar Unidad"} /></p>
                <h2 className="mt-1 text-base font-extrabold text-slate-950">{selectingUnitsForProject.projectName}</h2>
              </div>
              <button type="button" onClick={() => setSelectingUnitsForProject(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 max-h-80 overflow-y-auto">
              {loadingUnits ? (
                <p className="text-xs text-slate-400 text-center py-8"><LocalizedText text={"Cargando unidades disponibles..."} /></p>
              ) : availableUnits.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8"><LocalizedText text={"No hay unidades disponibles en este proyecto."} /></p>
              ) : (
                <div className="space-y-1.5">
                  {availableUnits.map((u) => (
                    <button key={u.id} type="button" onClick={() => handleAddUnit(selectingUnitsForProject.oppId, u.id)} disabled={isPending}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition disabled:opacity-50">
                      <div>
                        <span className="font-bold text-slate-900">{u.unitNumber}</span>
                        {u.typology && <span className="text-slate-400 ml-2">{u.typology}</span>}
                      </div>
                      <span className="font-extrabold text-blue-700">{formatCurrency(u.price, u.currency)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reservation Request Modal */}
      {reservationModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700"><LocalizedText text={"Solicitar Reserva"} /></p>
                <h2 className="mt-1 text-base font-extrabold text-slate-950"><LocalizedText text={"Unidad "} />{reservationModal.unitCode}</h2>
              </div>
              <button type="button" onClick={() => { setReservationModal(null); setReservationNotes(''); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-xs font-bold text-amber-800"><LocalizedText text={"Resumen de la reserva"} /></p>
                <div className="mt-2 space-y-1 text-xs text-amber-700">
                  <p><LocalizedText text={"Cliente: "} /><strong>{contact.fullName}</strong></p>
                  <p><LocalizedText text={"Unidad: "} /><strong>{reservationModal.unitCode}</strong></p>
                  <p><LocalizedText text={"Precio: "} /><strong>{formatCurrency(reservationModal.price, reservationModal.currency)}</strong></p>
                </div>
              </div>
              <label className="block text-xs font-bold text-slate-700"><LocalizedText text={"Notas adicionales (opcional)"} /><UITranslationBoundary attributes={["placeholder"]}><textarea value={reservationNotes} onChange={(e) => setReservationNotes(e.target.value)} rows={3} placeholder="Condiciones especiales, plan de pago preferido, etc."
                  className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-amber-500" /></UITranslationBoundary>
              </label>
              <p className="text-[11px] text-slate-500"><LocalizedText text={"Al enviar, un administrador o el desarrollador revisará el bloqueo. La negociación continuará abierta hasta confirmar contrato y pago inicial."} /></p>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
              <button type="button" onClick={() => { setReservationModal(null); setReservationNotes(''); }} className="h-10 rounded-lg px-4 text-xs font-bold text-slate-600 hover:bg-slate-100"><LocalizedText text={"Cancelar"} /></button>
              <button type="button" onClick={handleRequestReservation} disabled={isPending}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-600 px-4 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50">
                <BookmarkPlus className="h-3.5 w-3.5" /> {isPending ? 'Enviando...' : <LocalizedText text={"Solicitar Reserva"} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-950 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in fade-in">
          {notice}
        </div>
      )}
    </div>
  );
}
