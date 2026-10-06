'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { formatPortalDate } from '@/lib/utils';
import { requestConfirmation } from '@/components/feedback/AppNotifications';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Paperclip,
  ShieldCheck,
  Upload,
  Edit3,
  Archive,
  History,
  Copy,
  Check,
  Globe,
  X,
  FileVideo,
  FileImage,
  FolderOpen,
  ExternalLink,
} from 'lucide-react';
import type { PortalProject, PortalProjectDocument } from '@/lib/portal-projects';
import {
  getSignedProjectDocumentUrlAction,
  uploadProjectDocumentAction,
  updateProjectDocumentAction,
  deleteProjectDocumentAction,
  getDocumentVersionsAction,
  type DocumentVersionItem,
  type DocumentCategory,
  type DocumentVisibility,
  type DocumentStatus,
} from '@/app/portal/projects/document-actions';
import { cn } from '@/lib/utils';

export default function ProjectDocumentsPanel({
  project,
  brandName,
  canManage = false,
}: {
  project: PortalProject;
  brandName: string;
  canManage?: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingDoc, setEditingDoc] = useState<PortalProjectDocument | null>(null);
  const [activeVersionDocId, setActiveVersionDocId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'Comercial', label: 'Comercial' },
    { id: 'Técnico', label: 'Técnico' },
    { id: 'Legal', label: 'Legal' },
    { id: 'Bancario', label: 'Bancario' },
  ];

  const filteredDocs = project.documents.filter((doc) => {
    if (selectedCategory === 'all') return true;
    return doc.category === selectedCategory;
  });

  return (
    <div className={cn('grid gap-6', canManage && 'lg:grid-cols-[1fr_1.5fr]')}>
      {canManage && (
        <UploadProjectDocumentForm projectId={project.id} projectSlug={project.slug} />
      )}

      <section className="space-y-4">
        {project.digitalFolderUrl && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950"><LocalizedText text={"Carpeta Digital Completa (Google Drive / Nube)"} /></h3>
                <p className="mt-0.5 text-xs text-emerald-800"><LocalizedText text={"Accede a la carpeta con el material comercial original, renders en alta resolución, brochures en PDF y listas de precios."} /></p>
              </div>
            </div>
            <a
              href={project.digitalFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span><LocalizedText text={"Abrir Carpeta Digital"} /></span>
            </a>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-950"><LocalizedText text={"Centro documental"} /></h2>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">
                  {project.documents.length}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Recursos oficiales, versionados e inmutables controlados por "} />{brandName}.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-0">
              {categories.map((cat) => {
                const count =
                  cat.id === 'all'
                    ? project.documents.length
                    : project.documents.filter((d) => d.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition',
                      selectedCategory === cat.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    <span>{cat.label}</span>
                    <span className="opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-slate-400">
                {selectedCategory === 'all'
                  ? <LocalizedText text={"Todavía no hay documentos registrados para este proyecto."} />
                  : `No hay documentos en la categoría "${selectedCategory}".`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredDocs.map((document) => (
                <DocumentRow
                  key={document.id}
                  document={document}
                  projectId={project.id}
                  projectSlug={project.slug}
                  canManage={canManage}
                  onEdit={() => setEditingDoc(document)}
                  onToggleVersions={() =>
                    setActiveVersionDocId(activeVersionDocId === document.id ? null : document.id)
                  }
                  isVersionsOpen={activeVersionDocId === document.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal de edición editorial */}
        {editingDoc && (
          <EditProjectDocumentModal
            document={editingDoc}
            projectId={project.id}
            projectSlug={project.slug}
            onClose={() => setEditingDoc(null)}
          />
        )}
      </section>
    </div>
  );
}

function DocumentRow({
  document,
  projectId,
  projectSlug,
  canManage,
  onEdit,
  onToggleVersions,
  isVersionsOpen,
}: {
  document: PortalProjectDocument;
  projectId: number;
  projectSlug: string;
  canManage: boolean;
  onEdit: () => void;
  onToggleVersions: () => void;
  isVersionsOpen: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  async function open() {
    if (!document.documentVersionId) {
      setError('Este documento aún no tiene un archivo cargado.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await getSignedProjectDocumentUrlAction(document.documentVersionId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.url) window.open(result.url, '_blank', 'noopener,noreferrer');
  }

  async function handleDelete() {
    if (!(await requestConfirmation(`¿Archivar "${document.name}"? El archivo y su historial quedarán conservados para auditoría.`))) {
      return;
    }
    startDeleteTransition(async () => {
      const res = await deleteProjectDocumentAction({
        documentId: Number(document.id),
        projectId,
        projectSlug,
      });
      if (res.error) {
        setError(res.error);
      }
    });
  }

  const isFormatSpreadsheet = document.format === 'XLSX' || document.format === 'XLS';
  const isFormatVideo = document.format === 'MP4';
  const isFormatImage = ['JPG', 'JPEG', 'PNG', 'WEBP'].includes(document.format);

  return (
    <div className="p-4 transition hover:bg-slate-50/50">
      <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <span
          className={cn(
            'grid h-11 w-11 place-items-center rounded-xl',
            isFormatSpreadsheet
              ? 'bg-emerald-50 text-emerald-600'
              : isFormatVideo
              ? 'bg-purple-50 text-purple-600'
              : isFormatImage
              ? 'bg-amber-50 text-amber-600'
              : 'bg-blue-50 text-blue-600'
          )}
        >
          {isFormatSpreadsheet ? (
            <FileSpreadsheet className="h-5 w-5" />
          ) : isFormatVideo ? (
            <FileVideo className="h-5 w-5" />
          ) : isFormatImage ? (
            <FileImage className="h-5 w-5" />
          ) : (
            <FileText className="h-5 w-5" />
          )}
        </span>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold text-slate-900">{document.name}</p>
            {document.visibility === 'public' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-700">
                <Globe className="h-3 w-3" /><LocalizedText text={" Landing pública"} /></span>
            )}
          </div>

          <p className="mt-1 text-[10px] text-slate-500">
            {document.category} · {document.format} ·{' '}
            {document.version ? `v${document.version}` : <LocalizedText text={"Sin versión"} />}<LocalizedText text={" · Actualizado "} />{document.updated}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <UITranslationBoundary attributes={["label"]}><DocumentBadge
              label={
                document.status === 'published'
                  ? 'Publicado'
                  : document.status === 'approved'
                  ? 'Aprobado'
                  : document.status === 'review'
                  ? 'En revisión'
                  : 'Borrador'
              }
              tone={
                document.status === 'published' || document.status === 'approved'
                  ? 'green'
                  : document.status === 'review'
                  ? 'amber'
                  : 'slate'
              }
            /></UITranslationBoundary>
            <UITranslationBoundary attributes={["label"]}><DocumentBadge
              label={
                document.visibility === 'public'
                  ? 'Público'
                  : document.visibility === 'private'
                  ? 'Privado'
                  : 'Solo autorizados'
              }
              tone={
                document.visibility === 'public'
                  ? 'indigo'
                  : document.visibility === 'private'
                  ? 'rose'
                  : 'blue'
              }
            /></UITranslationBoundary>
          </div>

          {error && <p className="mt-1.5 text-[10px] font-semibold text-red-600">{error}</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <>
              <UITranslationBoundary attributes={["title"]}><button
                type="button"
                onClick={onToggleVersions}
                title="Historial de versiones y hashes"
                className={cn(
                  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100',
                  isVersionsOpen && 'bg-slate-900 text-white hover:bg-slate-800'
                )}
              >
                <History className="h-3.5 w-3.5" />
                <span className="hidden sm:inline"><LocalizedText text={"Versiones"} /></span>
              </button></UITranslationBoundary>

              <UITranslationBoundary attributes={["title"]}><button
                type="button"
                onClick={onEdit}
                title="Editar metadatos y estado"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline"><LocalizedText text={"Editar"} /></span>
              </button></UITranslationBoundary>

              <UITranslationBoundary attributes={["title"]}><button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                title="Archivar documento y conservar su historial"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
              </button></UITranslationBoundary>
            </>
          )}

          <button
            type="button"
            onClick={open}
            disabled={loading || (!canManage && !['approved', 'published'].includes(document.status))}
            className={cn(
              'inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-[10px] font-bold transition',
              ['approved', 'published'].includes(document.status)
                ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                : 'border-slate-200 text-slate-500 bg-slate-50',
              loading && 'opacity-60'
            )}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {['approved', 'published'].includes(document.status)
              ? <LocalizedText text={"Ver / descargar"} />
              : canManage
              ? 'Previsualizar'
              : <LocalizedText text={"Pendiente de aprobación"} />}
          </button>
        </div>
      </div>

      {/* Version History Drawer */}
      {isVersionsOpen && (
        <DocumentVersionsDrawer key={document.id} documentId={Number(document.id)} />
      )}
    </div>
  );
}

function DocumentVersionsDrawer({ documentId }: { documentId: number }) {
  const [versions, setVersions] = useState<DocumentVersionItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getDocumentVersionsAction(documentId).then((res) => {
      if (!active) return;
      setLoading(false);
      if (res.error) setError(res.error);
      else setVersions(res.versions || []);
    });
    return () => {
      active = false;
    };
  }, [documentId]);

  function copyHash(hash: string) {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  }

  function formatBytes(bytes: number | null) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700"><LocalizedText text={"Historial inmutable de versiones (SHA-256)"} /></p>
        <span className="text-[10px] text-slate-400">
          {versions ? `${versions.length} versión(es)` : <LocalizedText text={"Cargando..."} />}
        </span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
          <span><LocalizedText text={"Consultando registros de auditoría..."} /></span>
        </div>
      )}

      {error && <p className="py-2 text-[10px] font-semibold text-red-600">{error}</p>}

      {versions && versions.length === 0 && (
        <p className="py-2 text-xs text-slate-400"><LocalizedText text={"No hay versiones registradas."} /></p>
      )}

      {versions && versions.length > 0 && (
        <div className="mt-2 divide-y divide-slate-200">
          {versions.map((v) => (
            <div key={v.id} className="py-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-extrabold text-slate-900"><LocalizedText text={"Versión "} />{v.versionNumber}</span>
                <span className="text-[10px] text-slate-500">
                  {v.publishedAt
                    ? `Publicado: ${formatPortalDate(v.publishedAt)}`
                    : 'No publicado'} · {formatBytes(v.sizeBytes)} · {v.mimeType}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                <span className="font-mono text-slate-600"><LocalizedText text={"SHA-256: "} />{v.checksumSha256 ? `${v.checksumSha256.substring(0, 16)}...` : <LocalizedText text={"Sin hash"} />}
                </span>
                {v.checksumSha256 && (
                  <button
                    type="button"
                    onClick={() => copyHash(v.checksumSha256!)}
                    className="inline-flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-700 shadow-sm hover:bg-slate-100"
                  >
                    {copiedHash === v.checksumSha256 ? (
                      <>
                        <Check className="h-2.5 w-2.5 text-green-600" /><LocalizedText text={" Copiado"} /></>
                    ) : (
                      <>
                        <Copy className="h-2.5 w-2.5" /><LocalizedText text={" Copiar hash"} /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'green' | 'blue' | 'amber' | 'slate' | 'indigo' | 'rose';
}) {
  const tones = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-600',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
  };
  return <span className={cn('rounded-full border px-2 py-0.5 text-[9px] font-bold', tones[tone])}>{label}</span>;
}

type ActionState = { success?: boolean; error?: string };

function UploadProjectDocumentForm({
  projectId,
  projectSlug,
}: {
  projectId: number;
  projectSlug: string;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    uploadProjectDocumentAction,
    {}
  );
  const [visibility, setVisibility] = useState<DocumentVisibility>('authorized');
  const [status, setStatus] = useState<DocumentStatus>('review');
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Subir documento oficial"} /></h3>
      </div>
      <p className="text-[11px] leading-5 text-slate-500"><LocalizedText text={"Cada carga calcula automáticamente su checksum SHA-256 e incrementa la versión inmutable."} /></p>

      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="projectSlug" value={projectSlug} />

      <div>
        <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Título comercial"} /></label>
        <UITranslationBoundary attributes={["placeholder"]}><input
          name="title"
          required
          placeholder="Ej. Brochure Comercial Cana Rock Star (ES)"
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
        /></UITranslationBoundary>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Categoría"} /></label>
        <select
          name="category"
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
        >
          <option value="commercial"><LocalizedText text={"Comercial"} /></option>
          <option value="technical"><LocalizedText text={"Técnico"} /></option>
          <option value="legal"><LocalizedText text={"Legal"} /></option>
          <option value="banking"><LocalizedText text={"Bancario"} /></option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Visibilidad"} /></label>
          <select
            name="visibility"
            value={visibility}
            onChange={(e) => {
              const val = e.target.value as DocumentVisibility;
              setVisibility(val);
              if (val === 'public') setStatus('published');
            }}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
          >
            <option value="authorized"><LocalizedText text={"Solo autorizados (Brokers)"} /></option>
            <option value="private"><LocalizedText text={"Privado (Solo admin)"} /></option>
            <option value="public"><LocalizedText text={"Público (Landing abierta)"} /></option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Estado editorial"} /></label>
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as DocumentStatus)}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
          >
            <option value="draft"><LocalizedText text={"Borrador"} /></option>
            <option value="review"><LocalizedText text={"En revisión"} /></option>
            <option value="approved"><LocalizedText text={"Aprobado"} /></option>
            <option value="published"><LocalizedText text={"Publicado"} /></option>
          </select>
        </div>
      </div>

      {visibility === 'public' && status !== 'published' && (
        <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] font-medium text-amber-800"><LocalizedText text={"Atención: un documento con visibilidad pública requiere estado &quot;Publicado&quot; para mostrarse en la landing."} /></p>
      )}

      <div>
        <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Archivo"} /></label>
        <input
          ref={fileRef}
          type="file"
          name="file"
          required
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.mp4"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-10 w-full items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-xs text-slate-600 hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer"
        >
          <Paperclip className="h-3.5 w-3.5 text-slate-400" />
          <span className={fileName ? 'text-slate-900 font-medium truncate' : 'text-slate-400'}>
            {fileName || 'Seleccionar archivo...'}
          </span>
        </button>
        <p className="mt-1 text-[10px] text-slate-400"><LocalizedText text={"PDF, Office, imagen JPG/PNG/WEBP o video MP4 · máximo 50 MB."} /></p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-[11px] font-semibold text-green-700"><LocalizedText text={"Documento subido y registrado con éxito."} /></p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}<LocalizedText text={"Subir documento"} /></button>
    </form>
  );
}

function EditProjectDocumentModal({
  document,
  projectId,
  projectSlug,
  onClose,
}: {
  document: PortalProjectDocument;
  projectId: number;
  projectSlug: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(document.name);
  const [category, setCategory] = useState<DocumentCategory>(
    (document.category.toLowerCase() === 'comercial'
      ? 'commercial'
      : document.category.toLowerCase() === 'técnico'
      ? 'technical'
      : document.category.toLowerCase() === 'bancario'
      ? 'banking'
      : 'legal') as DocumentCategory
  );
  const [visibility, setVisibility] = useState<DocumentVisibility>(document.visibility);
  const [status, setStatus] = useState<DocumentStatus>(
    (document.status === 'approved' || document.status === 'published' || document.status === 'review'
      ? document.status
      : 'draft') as DocumentStatus
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título es requerido.');
      return;
    }
    if (visibility === 'public' && status !== 'published') {
      setError('Un recurso público debe estar en estado Publicado.');
      return;
    }

    startTransition(async () => {
      setError(null);
      const res = await updateProjectDocumentAction({
        documentId: Number(document.id),
        projectId,
        projectSlug,
        title,
        category,
        visibility,
        status,
      });

      if (res.error) {
        setError(res.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-base font-extrabold text-slate-950"><LocalizedText text={"Editar metadatos editoriales"} /></h3>
        <p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Actualiza visibilidad, categoría y estado editorial del documento."} /></p>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Título comercial"} /></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Categoría"} /></label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
            >
              <option value="commercial"><LocalizedText text={"Comercial"} /></option>
              <option value="technical"><LocalizedText text={"Técnico"} /></option>
              <option value="legal"><LocalizedText text={"Legal"} /></option>
              <option value="banking"><LocalizedText text={"Bancario"} /></option>
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Visibilidad"} /></label>
              <select
                value={visibility}
                onChange={(e) => {
                  const val = e.target.value as DocumentVisibility;
                  setVisibility(val);
                  if (val === 'public') setStatus('published');
                }}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
              >
                <option value="authorized"><LocalizedText text={"Solo autorizados (Brokers)"} /></option>
                <option value="private"><LocalizedText text={"Privado (Solo admin)"} /></option>
                <option value="public"><LocalizedText text={"Público (Landing)"} /></option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Estado editorial"} /></label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
              >
                <option value="draft"><LocalizedText text={"Borrador"} /></option>
                <option value="review"><LocalizedText text={"En revisión"} /></option>
                <option value="approved"><LocalizedText text={"Aprobado"} /></option>
                <option value="published"><LocalizedText text={"Publicado"} /></option>
              </select>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-[11px] font-semibold text-red-600">{error}</p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            ><LocalizedText text={"Cancelar"} /></button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}<LocalizedText text={"Guardar cambios"} /></button>
          </div>
        </form>
      </div>
    </div>
  );
}
