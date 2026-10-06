'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { Check, CircleDollarSign, ExternalLink, FileCheck2, Search } from 'lucide-react';
import { confirmSaleFromReservationAction, getReservationReviewFileUrlAction, reviewReservationPaymentAction, reviewReservationRequestAction } from '@/app/portal/admin/reservations/actions';
import { formatCurrency, formatPortalDateTime } from '@/lib/utils';
import { useLocale } from '@/components/i18n/LocaleProvider';

type EvidenceItem = { id: number; label: string; kind: 'client_document' | 'payment'; pending?: boolean };
type ReservationRow = {
  id: number; status: string; notes: string | null; createdAt: string; agencyName: string; agentName: string;
  unitCode: string; projectName: string; projectId: number; price: number; currency: string; contactId: number;
  opportunityCode: string;
  contact: { first_name: string; last_name: string | null; email: string | null; public_code?: string } | null;
  reservation: { id: number; reservation_type: string; status: string; expires_at: string | null } | null;
  sale: { id: number; closed_at: string } | null;
  documents: { id: number; public_code?: string; title: string }[];
  payments: { id: number; amount: number; currency: string; status: string; payment_stage?: string }[];
};

export default function ReservationReviewPanel({ rows }: { rows: ReservationRow[] }) {
  const { t } = useLocale();
  const [tab, setTab] = useState<'reservations' | 'sales'>('reservations');
  const [projectId, setProjectId] = useState('all');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [reasonId, setReasonId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [pending, startTransition] = useTransition();

  const paymentLabel: Record<string, string> = {
    reservation: t('reservationsTab'),
    initial: 'Inicial',
    construction: 'Construcción',
    delivery: 'Entrega',
  };

  const projects = useMemo(() => Array.from(new Map(rows.map((row) => [row.projectId, row.projectName])).entries()), [rows]);
  const reservationRows = rows.filter((row) => !row.sale && row.reservation?.reservation_type !== 'payment_confirmed');
  const salesRows = rows.filter((row) => row.sale || row.reservation?.reservation_type === 'payment_confirmed');
  const source = tab === 'reservations' ? reservationRows : salesRows;
  const visible = source.filter((row) => {
    const text = `${row.projectName} ${row.unitCode} ${row.contact?.first_name || ''} ${row.contact?.last_name || ''} ${row.agentName} ${row.agencyName}`.toLowerCase();
    return (projectId === 'all' || row.projectId === Number(projectId)) && text.includes(query.toLowerCase());
  });
  const pendingReservations = reservationRows.filter((row) => row.status === 'pending').length;
  const pendingPayments = rows.flatMap((row) => row.payments).filter((payment) => payment.status === 'pending').length;

  const reviewRequest = (id: number, decision: 'approve' | 'reject', note = '') => startTransition(async () => {
    const result = await reviewReservationRequestAction(id, decision, note);
    setMessage(result.error || (decision === 'approve' ? t('requestApproved') : t('requestRejected')));
    if (!result.error) setReasonId(null);
  });
  const reviewPayment = (id: number, decision: 'approve' | 'reject') => startTransition(async () => {
    const result = await reviewReservationPaymentAction(id, decision);
    setMessage(result.error || (decision === 'approve' ? t('paymentVerified') : t('paymentRejected')));
  });
  const closeSale = (reservationId: number) => startTransition(async () => {
    const result = await confirmSaleFromReservationAction(reservationId);
    setMessage(result.error || t('saleConfirmed'));
  });
  const openFile = (kind: EvidenceItem['kind'], id: number) => startTransition(async () => {
    const result = await getReservationReviewFileUrlAction(kind, id);
    if (result.url) window.open(result.url, '_blank', 'noopener,noreferrer'); else setMessage(result.error || t('unableToOpenFile'));
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-blue-700">{t('operationalControl')}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">{t('reservationsAndSales')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('reservationsSubtitle')}</p>
        </div>
        <div className="inline-flex rounded-lg bg-slate-100 p-1">
          <TabButton active={tab === 'reservations'} onClick={() => setTab('reservations')}>{t('reservationsTab')}</TabButton>
          <TabButton active={tab === 'sales'} onClick={() => setTab('sales')}>{t('salesTab')}</TabButton>
        </div>
      </header>

      {message && <p className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{message}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label={t('pendingReservations')} value={pendingReservations} icon={<FileCheck2 className="h-5 w-5 text-amber-600" />} />
        <Metric label={t('paymentsToVerify')} value={pendingPayments} icon={<CircleDollarSign className="h-5 w-5 text-blue-600" />} />
        <Metric label={t('activeSales')} value={salesRows.length} icon={<Check className="h-5 w-5 text-emerald-600" />} />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('searchReservationPlaceholder')}
              className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs"
            />
          </label>
          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs"
          >
            <option value="all">{t('allAuthorizedProjects')}</option>
            {projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1060px] w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{t('colProjectUnit')}</th>
                <th className="px-4 py-3">{t('colClient')}</th>
                <th className="px-4 py-3">{t('colAgentAgency')}</th>
                <th className="px-4 py-3">{t('colValue')}</th>
                <th className="px-4 py-3">{t('colStatus')}</th>
                <th className="px-4 py-3 text-right">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((row) => (
                <OperationRow
                  key={row.id}
                  row={row}
                  open={openId === row.id}
                  onOpen={() => setOpenId(openId === row.id ? null : row.id)}
                />
              ))}
              {!visible.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                    {t('noOperations')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {visible.map((row) => openId === row.id && (
        <section key={`detail-${row.id}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-blue-700">{t('dealFile')}</p>
              <h2 className="mt-1 text-lg font-extrabold text-slate-950">{row.projectName} · {row.unitCode}</h2>
              <p className="mt-1 font-mono text-[11px] font-bold tracking-wide text-slate-500">{row.opportunityCode}</p>
              <p className="mt-1 text-xs text-slate-500">{t('requestedBy')} {formatPortalDateTime(row.createdAt)}<LocalizedText text={" por "} />{row.agentName}.</p>
            </div>
            {row.status === 'pending' && (
              <div className="flex gap-2">
                <button disabled={pending} onClick={() => reviewRequest(row.id, 'approve')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white">
                  {t('approveReservation')}
                </button>
                <button disabled={pending} onClick={() => setReasonId(row.id)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-extrabold text-rose-700">
                  {t('reject')}
                </button>
              </div>
            )}
          </div>

          {reasonId === row.id && (
            <div className="mt-4 flex gap-2">
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t('rejectReason')}
                className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-xs"
              />
              <button disabled={pending || !reason.trim()} onClick={() => reviewRequest(row.id, 'reject', reason)} className="rounded-lg bg-rose-600 px-3 text-xs font-extrabold text-white">
                {t('confirm')}
              </button>
            </div>
          )}

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <Evidence
              title={t('clientDocuments')}
              empty={t('noDocuments')}
              items={row.documents.map((item) => ({ id: item.id, label: `${item.title} · ${item.public_code || `DOC-${item.id}`}`, kind: 'client_document' as const }))}
              onOpen={openFile}
            />
            <Evidence
              title={t('reportedPayments')}
              empty={t('noPayments')}
              items={row.payments.map((payment) => ({ id: payment.id, label: `${paymentLabel[payment.payment_stage || 'reservation'] || payment.payment_stage} · ${formatCurrency(payment.amount, payment.currency)} · ${payment.status}`, kind: 'payment' as const, pending: payment.status === 'pending' }))}
              onOpen={openFile}
              onApprove={(id) => reviewPayment(id, 'approve')}
              onReject={(id) => reviewPayment(id, 'reject')}
              pending={pending}
            />
          </div>

          {row.reservation?.reservation_type === 'payment_confirmed' && !row.sale && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-600">{t('closeRequirement')}</p>
              <button disabled={pending} onClick={() => closeSale(row.reservation!.id)} className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50">
                {t('confirmSaleAndCommission')}
              </button>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-md px-4 py-2 text-xs font-extrabold ${active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
      {children}
    </button>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      {icon}
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function OperationRow({ row, open, onOpen }: { row: ReservationRow; open: boolean; onOpen: () => void }) {
  const { t } = useLocale();
  const client = row.contact ? `${row.contact.first_name} ${row.contact.last_name || ''}`.trim() : t('noClient');
  const state = row.sale
    ? t('closedSale')
    : row.reservation?.reservation_type === 'payment_confirmed'
    ? t('confirmedReservation')
    : row.status === 'pending'
    ? t('pendingStatus')
    : t('inReservation');

  return (
    <tr className="text-xs hover:bg-slate-50">
      <td className="px-4 py-4">
        <p className="font-extrabold text-slate-900">{row.projectName}</p>
        <p className="mt-1 font-mono text-slate-500">{row.unitCode}</p>
      </td>
      <td className="px-4 py-4">
        <p className="font-bold text-slate-900">{client}</p>
        <p className="mt-1 text-slate-500">{row.contact?.email || t('noEmail')}</p>
        <p className="mt-1 font-mono text-[10px] font-bold tracking-wide text-slate-400">{row.contact?.public_code || `CLI-${row.contactId}`}</p>
      </td>
      <td className="px-4 py-4">
        <p className="font-bold text-slate-800">{row.agentName}</p>
        <p className="mt-1 text-slate-500">{row.agencyName}</p>
      </td>
      <td className="px-4 py-4 font-extrabold text-slate-900">{formatCurrency(row.price, row.currency)}</td>
      <td className="px-4 py-4">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-extrabold text-slate-700">{state}</span>
      </td>
      <td className="px-4 py-4">
        <div className="flex justify-end gap-2">
          <Link href={`/portal/clientes/${row.contact?.public_code || row.contactId}`} className="inline-flex h-8 items-center rounded-md border border-slate-200 px-3 text-[10px] font-extrabold text-slate-700">
            {t('deal')}
          </Link>
          <button type="button" onClick={onOpen} className="inline-flex h-8 items-center rounded-md bg-slate-950 px-3 text-[10px] font-extrabold text-white">
            {open ? t('hide') : t('file')}
          </button>
        </div>
      </td>
    </tr>
  );
}

function Evidence({
  title,
  empty,
  items,
  onOpen,
  onApprove,
  onReject,
  pending = false,
}: {
  title: string;
  empty: string;
  items: EvidenceItem[];
  onOpen: (kind: EvidenceItem['kind'], id: number) => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  pending?: boolean;
}) {
  const { t } = useLocale();
  return (
    <div>
      <h3 className="text-xs font-extrabold text-slate-900">{title}</h3>
      {items.length ? (
        <div className="mt-2 space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-3">
              <span className="truncate text-xs text-slate-700">{item.label}</span>
              <div className="flex gap-1">
                <UITranslationBoundary attributes={["title"]}><button title="Abrir archivo" onClick={() => onOpen(item.kind, item.id)} className="rounded p-1.5 text-slate-500 hover:bg-white">
                  <ExternalLink className="h-3.5 w-3.5" />
                </button></UITranslationBoundary>
                {item.pending && onApprove && (
                  <button disabled={pending} onClick={() => onApprove(item.id)} className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white">
                    {t('verify')}
                  </button>
                )}
                {item.pending && onReject && (
                  <button disabled={pending} onClick={() => onReject(item.id)} className="rounded border border-rose-200 px-2 py-1 text-[10px] font-bold text-rose-700">
                    {t('reject')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500">{empty}</p>
      )}
    </div>
  );
}
