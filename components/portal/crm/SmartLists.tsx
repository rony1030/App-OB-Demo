'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, CheckSquare, Download, Eye, Filter, Layers, Mail, MessageSquare, Phone, Plus, Search, SlidersHorizontal, Square, Tag, UserCheck, Users, X } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import type { ContactSummary } from '@/lib/data/crm';
import { useLocale } from '@/components/i18n/LocaleProvider';
import type { Locale } from '@/lib/i18n/locale';

type SmartListsCopy = {
  defaultTabs: Record<string, string>;
  newList: string;
  searchPlaceholder: string;
  advancedFilters: string;
  selected: (count: number) => string;
  exportCsv: string;
  reassignAgent: string;
  reassign: string;
  addBulkTag: string;
  tag: string;
  newContact: string;
  filterHeading: string;
  clearFilters: string;
  saveAsSmartList: string;
  pipelineStage: string;
  allStages: string;
  tagLabel: string;
  allTags: string;
  leadSource: string;
  allSources: string;
  referred: string;
  classification: string;
  allClassifications: string;
  investor: string;
  finalBuyer: string;
  brokerPartner: string;
  minBudget: string;
  maxBudget: string;
  amountExample: string;
  contact: string;
  channels: string;
  tags: string;
  interestBudget: string;
  pipeline: string;
  actions: string;
  noContacts: string;
  noContactsHint: string;
  createFirstContact: string;
  noEmail: string;
  noProject: string;
  openBudget: string;
  contactRecord: string;
  whatsappBlocked: string;
  whatsappEnabled: string;
  emailBlocked: string;
  emailEnabled: string;
  callsBlocked: string;
  callsEnabled: string;
  saveList: string;
  saveListDescription: string;
  listName: string;
  listNamePlaceholder: string;
  cancel: string;
  savedList: (name: string) => string;
  exported: (count: number) => string;
  assigning: (count: number) => string;
  bulkTagOpened: string;
  csvHeaders: string[];
  csvFilename: string;
  stages: Record<string, string>;
  classifications: Record<string, string>;
};

const SMART_LISTS_COPY: Record<Locale, SmartListsCopy> = {
  es: {
    defaultTabs: { all: 'Todos los contactos', investors: 'Inversionistas VIP', puntacana: 'Punta Cana', whatsapp: 'WhatsApp activo', high_priority: 'Prioridad alta' },
    newList: 'Nueva lista', searchPlaceholder: 'Buscar por nombre, email, teléfono o etiqueta…', advancedFilters: 'Filtros avanzados',
    selected: (count) => `${count} ${count === 1 ? 'seleccionado' : 'seleccionados'}`, exportCsv: 'Exportar CSV', reassignAgent: 'Reasignar agente', reassign: 'Reasignar', addBulkTag: 'Añadir etiqueta en lote', tag: 'Etiquetar', newContact: 'Nuevo contacto',
    filterHeading: 'Filtros multicriterio de contactos', clearFilters: 'Limpiar filtros', saveAsSmartList: 'Guardar como lista inteligente', pipelineStage: 'Etapa del embudo', allStages: 'Todas las etapas', tagLabel: 'Etiqueta', allTags: 'Todas las etiquetas', leadSource: 'Origen del lead', allSources: 'Todos los orígenes', referred: 'Referido', classification: 'Clasificación', allClassifications: 'Todas', investor: 'Inversionista', finalBuyer: 'Comprador final', brokerPartner: 'Broker / aliado', minBudget: 'Presupuesto mínimo', maxBudget: 'Presupuesto máximo', amountExample: 'Ej. 100000',
    contact: 'Contacto', channels: 'Canales y DND', tags: 'Etiquetas', interestBudget: 'Interés y presupuesto', pipeline: 'Etapa del pipeline', actions: 'Acciones', noContacts: 'No se encontraron contactos', noContactsHint: 'Crea un nuevo lead o ajusta los criterios de búsqueda de esta lista.', createFirstContact: 'Crear primer contacto', noEmail: 'Sin correo', noProject: 'Sin proyecto', openBudget: 'Presupuesto abierto', contactRecord: 'Ficha 360',
    whatsappBlocked: 'WhatsApp bloqueado (DND)', whatsappEnabled: 'WhatsApp habilitado', emailBlocked: 'Email bloqueado (DND)', emailEnabled: 'Email habilitado', callsBlocked: 'Llamadas bloqueadas (DND)', callsEnabled: 'Llamadas habilitadas',
    saveList: 'Guardar lista inteligente', saveListDescription: 'Esta lista inteligente aparecerá fijada como pestaña superior para acceso rápido según los filtros activos.', listName: 'Nombre de la lista', listNamePlaceholder: 'Ej. Inversionistas Punta Cana calificados', cancel: 'Cancelar',
    savedList: (name) => `Lista inteligente “${name}” guardada correctamente.`, exported: (count) => `${count} ${count === 1 ? 'contacto exportado' : 'contactos exportados'} a CSV.`, assigning: (count) => `Asignando ${count} ${count === 1 ? 'contacto' : 'contactos'} a Osvaldo Bello.`, bulkTagOpened: 'Etiquetado masivo activado.',
    csvHeaders: ['Nombre', 'Email', 'Teléfono', 'Clasificación', 'Proyecto', 'Etapa', 'Presupuesto'], csvFilename: 'contactos',
    stages: { new: 'Nuevo', contacted: 'Contactado', qualified: 'Calificado', proposal: 'Propuesta', negotiation: 'Negociación', reservation: 'Reserva', won: 'Ganado', lost: 'Perdido' },
    classifications: { Inversionista: 'Inversionista', 'Comprador final': 'Comprador final', 'Broker / aliado': 'Broker / aliado' },
  },
  en: {
    defaultTabs: { all: 'All contacts', investors: 'VIP investors', puntacana: 'Punta Cana', whatsapp: 'WhatsApp active', high_priority: 'High priority' },
    newList: 'New list', searchPlaceholder: 'Search by name, email, phone, or tag…', advancedFilters: 'Advanced filters',
    selected: (count) => `${count} selected`, exportCsv: 'Export CSV', reassignAgent: 'Reassign agent', reassign: 'Reassign', addBulkTag: 'Add tag in bulk', tag: 'Add tag', newContact: 'New contact',
    filterHeading: 'Multi-criteria contact filters', clearFilters: 'Clear filters', saveAsSmartList: 'Save as smart list', pipelineStage: 'Pipeline stage', allStages: 'All stages', tagLabel: 'Tag', allTags: 'All tags', leadSource: 'Lead source', allSources: 'All sources', referred: 'Referral', classification: 'Classification', allClassifications: 'All', investor: 'Investor', finalBuyer: 'Final buyer', brokerPartner: 'Broker / partner', minBudget: 'Minimum budget', maxBudget: 'Maximum budget', amountExample: 'E.g. 100000',
    contact: 'Contact', channels: 'Channels & DND', tags: 'Tags', interestBudget: 'Interest & budget', pipeline: 'Pipeline stage', actions: 'Actions', noContacts: 'No contacts found', noContactsHint: 'Create a new lead or adjust this list’s search criteria.', createFirstContact: 'Create first contact', noEmail: 'No email', noProject: 'No project', openBudget: 'Open budget', contactRecord: '360 profile',
    whatsappBlocked: 'WhatsApp blocked (DND)', whatsappEnabled: 'WhatsApp enabled', emailBlocked: 'Email blocked (DND)', emailEnabled: 'Email enabled', callsBlocked: 'Calls blocked (DND)', callsEnabled: 'Calls enabled',
    saveList: 'Save smart list', saveListDescription: 'This smart list will be pinned as a tab for quick access using the active filters.', listName: 'List name', listNamePlaceholder: 'E.g. Qualified Punta Cana investors', cancel: 'Cancel',
    savedList: (name) => `Smart list “${name}” saved successfully.`, exported: (count) => `${count} ${count === 1 ? 'contact' : 'contacts'} exported to CSV.`, assigning: (count) => `Assigning ${count} ${count === 1 ? 'contact' : 'contacts'} to Osvaldo Bello.`, bulkTagOpened: 'Bulk tagging opened.',
    csvHeaders: ['Name', 'Email', 'Phone', 'Classification', 'Project', 'Stage', 'Budget'], csvFilename: 'contacts',
    stages: { new: 'New', contacted: 'Contacted', qualified: 'Qualified', proposal: 'Proposal', negotiation: 'Negotiation', reservation: 'Reservation', won: 'Won', lost: 'Lost' },
    classifications: { Inversionista: 'Investor', 'Comprador final': 'Final buyer', 'Broker / aliado': 'Broker / partner' },
  },
  fr: {
    defaultTabs: { all: 'Tous les contacts', investors: 'Investisseurs VIP', puntacana: 'Punta Cana', whatsapp: 'WhatsApp actif', high_priority: 'Priorité élevée' },
    newList: 'Nouvelle liste', searchPlaceholder: 'Rechercher par nom, e-mail, téléphone ou étiquette…', advancedFilters: 'Filtres avancés',
    selected: (count) => `${count} ${count === 1 ? 'sélectionné' : 'sélectionnés'}`, exportCsv: 'Exporter CSV', reassignAgent: 'Réaffecter l’agent', reassign: 'Réaffecter', addBulkTag: 'Ajouter une étiquette en masse', tag: 'Étiqueter', newContact: 'Nouveau contact',
    filterHeading: 'Filtres multicritères des contacts', clearFilters: 'Effacer les filtres', saveAsSmartList: 'Enregistrer comme liste intelligente', pipelineStage: 'Étape du pipeline', allStages: 'Toutes les étapes', tagLabel: 'Étiquette', allTags: 'Toutes les étiquettes', leadSource: 'Source du prospect', allSources: 'Toutes les sources', referred: 'Recommandation', classification: 'Classification', allClassifications: 'Toutes', investor: 'Investisseur', finalBuyer: 'Acheteur final', brokerPartner: 'Courtier / partenaire', minBudget: 'Budget minimum', maxBudget: 'Budget maximum', amountExample: 'Ex. 100000',
    contact: 'Contact', channels: 'Canaux et DND', tags: 'Étiquettes', interestBudget: 'Intérêt et budget', pipeline: 'Étape du pipeline', actions: 'Actions', noContacts: 'Aucun contact trouvé', noContactsHint: 'Créez un prospect ou ajustez les critères de recherche de cette liste.', createFirstContact: 'Créer le premier contact', noEmail: 'Sans e-mail', noProject: 'Sans projet', openBudget: 'Budget ouvert', contactRecord: 'Fiche 360',
    whatsappBlocked: 'WhatsApp bloqué (DND)', whatsappEnabled: 'WhatsApp activé', emailBlocked: 'E-mail bloqué (DND)', emailEnabled: 'E-mail activé', callsBlocked: 'Appels bloqués (DND)', callsEnabled: 'Appels activés',
    saveList: 'Enregistrer la liste intelligente', saveListDescription: 'Cette liste intelligente sera épinglée comme onglet pour un accès rapide selon les filtres actifs.', listName: 'Nom de la liste', listNamePlaceholder: 'Ex. Investisseurs qualifiés de Punta Cana', cancel: 'Annuler',
    savedList: (name) => `Liste intelligente « ${name} » enregistrée.`, exported: (count) => `${count} ${count === 1 ? 'contact exporté' : 'contacts exportés'} au format CSV.`, assigning: (count) => `Affectation de ${count} ${count === 1 ? 'contact' : 'contacts'} à Osvaldo Bello.`, bulkTagOpened: 'Étiquetage en masse activé.',
    csvHeaders: ['Nom', 'E-mail', 'Téléphone', 'Classification', 'Projet', 'Étape', 'Budget'], csvFilename: 'contacts',
    stages: { new: 'Nouveau', contacted: 'Contacté', qualified: 'Qualifié', proposal: 'Proposition', negotiation: 'Négociation', reservation: 'Réservation', won: 'Gagné', lost: 'Perdu' },
    classifications: { Inversionista: 'Investisseur', 'Comprador final': 'Acheteur final', 'Broker / aliado': 'Courtier / partenaire' },
  },
};

type SmartListTab = {
  id: string;
  label: string;
  isCustom?: boolean;
  filterFn: (contact: ContactSummary) => boolean;
};

export default function SmartLists({
  initialContacts,
}: {
  initialContacts: ContactSummary[];
}) {
  const { locale } = useLocale();
  const copy = SMART_LISTS_COPY[locale];
  const [tabs, setTabs] = useState<SmartListTab[]>([
    {
      id: 'all',
      label: 'Todos los contactos',
      filterFn: () => true,
    },
    {
      id: 'investors',
      label: 'Inversionistas VIP',
      filterFn: (c) =>
        c.classification === 'Inversionista' ||
        c.tags.some(
          (t) =>
            t.name.toLowerCase().includes('invers') ||
            t.name.toLowerCase().includes('vip')
        ),
    },
    {
      id: 'puntacana',
      label: 'Punta Cana',
      filterFn: (c) =>
        (c.primaryOpportunity?.projectName?.toLowerCase().includes('punta cana') ??
          false) ||
        c.tags.some((t) => t.name.toLowerCase().includes('punta cana')),
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Activo',
      filterFn: (c) => !c.dnd.whatsapp,
    },
    {
      id: 'high_priority',
      label: 'Prioridad Alta',
      filterFn: (c) => c.primaryOpportunity?.priority === 'high',
    },
  ]);

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [createListModalOpen, setCreateListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Advanced Filter state (GHL Advanced Filters)
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterClassification, setFilterClassification] = useState<string>('all');
  const [filterMinBudget, setFilterMinBudget] = useState<string>('');
  const [filterMaxBudget, setFilterMaxBudget] = useState<string>('');

  const [notice, setNotice] = useState('');
  const notify = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 2600);
  };

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  const filteredContacts = useMemo(() => {
    return initialContacts.filter((contact) => {
      // 1. Tab filter
      if (!currentTab.filterFn(contact)) return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = contact.fullName.toLowerCase().includes(query);
        const matchesEmail = contact.email?.toLowerCase().includes(query);
        const matchesPhone = contact.phone.includes(query);
        const matchesProject = contact.primaryOpportunity?.projectName
          ?.toLowerCase()
          .includes(query);
        const matchesTag = contact.tags.some((t) =>
          t.name.toLowerCase().includes(query)
        );
        if (
          !matchesName &&
          !matchesEmail &&
          !matchesPhone &&
          !matchesProject &&
          !matchesTag
        ) {
          return false;
        }
      }

      // 3. Stage filter
      if (
        filterStage !== 'all' &&
        contact.primaryOpportunity?.stage !== filterStage
      ) {
        return false;
      }

      // 4. Tag filter
      if (
        filterTag !== 'all' &&
        !contact.tags.some((t) => t.name === filterTag)
      ) {
        return false;
      }

      // 5. Source filter
      if (
        filterSource !== 'all' &&
        contact.source?.toLowerCase() !== filterSource.toLowerCase()
      ) {
        return false;
      }

      // 6. Classification filter
      if (
        filterClassification !== 'all' &&
        contact.classification !== filterClassification
      ) {
        return false;
      }

      // 7. Budget Min / Max
      if (
        filterMinBudget &&
        (contact.primaryOpportunity?.budgetMax || 0) < Number(filterMinBudget)
      ) {
        return false;
      }
      if (
        filterMaxBudget &&
        (contact.primaryOpportunity?.budgetMax || Infinity) > Number(filterMaxBudget)
      ) {
        return false;
      }

      return true;
    });
  }, [
    initialContacts,
    currentTab,
    searchQuery,
    filterStage,
    filterTag,
    filterSource,
    filterClassification,
    filterMinBudget,
    filterMaxBudget,
  ]);

  // Bulk selection handlers
  const allSelected =
    filteredContacts.length > 0 && selectedIds.length === filteredContacts.length;
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredContacts.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const exportSelectedCsv = () => {
    const listToExport =
      selectedIds.length > 0
        ? filteredContacts.filter((c) => selectedIds.includes(c.id))
        : filteredContacts;

    const headers = copy.csvHeaders;
    const rows = listToExport.map((c) => [
      `"${c.fullName}"`,
      `"${c.email || ''}"`,
      `"${c.phone}"`,
      `"${c.classification || ''}"`,
      `"${c.primaryOpportunity?.projectName || ''}"`,
      `"${c.primaryOpportunity?.stage || ''}"`,
      `"${c.primaryOpportunity?.budgetMax || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${copy.csvFilename}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify(copy.exported(listToExport.length));
  };

  const handleSaveAsSmartList = () => {
    if (!newListName.trim()) return;
    const newTabId = `custom_${Date.now()}`;
    const stageVal = filterStage;
    const tagVal = filterTag;

    const newTab: SmartListTab = {
      id: newTabId,
      label: newListName.trim(),
      isCustom: true,
      filterFn: (c) => {
        if (stageVal !== 'all' && c.primaryOpportunity?.stage !== stageVal) return false;
        if (tagVal !== 'all' && !c.tags.some((t) => t.name === tagVal)) return false;
        return true;
      },
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTab(newTabId);
    setNewListName('');
    setCreateListModalOpen(false);
    notify(copy.savedList(newTab.label));
  };

  const allTags = useMemo(() => {
    const set = new Set<string>();
    initialContacts.forEach((c) => c.tags.forEach((t) => set.add(t.name)));
    return Array.from(set);
  }, [initialContacts]);

  const activeFiltersCount = [
    filterStage !== 'all',
    filterTag !== 'all',
    filterSource !== 'all',
    filterClassification !== 'all',
    Boolean(filterMinBudget),
    Boolean(filterMaxBudget),
  ].filter(Boolean).length;

  const resetFilters = () => {
    setFilterStage('all');
    setFilterTag('all');
    setFilterSource('all');
    setFilterClassification('all');
    setFilterMinBudget('');
    setFilterMaxBudget('');
  };

  return (
    <div className="space-y-4">
      {/* Smart Lists Tabs (GHL Style Tab Bar) */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 pt-2 rounded-t-2xl shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-px">
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            const count = initialContacts.filter(tab.filterFn).length;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedIds([]);
                }}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition whitespace-nowrap',
                  active
                    ? 'border-blue-600 text-blue-700 bg-blue-50 rounded-t-xl shadow-xs'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900'
                )}
              >
                <span>{tab.isCustom ? tab.label : (copy.defaultTabs[tab.id] || tab.label)}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-extrabold',
                    active
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setCreateListModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition whitespace-nowrap my-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{copy.newList}</span>
          </button>
        </div>
      </div>

      {/* Main Toolbar with GHL Action Icons & Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <label className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={copy.searchPlaceholder}
              aria-label={copy.searchPlaceholder}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs outline-none transition focus:border-blue-400 focus:bg-white"
            />
          </label>

          {/* More Filters Toggle Button (GHL Style) */}
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold transition',
              activeFiltersCount > 0 || filterDrawerOpen
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>{copy.advancedFilters}</span>
            {activeFiltersCount > 0 && (
              <span className="rounded-full bg-blue-600 px-1.5 py-0.2 text-[10px] text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* GHL Bulk Action Menu */}
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 p-1.5 text-xs font-bold text-blue-700 animate-in fade-in">
              <span className="px-2 font-extrabold">{copy.selected(selectedIds.length)}</span>
              <button
                type="button"
                onClick={exportSelectedCsv}
                title={copy.exportCsv}
                className="flex items-center gap-1 rounded-lg bg-white border border-blue-200 px-2.5 py-1.5 text-blue-700 hover:bg-blue-100 shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{copy.exportCsv}</span>
              </button>
              <button
                type="button"
                onClick={() => notify(copy.assigning(selectedIds.length))}
                title={copy.reassignAgent}
                className="flex items-center gap-1 rounded-lg bg-white border border-blue-200 px-2.5 py-1.5 text-blue-700 hover:bg-blue-100 shadow-xs"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>{copy.reassign}</span>
              </button>
              <button
                type="button"
                onClick={() => notify(copy.bulkTagOpened)}
                title={copy.addBulkTag}
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-white hover:bg-blue-700 shadow-xs"
              >
                <Tag className="h-3.5 w-3.5" />
                <span>{copy.tag}</span>
              </button>
            </div>
          ) : (
            <Link
              href="/portal/leads/new"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>{copy.newContact}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel (Collapsible GHL Style) */}
      {filterDrawerOpen && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-blue-100 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-blue-600" />
              <h2 className="text-xs font-extrabold text-blue-950 uppercase tracking-wide">
                {copy.filterHeading}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  {copy.clearFilters}
                </button>
              )}
              <button
                type="button"
                onClick={() => setCreateListModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              >
                <Filter className="h-3.5 w-3.5" />
                <span>{copy.saveAsSmartList}</span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{copy.pipelineStage}</label>
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-800 outline-none"
              >
                <option value="all">{copy.allStages}</option>
                {Object.entries(copy.stages).filter(([value]) => value !== 'lost').map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{copy.tagLabel}</label>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-800 outline-none"
              >
                <option value="all">{copy.allTags}</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{copy.leadSource}</label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-800 outline-none"
              >
                <option value="all">{copy.allSources}</option>
                <option value="Referido">{copy.referred}</option>
                <option value="WhatsApp"><LocalizedText text={"WhatsApp"} /></option>
                <option value="Instagram"><LocalizedText text={"Instagram"} /></option>
                <option value="Google"><LocalizedText text={"Google Ads"} /></option>
                <option value="Portal web"><LocalizedText text={"Portal Web"} /></option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{copy.classification}</label>
              <select
                value={filterClassification}
                onChange={(e) => setFilterClassification(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-800 outline-none"
              >
                <option value="all">{copy.allClassifications}</option>
                <option value="Inversionista">{copy.investor}</option>
                <option value="Comprador final">{copy.finalBuyer}</option>
                <option value="Broker / aliado">{copy.brokerPartner}</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{copy.minBudget}</label>
              <input
                type="number"
                value={filterMinBudget}
                onChange={(e) => setFilterMinBudget(e.target.value)}
                placeholder={copy.amountExample}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{copy.maxBudget}</label>
              <input
                type="number"
                value={filterMaxBudget}
                onChange={(e) => setFilterMaxBudget(e.target.value)}
                placeholder={copy.amountExample}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50 text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400 border-b border-slate-100">
              <tr>
                <th className="w-12 px-4 py-3.5 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-blue-600"
                  >
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5">{copy.contact}</th>
                <th className="px-4 py-3.5">{copy.channels}</th>
                <th className="px-4 py-3.5">{copy.tags}</th>
                <th className="px-4 py-3.5">{copy.interestBudget}</th>
                <th className="px-4 py-3.5">{copy.pipeline}</th>
                <th className="px-4 py-3.5 text-right">{copy.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">{copy.noContacts}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {copy.noContactsHint}
                    </p>
                    <Link
                      href="/portal/leads/new"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" /> {copy.createFirstContact}
                    </Link>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = selectedIds.includes(contact.id);
                  return (
                    <tr
                      key={contact.id}
                      className={cn(
                        'transition hover:bg-slate-50/70',
                        isSelected && 'bg-blue-50'
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(contact.id)}
                          className="text-slate-400 hover:text-blue-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      {/* Contact Info (Clickable to 360 view) */}
                      <td className="px-4 py-4">
                        <Link
                          href={`/portal/clientes/${contact.publicCode}`}
                          className="group flex items-center gap-3"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-extrabold text-blue-700 text-xs shadow-sm group-hover:bg-blue-600 group-hover:text-white transition">
                            {contact.firstName[0]}
                            {contact.lastName?.[0] || ''}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center gap-1.5">
                              <span>{contact.fullName}</span>
                              {contact.classification && (
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                                  {copy.classifications[contact.classification] || contact.classification}
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {contact.email || copy.noEmail} · {contact.phone}
                            </p>
                          </div>
                        </Link>
                      </td>

                      {/* Channels & DND (Do Not Disturb) */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            title={
                              contact.dnd.whatsapp
                                ? copy.whatsappBlocked
                                : copy.whatsappEnabled
                            }
                            className={cn(
                              'flex h-6 w-6 items-center justify-center rounded-lg text-xs',
                              contact.dnd.whatsapp
                                ? 'bg-red-50 text-red-400 line-through'
                                : 'bg-emerald-50 text-emerald-600'
                            )}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </span>
                          <span
                            title={
                              contact.dnd.email
                                ? copy.emailBlocked
                                : copy.emailEnabled
                            }
                            className={cn(
                              'flex h-6 w-6 items-center justify-center rounded-lg text-xs',
                              contact.dnd.email
                                ? 'bg-red-50 text-red-400 line-through'
                                : 'bg-blue-50 text-blue-600'
                            )}
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </span>
                          <span
                            title={
                              contact.dnd.calls
                                ? copy.callsBlocked
                                : copy.callsEnabled
                            }
                            className={cn(
                              'flex h-6 w-6 items-center justify-center rounded-lg text-xs',
                              contact.dnd.calls
                                ? 'bg-red-50 text-red-400 line-through'
                                : 'bg-purple-50 text-purple-600'
                            )}
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </td>

                      {/* Tags */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {contact.tags.length === 0 ? (
                            <span className="text-[11px] text-slate-300">—</span>
                          ) : (
                            contact.tags.map((t) => (
                              <span
                                key={t.id}
                                className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700"
                              >
                                <Tag className="h-2.5 w-2.5 text-blue-500" />
                                {t.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Interest & Budget */}
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-800 flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {contact.primaryOpportunity?.projectName || copy.noProject}
                          </span>
                        </p>
                        <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                          {contact.primaryOpportunity?.budgetMax
                            ? formatCurrency(contact.primaryOpportunity.budgetMax, contact.primaryOpportunity.currency)
                            : copy.openBudget}
                        </p>
                      </td>

                      {/* Pipeline Stage */}
                      <td className="px-4 py-4">
                        <StageBadge stage={contact.primaryOpportunity?.stage || 'new'} labels={copy.stages} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/portal/clientes/${contact.publicCode}`}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[11px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition"
                          >
                            <Eye className="h-3.5 w-3.5" /> {copy.contactRecord}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear Nueva Smart List (GHL Style) */}
      {createListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-base">{copy.saveList}</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateListModalOpen(false)}
                aria-label={copy.cancel}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {copy.saveListDescription}
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">{copy.listName}</label>
              <input
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder={copy.listNamePlaceholder}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateListModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                {copy.cancel}
              </button>
              <button
                type="button"
                disabled={!newListName.trim()}
                onClick={handleSaveAsSmartList}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {copy.saveList}
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-950 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-bottom-2">
          {notice}
        </div>
      )}
    </div>
  );
}

function StageBadge({ stage, labels }: { stage: string; labels: Record<string, string> }) {
  const map: Record<string, { bg: string; text: string }> = {
    new: { bg: 'bg-blue-50', text: 'text-blue-700' },
    contacted: { bg: 'bg-sky-50', text: 'text-sky-700' },
    qualified: { bg: 'bg-amber-50', text: 'text-amber-700' },
    proposal: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
    negotiation: { bg: 'bg-orange-50', text: 'text-orange-700' },
    reservation: { bg: 'bg-emerald-600', text: 'text-white' },
    won: { bg: 'bg-emerald-700', text: 'text-white' },
    lost: { bg: 'bg-slate-100', text: 'text-slate-500' },
  };

  const item = map[stage] || { bg: 'bg-slate-100', text: 'text-slate-700' };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide',
        item.bg,
        item.text
      )}
    >
      {labels[stage] || stage}
    </span>
  );
}
