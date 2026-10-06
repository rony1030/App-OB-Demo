export const supportedLocales = ['es', 'en', 'fr'] as const;

export type Locale = (typeof supportedLocales)[number];

export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
};

export type TranslationKey =
  | 'workspace'
  | 'switchWorkspace'
  | 'organization'
  | 'search'
  | 'home'
  | 'clients'
  | 'negotiations'
  | 'projects'
  | 'inventory'
  | 'agency'
  | 'proposals'
  | 'commissions'
  | 'agreements'
  | 'documents'
  | 'profile'
  | 'support'
  | 'brand'
  | 'team'
  | 'brokerAccessRequests'
  | 'summary'
  | 'masterBrokers'
  | 'reportingAccess'
  | 'globalProjects'
  | 'brokerEvents'
  | 'marketingOffers'
  | 'salesAndReservations'
  | 'seoOptimizer'
  | 'audit'
  | 'settings'
  | 'operationsCenter'
  | 'organizations'
  | 'integrations'
  | 'logout'
  | 'professionalProfile'
  | 'active'
  | 'commercialCrm'
  | 'masterAdministration'
  | 'platformPanel'
  | 'developerPanel'
  | 'presentation'
  | 'grid'
  | 'downloadPdf'
  | 'contactAdvisor'
  | 'previous'
  | 'next'
  | 'privateProposal'
  | 'commercialDossier'
  | 'exporting'
  | 'developer'
  | 'gallery'
  | 'amenities'
  | 'amenitiesHeadline'
  | 'paymentPlan'
  | 'profitability'
  | 'availability'
  | 'documentation'
  | 'portal'
  | 'contact'
  | 'allProjects'
  | 'translations'
  | 'allDevelopers'
  | 'brokerAccess'
  | 'concept'
  | 'villas'
  | 'qualities'
  | 'masterPlan'
  | 'location'
  | 'lots'
  | 'investment'
  | 'exploreAvailability'
  | 'simulatePayments'
  | 'contactAdvisorOfficial'
  | 'officialSalesOpen'
  | 'availableUnits'
  | 'reserved'
  | 'available'
  | 'seeAll'
  | 'filterBy'
  | 'myPortal'
  // Navbar & Navigation
  | 'developments'
  | 'forBrokers'
  | 'howItWorks'
  | 'commissionsNav'
  | 'portalBrokers'
  | 'requestAccess'
  | 'requestPortalAccess'
  | 'closeMenu'
  | 'openMenu'
  // Hero
  | 'heroBadge'
  | 'heroTitleLine1'
  | 'heroTitleLine2'
  | 'heroSubtitle'
  | 'exploreDevelopments'
  | 'activeBrokers'
  | 'ratingCount'
  | 'whiteLabel'
  | 'clientCustody'
  | 'liveInventory'
  | 'daysSuffix'
  // Operations & Reservations Review
  | 'operationalControl'
  | 'reservationsAndSales'
  | 'reservationsSubtitle'
  | 'reservationsTab'
  | 'salesTab'
  | 'pendingReservations'
  | 'paymentsToVerify'
  | 'activeSales'
  | 'searchReservationPlaceholder'
  | 'allAuthorizedProjects'
  | 'colProjectUnit'
  | 'colClient'
  | 'colAgentAgency'
  | 'colValue'
  | 'colStatus'
  | 'colActions'
  | 'noOperations'
  | 'dealFile'
  | 'approveReservation'
  | 'reject'
  | 'rejectReason'
  | 'confirm'
  | 'clientDocuments'
  | 'noDocuments'
  | 'reportedPayments'
  | 'noPayments'
  | 'verify'
  | 'confirmSaleAndCommission'
  | 'deal'
  | 'hide'
  | 'file'
  | 'noClient'
  | 'noEmail'
  | 'closedSale'
  | 'confirmedReservation'
  | 'pendingStatus'
  | 'inReservation'
  | 'closeRequirement'
  | 'requestApproved'
  | 'requestRejected'
  | 'paymentVerified'
  | 'paymentRejected'
  | 'saleConfirmed'
  | 'unableToOpenFile'
  | 'requestedBy'
  // Value Pillars & How It Works & CTA
  | 'valuePillarsBadge'
  | 'valuePillarsTitle'
  | 'valuePillarsSubtitle'
  | 'howItWorksBadge'
  | 'howItWorksTitle'
  | 'howItWorksSubtitle'
  | 'commissionsBadge'
  | 'commissionsTitle'
  | 'commissionsSubtitle'
  | 'accessSectionBadge'
  | 'accessSectionTitle'
  | 'accessSectionSubtitle'
  | 'footerRights'
  | 'analytics'
  | 'systemLogs';

const translations: Record<Locale, Record<TranslationKey, string>> = {
  es: {
    workspace: 'Espacio de trabajo', switchWorkspace: 'Cambiar modo de trabajo', organization: 'Organización',
    search: 'Buscar clientes, proyectos o unidades...', home: 'Inicio', clients: 'Clientes', negotiations: 'Negociaciones',
    projects: 'Proyectos', inventory: 'Inventario', agency: 'Agencia', proposals: 'Propuestas y Dossiers', commissions: 'Comisiones',
    agreements: 'Acuerdos', documents: 'Mis documentos', profile: 'Mi perfil', support: 'Soporte', brand: 'Mi marca',
    team: 'Equipo', brokerAccessRequests: 'Solicitudes de brokers', summary: 'Resumen', masterBrokers: 'Master brokers', reportingAccess: 'Accesos de seguimiento', globalProjects: 'Proyectos globales', brokerEvents: 'Eventos & Tours', marketingOffers: 'Ofertas y promociones', salesAndReservations: 'Ventas y reservas', seoOptimizer: 'SEO & Search Console',
    audit: 'Auditoría', settings: 'Configuración', operationsCenter: 'Centro de operaciones', organizations: 'Organizaciones',
    integrations: 'Integraciones', logout: 'Cerrar sesión', professionalProfile: 'Mi perfil profesional', active: 'Activo',
    commercialCrm: 'CRM comercial', masterAdministration: 'Administración master', platformPanel: 'Panel de plataforma', developerPanel: 'Panel de desarrolladora',
    presentation: 'Presentación', grid: 'Vista general', downloadPdf: 'Descargar PDF', contactAdvisor: 'Contactar asesor', previous: 'Anterior', next: 'Siguiente', privateProposal: 'Propuesta privada', commercialDossier: 'Dossier comercial', exporting: 'Generando…',
    developer: 'Desarrollador', gallery: 'Galería', amenities: 'Amenidades', amenitiesHeadline: 'Todo lo que eleva la experiencia.', paymentPlan: 'Plan de pago', profitability: 'Rentabilidad', availability: 'Disponibilidad', documentation: 'Documentación', portal: 'Portal', contact: 'Contactar', allProjects: 'Todos los proyectos',
    translations: 'Traducciones', allDevelopers: 'Todos los desarrolladores', brokerAccess: 'Acceso Brokers',
    concept: 'Concepto', villas: 'Villas', qualities: 'Calidades', masterPlan: 'Master Plan', location: 'Ubicación',
    lots: 'Lotes', investment: 'Inversión', exploreAvailability: 'Explorar Disponibilidad', simulatePayments: 'Simular Pagos',
    contactAdvisorOfficial: 'Contactar Asesor Oficial', officialSalesOpen: 'Ventas Oficiales Abiertas',
    availableUnits: 'Unidades Disponibles', reserved: 'Reservado', available: 'Disponible', seeAll: 'Ver todo',
    filterBy: 'Filtrar por', myPortal: 'Mi Portal',

    // Navbar
    developments: 'Desarrollos',
    forBrokers: 'Para Brokers',
    howItWorks: 'Cómo funciona',
    commissionsNav: 'Comisiones',
    portalBrokers: 'Portal Brokers',
    requestAccess: 'Solicitar Acceso',
    requestPortalAccess: 'Solicitar Acceso al Portal',
    closeMenu: 'Cerrar menú',
    openMenu: 'Abrir menú',

    // Hero
    heroBadge: 'Master Broker Inmobiliario · Caribe & Punta Cana',
    heroTitleLine1: 'La plataforma comercial',
    heroTitleLine2: 'para brokers de alto rendimiento',
    heroSubtitle: 'Accede al inventario oficial en tiempo real, genera dossiers y propuestas interactivas con tu marca blanca, firma digitalmente y protege contractualmente a tus clientes inversionistas.',
    exploreDevelopments: 'Explorar Desarrollos',
    activeBrokers: '100+ Brokers Activos',
    ratingCount: '4.9/5 Calificación',
    whiteLabel: 'Marca Blanca',
    clientCustody: 'Custodia Clientes',
    liveInventory: 'Inventario en Vivo',
    daysSuffix: ' Días',

    // Operations & Reservations Review
    operationalControl: 'Control operativo',
    reservationsAndSales: 'Ventas y reservas',
    reservationsSubtitle: 'Verifica reservas, documentos y pagos dentro de cada negociación autorizada.',
    reservationsTab: 'Reservas',
    salesTab: 'Ventas',
    pendingReservations: 'Reservas pendientes',
    paymentsToVerify: 'Pagos por verificar',
    activeSales: 'Ventas activas',
    searchReservationPlaceholder: 'Buscar cliente, unidad, agente o agencia',
    allAuthorizedProjects: 'Todos los proyectos autorizados',
    colProjectUnit: 'Proyecto / unidad',
    colClient: 'Cliente',
    colAgentAgency: 'Agente / agencia',
    colValue: 'Valor',
    colStatus: 'Estado',
    colActions: 'Acciones',
    noOperations: 'No hay operaciones para este filtro.',
    dealFile: 'Expediente de negociación',
    approveReservation: 'Aprobar reserva',
    reject: 'Rechazar',
    rejectReason: 'Motivo del rechazo',
    confirm: 'Confirmar',
    clientDocuments: 'Documentos del cliente',
    noDocuments: 'No hay documentos en el expediente.',
    reportedPayments: 'Comprobantes reportados',
    noPayments: 'Aún no hay comprobantes.',
    verify: 'Verificar',
    confirmSaleAndCommission: 'Confirmar venta y pasar a comisión',
    deal: 'Negociación',
    hide: 'Ocultar',
    file: 'Expediente',
    noClient: 'Sin cliente',
    noEmail: 'Sin correo',
    closedSale: 'Venta cerrada',
    confirmedReservation: 'Reserva confirmada',
    pendingStatus: 'Pendiente',
    inReservation: 'En reserva',
    closeRequirement: 'El cierre requiere contrato en el expediente y pago inicial verificado.',
    requestApproved: 'Solicitud aprobada.',
    requestRejected: 'Solicitud rechazada.',
    paymentVerified: 'Pago verificado y expediente actualizado.',
    paymentRejected: 'Comprobante rechazado.',
    saleConfirmed: 'Venta confirmada. La negociación quedó lista para comisión.',
    unableToOpenFile: 'No se pudo abrir el archivo.',
    requestedBy: 'Solicitado',

    // Value Pillars & How It Works & CTA
    valuePillarsBadge: 'Tecnología & Respaldo Institucional',
    valuePillarsTitle: 'Diseñado para cerrar más ventas inmobiliarias',
    valuePillarsSubtitle: 'Herramientas de última generación para brokers independientes, agencias aliadas y desarrolladores de alto calibre.',
    howItWorksBadge: 'Cómo funciona',
    howItWorksTitle: 'De la invitación al cierre de venta',
    howItWorksSubtitle: 'El mismo flujo, de punta a punta, para cualquier broker de la red.',
    commissionsBadge: 'Esquema de Comisiones',
    commissionsTitle: 'Comisiones transparentes y protegidas',
    commissionsSubtitle: 'Liquidaciones trazables, contratos comerciales auditables y desembolsos puntuales.',
    accessSectionBadge: 'Acceso Exclusivo',
    accessSectionTitle: 'Únete a la Red de Master Brokers',
    accessSectionSubtitle: 'Solicita tu acceso comercial y comienza a operar con el inventario más exclusivo del Caribe.',
    footerRights: 'Todos los derechos reservados. Master Broker Inmobiliario.',
    analytics: 'Estadísticas',
    systemLogs: 'Registros del sistema',
  },
  en: {
    workspace: 'Workspace', switchWorkspace: 'Switch workspace', organization: 'Organization',
    search: 'Search clients, projects or units...', home: 'Home', clients: 'Clients', negotiations: 'Negotiations',
    projects: 'Projects', inventory: 'Inventory', agency: 'Agency', proposals: 'Proposals & Dossiers', commissions: 'Commissions',
    agreements: 'Agreements', documents: 'My documents', profile: 'My profile', support: 'Support', brand: 'My brand',
    team: 'Team', brokerAccessRequests: 'Broker requests', summary: 'Overview', masterBrokers: 'Master brokers', reportingAccess: 'Reporting access', globalProjects: 'Global projects', brokerEvents: 'Events & Tours', marketingOffers: 'Offers and promotions', salesAndReservations: 'Sales and reservations', seoOptimizer: 'SEO & Search Console',
    audit: 'Audit', settings: 'Settings', operationsCenter: 'Operations center', organizations: 'Organizations',
    integrations: 'Integrations', logout: 'Sign out', professionalProfile: 'Professional profile', active: 'Active',
    commercialCrm: 'Commercial CRM', masterAdministration: 'Master administration', platformPanel: 'Platform panel', developerPanel: 'Developer panel',
    presentation: 'Presentation', grid: 'Overview', downloadPdf: 'Download PDF', contactAdvisor: 'Contact advisor', previous: 'Previous', next: 'Next', privateProposal: 'Private proposal', commercialDossier: 'Commercial dossier', exporting: 'Generating…',
    developer: 'Developer', gallery: 'Gallery', amenities: 'Amenities', amenitiesHeadline: 'Everything that elevates the experience.', paymentPlan: 'Payment plan', profitability: 'Profitability', availability: 'Availability', documentation: 'Documentation', portal: 'Portal', contact: 'Contact', allProjects: 'All projects',
    translations: 'Translations', allDevelopers: 'All developers', brokerAccess: 'Brokers Access',
    concept: 'Concept', villas: 'Villas', qualities: 'Specifications', masterPlan: 'Master Plan', location: 'Location',
    lots: 'Lots', investment: 'Investment', exploreAvailability: 'Explore Availability', simulatePayments: 'Simulate Payments',
    contactAdvisorOfficial: 'Contact Official Advisor', officialSalesOpen: 'Official Sales Open',
    availableUnits: 'Available Units', reserved: 'Reserved', available: 'Available', seeAll: 'See all',
    filterBy: 'Filter by', myPortal: 'My Portal',

    // Navbar
    developments: 'Developments',
    forBrokers: 'For Brokers',
    howItWorks: 'How it works',
    commissionsNav: 'Commissions',
    portalBrokers: 'Brokers Portal',
    requestAccess: 'Request Access',
    requestPortalAccess: 'Request Portal Access',
    closeMenu: 'Close menu',
    openMenu: 'Open menu',

    // Hero
    heroBadge: 'Master Real Estate Broker · Caribbean & Punta Cana',
    heroTitleLine1: 'The commercial platform',
    heroTitleLine2: 'for high-performing brokers',
    heroSubtitle: 'Access official real-time inventory, generate white-label dossiers and interactive proposals, sign digitally, and contractually protect your investor clients.',
    exploreDevelopments: 'Explore Developments',
    activeBrokers: '100+ Active Brokers',
    ratingCount: '4.9/5 Rating',
    whiteLabel: 'White Label',
    clientCustody: 'Client Protection',
    liveInventory: 'Live Inventory',
    daysSuffix: ' Days',

    // Operations & Reservations Review
    operationalControl: 'Operational control',
    reservationsAndSales: 'Sales and reservations',
    reservationsSubtitle: 'Verify reservations, documents, and payments within each authorized deal.',
    reservationsTab: 'Reservations',
    salesTab: 'Sales',
    pendingReservations: 'Pending reservations',
    paymentsToVerify: 'Payments to verify',
    activeSales: 'Active sales',
    searchReservationPlaceholder: 'Search client, unit, agent or agency',
    allAuthorizedProjects: 'All authorized projects',
    colProjectUnit: 'Project / unit',
    colClient: 'Client',
    colAgentAgency: 'Agent / agency',
    colValue: 'Value',
    colStatus: 'Status',
    colActions: 'Actions',
    noOperations: 'No operations found for this filter.',
    dealFile: 'Deal record',
    approveReservation: 'Approve reservation',
    reject: 'Reject',
    rejectReason: 'Reason for rejection',
    confirm: 'Confirm',
    clientDocuments: 'Client documents',
    noDocuments: 'No documents in this file.',
    reportedPayments: 'Reported payment receipts',
    noPayments: 'No payment proofs yet.',
    verify: 'Verify',
    confirmSaleAndCommission: 'Confirm sale and proceed to commission',
    deal: 'Deal',
    hide: 'Hide',
    file: 'Record',
    noClient: 'No client',
    noEmail: 'No email',
    closedSale: 'Closed sale',
    confirmedReservation: 'Confirmed reservation',
    pendingStatus: 'Pending',
    inReservation: 'Reserved',
    closeRequirement: 'Closing requires contract in the file and verified initial payment.',
    requestApproved: 'Request approved.',
    requestRejected: 'Request rejected.',
    paymentVerified: 'Payment verified and deal file updated.',
    paymentRejected: 'Receipt rejected.',
    saleConfirmed: 'Sale confirmed. Deal is now ready for commission.',
    unableToOpenFile: 'Unable to open file.',
    requestedBy: 'Requested',

    // Value Pillars & How It Works & CTA
    valuePillarsBadge: 'Technology & Institutional Backing',
    valuePillarsTitle: 'Engineered to close more real estate sales',
    valuePillarsSubtitle: 'Next-generation tools for independent brokers, allied agencies, and premier developers.',
    howItWorksBadge: 'How it works',
    howItWorksTitle: 'From invitation to closing the sale',
    howItWorksSubtitle: 'The exact end-to-end workflow for every broker in the network.',
    commissionsBadge: 'Commission Structure',
    commissionsTitle: 'Transparent and protected commissions',
    commissionsSubtitle: 'Traceable payouts, auditable commercial contracts, and timely disbursements.',
    accessSectionBadge: 'Exclusive Access',
    accessSectionTitle: 'Join the Master Broker Network',
    accessSectionSubtitle: 'Request your commercial access and start operating with the Caribbean’s most exclusive inventory.',
    footerRights: 'All rights reserved. Master Real Estate Broker.',
    analytics: 'Analytics',
    systemLogs: 'System logs',
  },
  fr: {
    workspace: 'Espace de travail', switchWorkspace: 'Changer d’espace', organization: 'Organisation',
    search: 'Rechercher des clients, projets ou unités...', home: 'Accueil', clients: 'Clients', negotiations: 'Négociations',
    projects: 'Projets', inventory: 'Inventaire', agency: 'Agence', proposals: 'Propositions & Dossiers', commissions: 'Commissions',
    agreements: 'Accords', documents: 'Mes documents', profile: 'Mon profil', support: 'Assistance', brand: 'Ma marque',
    team: 'Équipe', brokerAccessRequests: 'Demandes de brokers', summary: 'Résumé', masterBrokers: 'Master brokers', reportingAccess: 'Accès aux rapports', globalProjects: 'Projets globaux', brokerEvents: 'Événements & Visites', marketingOffers: 'Offres et promotions', salesAndReservations: 'Ventes et réservations', seoOptimizer: 'SEO & Search Console',
    audit: 'Audit', settings: 'Configuration', operationsCenter: 'Centre des opérations', organizations: 'Organisations',
    integrations: 'Intégrations', logout: 'Se déconnecter', professionalProfile: 'Profil professionnel', active: 'Actif',
    commercialCrm: 'CRM commercial', masterAdministration: 'Administration maître', platformPanel: 'Panneau de plateforme', developerPanel: 'Panneau développeur',
    presentation: 'Présentation', grid: 'Vue d’ensemble', downloadPdf: 'Télécharger le PDF', contactAdvisor: 'Contacter le conseiller', previous: 'Précédent', next: 'Suivant', privateProposal: 'Proposition privée', commercialDossier: 'Dossier commercial', exporting: 'Génération…',
    developer: 'Développeur', gallery: 'Galerie', amenities: 'Équipements', amenitiesHeadline: 'Tout ce qui élève l’expérience.', paymentPlan: 'Plan de paiement', profitability: 'Rentabilité', availability: 'Disponibilité', documentation: 'Documentation', portal: 'Portail', contact: 'Contacter', allProjects: 'Tous les projets',
    translations: 'Traductions', allDevelopers: 'Tous les promoteurs', brokerAccess: 'Accès Brokers',
    concept: 'Concept', villas: 'Villas', qualities: 'Finitions', masterPlan: 'Plan de masse', location: 'Emplacement',
    lots: 'Lots', investment: 'Investissement', exploreAvailability: 'Explorer la Disponibilité', simulatePayments: 'Simulateur de Paiements',
    contactAdvisorOfficial: 'Contacter un Conseiller Officiel', officialSalesOpen: 'Ventas Officiels Ouverts',
    availableUnits: 'Unités Disponibles', reserved: 'Réservé', available: 'Disponible', seeAll: 'Voir tout',
    filterBy: 'Filtrar par', myPortal: 'Mon Portail',

    // Navbar
    developments: 'Développements',
    forBrokers: 'Pour les Brokers',
    howItWorks: 'Comment ça fonctionne',
    commissionsNav: 'Commissions',
    portalBrokers: 'Portail Brokers',
    requestAccess: 'Demander un accès',
    requestPortalAccess: 'Demander l’accès au portail',
    closeMenu: 'Fermer le menu',
    openMenu: 'Ouvrir le menu',

    // Hero
    heroBadge: 'Master Courtier Immobilier · Caraïbes & Punta Cana',
    heroTitleLine1: 'La plateforme commerciale',
    heroTitleLine2: 'pour courtiers à haute performance',
    heroSubtitle: 'Accédez à l’inventaire officiel en temps réel, générez des dossiers et propositions interactives en marque blanche, signez numériquement et protégez contractuellement vos clients investisseurs.',
    exploreDevelopments: 'Explorer les Développements',
    activeBrokers: '100+ Courtiers Actifs',
    ratingCount: '4.9/5 Évaluation',
    whiteLabel: 'Marque Blanche',
    clientCustody: 'Protection Clients',
    liveInventory: 'Inventaire en Direct',
    daysSuffix: ' Jours',

    // Operations & Reservations Review
    operationalControl: 'Contrôle opérationnel',
    reservationsAndSales: 'Ventes et réservations',
    reservationsSubtitle: 'Vérifiez les réservations, documents et paiements de chaque négociation autorisée.',
    reservationsTab: 'Réservations',
    salesTab: 'Ventes',
    pendingReservations: 'Réservations en attente',
    paymentsToVerify: 'Paiements à vérifier',
    activeSales: 'Ventes actives',
    searchReservationPlaceholder: 'Rechercher client, lot, agent ou agence',
    allAuthorizedProjects: 'Tous les projets autorisés',
    colProjectUnit: 'Projet / lot',
    colClient: 'Client',
    colAgentAgency: 'Agent / agence',
    colValue: 'Valeur',
    colStatus: 'Statut',
    colActions: 'Actions',
    noOperations: 'Aucune opération trouvée pour ce filtre.',
    dealFile: 'Dossier de négociation',
    approveReservation: 'Approuver la réservation',
    reject: 'Rejeter',
    rejectReason: 'Motif du refus',
    confirm: 'Confirmer',
    clientDocuments: 'Documents du client',
    noDocuments: 'Aucun document dans le dossier.',
    reportedPayments: 'Justificatifs signalés',
    noPayments: 'Aucun justificatif pour le moment.',
    verify: 'Vérifier',
    confirmSaleAndCommission: 'Confirmer la vente et passer en commission',
    deal: 'Négociation',
    hide: 'Masquer',
    file: 'Dossier',
    noClient: 'Sans client',
    noEmail: 'Sans email',
    closedSale: 'Vente conclue',
    confirmedReservation: 'Réservation confirmée',
    pendingStatus: 'En attente',
    inReservation: 'Réservé',
    closeRequirement: 'La clôture nécessite un contrat au dossier et un premier versement vérifié.',
    requestApproved: 'Demande approuvée.',
    requestRejected: 'Demande rejetée.',
    paymentVerified: 'Paiement vérifié et dossier mis à jour.',
    paymentRejected: 'Justificatif rejeté.',
    saleConfirmed: 'Vente confirmée. Prêt pour le versement des commissions.',
    unableToOpenFile: 'Impossible d’ouvrir le fichier.',
    requestedBy: 'Demandé',

    // Value Pillars & How It Works & CTA
    valuePillarsBadge: 'Technologie & Soutien Institutionnel',
    valuePillarsTitle: 'Conçu pour conclure plus de ventes immobilières',
    valuePillarsSubtitle: 'Des outils de pointe pour les courtiers indépendants, agences partenaires et promoteurs de premier ordre.',
    howItWorksBadge: 'Comment ça marche',
    howItWorksTitle: 'De l’invitation à la conclusion de la vente',
    howItWorksSubtitle: 'Le même flux transparent de bout en bout pour chaque courtier.',
    commissionsBadge: 'Structure de Commission',
    commissionsTitle: 'Commissions transparentes et protégées',
    commissionsSubtitle: 'Paiements traçables, contrats d’apporteur auditables et décaissements ponctuels.',
    accessSectionBadge: 'Accès Exclusif',
    accessSectionTitle: 'Rejoignez le Réseau Master Broker',
    accessSectionSubtitle: 'Demandez votre accès commercial et commencez à opérer avec l’inventaire le plus prestigieux des Caraïbes.',
    footerRights: 'Tous droits réservés. Master Courtier Immobilier.',
    analytics: 'Statistiques',
    systemLogs: 'Journaux système',
  },
};

export function translate(locale: Locale, key: TranslationKey) {
  return translations[locale][key];
}

const MONTH_MAP: Record<'en' | 'fr', Record<string, string>> = {
  en: {
    enero: 'January',
    febrero: 'February',
    marzo: 'March',
    abril: 'April',
    mayo: 'May',
    junio: 'June',
    julio: 'July',
    agosto: 'August',
    septiembre: 'September',
    octubre: 'October',
    noviembre: 'November',
    diciembre: 'December',
  },
  fr: {
    enero: 'Janvier',
    febrero: 'Février',
    marzo: 'Mars',
    abril: 'Avril',
    mayo: 'Mai',
    junio: 'Juin',
    julio: 'Juillet',
    agosto: 'Août',
    septiembre: 'Septembre',
    octubre: 'Octobre',
    noviembre: 'Novembre',
    diciembre: 'Décembre',
  },
};

const COMMON_DICTIONARY: Record<string, Record<'en' | 'fr', string>> = {
  // Catalog & General
  'todas las zonas': { en: 'All Zones', fr: 'Toutes les Zones' },
  'por desarrolladora': { en: 'By Developer', fr: 'Par Promoteur' },
  'por desarrollador': { en: 'By Developer', fr: 'Par Promoteur' },
  'todos los proyectos': { en: 'All Projects', fr: 'Tous les Projets' },
  'explorar portafolio': { en: 'Explore Portfolio', fr: 'Explorer le Portefeuille' },
  'proyectos incluidos en este portafolio:': { en: 'Projects included in this portfolio:', fr: 'Programmes inclus dans ce portefeuille :' },
  'proyectos incluidos en este portafolio': { en: 'Projects included in this portfolio', fr: 'Programmes inclus dans ce portefeuille' },
  'precio desde': { en: 'Price from', fr: 'Prix à partir de' },
  'entrega': { en: 'Delivery', fr: 'Livraison' },
  'entrega estimada': { en: 'Estimated delivery', fr: 'Livraison estimée' },
  'estado': { en: 'Status', fr: 'Statut' },
  'disponibilidad': { en: 'Availability', fr: 'Disponibilité' },
  'consultar': { en: 'Inquire', fr: 'Consulter' },
  'consultar precio': { en: 'Inquire for price', fr: 'Prix sur demande' },
  'sin unidades disponibles': { en: 'No units available', fr: 'Aucune unité disponible' },
  'listo para entrega': { en: 'Ready for delivery', fr: 'Prêt à livrer' },
  'entrega inmediata': { en: 'Immediate delivery', fr: 'Livraison immédiate' },
  'proyecto entregado': { en: 'Project delivered', fr: 'Projet livré' },
  'entregado': { en: 'Delivered', fr: 'Livré' },
  'por definir': { en: 'TBD', fr: 'À définir' },
  'en construccion': { en: 'Under construction', fr: 'En construction' },
  'en construcción': { en: 'Under construction', fr: 'En construction' },
  'preventa': { en: 'Pre-sale', fr: 'Pré-vente' },
  'habitaciones': { en: 'Bedrooms', fr: 'Chambres' },
  'baños': { en: 'Bathrooms', fr: 'Salles de bain' },
  'metraje const.': { en: 'Built Area', fr: 'Surface Constr.' },
  'metraje const': { en: 'Built Area', fr: 'Surface Constr.' },
  'parqueos': { en: 'Parking', fr: 'Stationnements' },
  'parqueo': { en: 'Parking', fr: 'Stationnement' },
  'todas': { en: 'All', fr: 'Toutes' },
  'todos': { en: 'All', fr: 'Tous' },
  'catálogo en proceso de carga': { en: 'Catalog loading', fr: 'Catalogue en cours de chargement' },
  'no hay proyectos en esta zona': { en: 'No projects in this zone', fr: 'Aucun projet dans cette zone' },
  'los desarrollos están siendo sincronizados desde el panel maestro.': {
    en: 'Developments are being synchronized from the master panel.',
    fr: 'Les développements sont synchronisés depuis le panneau maître.',
  },
  'prueba seleccionando "todas las zonas" para ver el catálogo completo.': {
    en: 'Try selecting "All Zones" to view the full catalog.',
    fr: 'Essayez de sélectionner "Toutes les Zones" pour voir le catalogue complet.',
  },
  'ver todas las zonas': { en: 'View All Zones', fr: 'Voir Toutes les Zones' },

  'herramientas para asesores': { en: 'Advisor Tools', fr: 'Outils pour Conseillers' },
  'acceda a la disponibilidad oficial en tiempo real, descargue fichas técnicas, realice cotizaciones inmediatas y genere propuestas personalizadas con su logo en segundos.': {
    en: 'Access official real-time availability, download fact sheets, generate immediate quotes, and create personalized white-label proposals in seconds.',
    fr: 'Accédez à la disponibilité officielle en temps réel, téléchargez des fiches techniques, réalisez des devis immédiats et créez des propositions personnalisées avec votre logo en quelques secondes.',
  },
  'generar propuesta': { en: 'Generate Proposal', fr: 'Créer une Proposition' },
  'nuestros proyectos': { en: 'Our Projects', fr: 'Nos Programmes' },
  'seleccione un desarrollo para ver material y disponibilidad': {
    en: 'Select a development to view resources and availability',
    fr: 'Sélectionnez un projet pour voir les ressources et la disponibilité',
  },
  'ver disponibilidad & recursos': { en: 'View Availability & Resources', fr: 'Voir Disponibilité & Ressources' },
  'ver disponibilidad y recursos': { en: 'View Availability & Resources', fr: 'Voir Disponibilité & Ressources' },
  'herramientas': { en: 'Tools', fr: 'Outils' },
  'accesos rápidos y recursos de ventas': { en: 'Quick shortcuts and sales resources', fr: 'Raccourcis rapides et ressources de vente' },
  'ver disponibilidades': { en: 'View Availability', fr: 'Voir les Disponibilités' },
  'consultar inventario oficial y precios en tiempo real': {
    en: 'Check official inventory and real-time pricing',
    fr: 'Consulter l’inventaire officiel et les prix en direct',
  },
  'crear enlace de cotización para clientes': {
    en: 'Create client quote links',
    fr: 'Créer un lien de devis pour les clients',
  },

  // Marquee
  '100% marca blanca': { en: '100% White Label', fr: '100% Marque Blanche' },
  'inventario en vivo sincronizado': { en: 'Real-Time Synchronized Inventory', fr: 'Inventaire en Direct Synchronisé' },
  'protección de clientes 180 días': { en: '180-Day Client Protection', fr: 'Protection Clients 180 Jours' },
  'master broker en el caribe': { en: 'Master Broker in the Caribbean', fr: 'Master Courtier dans les Caraïbes' },
  'títulos deslindados & permisos al día': { en: 'Clear Deeds & Permits Up to Date', fr: 'Titres Fonciers Délimités & À Jour' },
  'comisiones preferenciales': { en: 'Preferential Commissions', fr: 'Commissions Privilégiées' },
  'dossiers interactivos': { en: 'Interactive Dossiers', fr: 'Dossiers Interactifs' },

  // Live Sync
  'sincronización directa': { en: 'Direct Synchronization', fr: 'Synchronisation Directe' },
  'disponibilidad en tiempo real': { en: 'Real-Time Availability', fr: 'Disponibilité en Temps Réel' },
  'unidad 302: bloqueada en vivo': { en: 'Unit 302: Locked Live', fr: 'Unité 302 : Réservée en Direct' },
  'sincronizado con google sheets': { en: 'Synced with Master Sheets', fr: 'Synchronisé avec Google Sheets' },
  'precios & disponibilidad actualizados': { en: 'Pricing & Availability Updated', fr: 'Prix & Disponibilités Actualisés' },
  'caribe · república dominicana': { en: 'Caribbean · Dominican Republic', fr: 'Caraïbes · République Dominicaine' },

  // Explorer & Unit Details
  'disponible': { en: 'Available', fr: 'Disponible' },
  'disponibles': { en: 'Available', fr: 'Disponibles' },
  'separada': { en: 'Reserved', fr: 'Réservée' },
  'separadas': { en: 'Reserved', fr: 'Réservées' },
  'vendida': { en: 'Sold', fr: 'Vendue' },
  'vendidas': { en: 'Sold', fr: 'Vendues' },
  'bloqueada': { en: 'Locked', fr: 'Bloquée' },
  'bloqueadas': { en: 'Locked', fr: 'Bloquées' },
  'unidad': { en: 'Unit', fr: 'Unité' },
  'unidades': { en: 'units', fr: 'unités' },
  'resultado': { en: 'result', fr: 'résultat' },
  'resultados': { en: 'results', fr: 'résultats' },
  'ver': { en: 'View', fr: 'Voir' },
  'más': { en: 'more', fr: 'de plus' },
  'bloque': { en: 'Block', fr: 'Bâtiment' },
  'modelo': { en: 'Model', fr: 'Modèle' },
  'piso': { en: 'Floor', fr: 'Étage' },
  'nivel': { en: 'Level', fr: 'Niveau' },
  'enlace copiado': { en: 'Link copied', fr: 'Lien copié' },
  'no fue posible compartir': { en: 'Unable to share', fr: 'Impossible de partager' },
  'forma de ver la disponibilidad': { en: 'Availability view mode', fr: 'Mode d’affichage des disponibilités' },
  'buscar unidad, bloque o modelo': { en: 'Search unit, block, or model', fr: 'Rechercher unité, bloc ou modèle' },
  'precio promedio': { en: 'Average Price', fr: 'Prix Moyen' },
  'inventario publicado · confirma condiciones con el equipo comercial.': {
    en: 'Published inventory · confirm terms with the sales team.',
    fr: 'Inventaire officiel publié · confirmez les conditions avec l’équipe commerciale.',
  },
  'generando pdf…': { en: 'Generating PDF…', fr: 'Génération du PDF…' },
  'descargar pdf': { en: 'Download PDF', fr: 'Télécharger PDF' },
  'compartir': { en: 'Share', fr: 'Partager' },
  'buscar por unidad, bloque o modelo': { en: 'Search by unit, block, or model', fr: 'Rechercher par unité, bloc ou modèle' },
  'tarjetas': { en: 'Cards', fr: 'Cartes' },
  'lista': { en: 'List', fr: 'Liste' },
  'filtros': { en: 'Filters', fr: 'Filtres' },
  'todos los estados': { en: 'All Statuses', fr: 'Tous les Statuts' },
  'todos los modelos': { en: 'All Models', fr: 'Tous les Modèles' },
  'todos los bloques': { en: 'All Blocks', fr: 'Tous les Blocs' },
  'todas las habitaciones': { en: 'All Bedrooms', fr: 'Toutes les Chambres' },
  'todos los baños': { en: 'All Bathrooms', fr: 'Toutes les Salles de Bain' },
  'menor precio': { en: 'Lowest Price', fr: 'Prix Croissant' },
  'mayor precio': { en: 'Highest Price', fr: 'Prix Décroissant' },
  'mayor metraje': { en: 'Largest Area', fr: 'Plus Grande Surface' },
  'código de unidad': { en: 'Unit Code', fr: 'Code Unité' },
  'limpiar filtros': { en: 'Clear Filters', fr: 'Effacer les Filtres' },
  'no encontramos unidades con estos filtros.': { en: 'No units match these filters.', fr: 'Aucune unité ne correspond à ces critères.' },
  'restablecer disponibilidad': { en: 'Reset Filters', fr: 'Réinitialiser les Filtres' },
  'precios y disponibilidad sujetos a confirmación comercial.': {
    en: 'Pricing and availability subject to sales team confirmation.',
    fr: 'Prix et disponibilités soumis à confirmation commerciale.',
  },
  'consultar una unidad': { en: 'Inquire about a unit', fr: 'Demander des informations sur une unité' },
  'consultar esta unidad': { en: 'Inquire about this unit', fr: 'Demander des informations sur cette unité' },
  'disponibilidad bajo solicitud': { en: 'Availability on Request', fr: 'Disponibilité sur Demande' },
  'el equipo comercial confirmará las opciones vigentes.': {
    en: 'The sales team will confirm active inventory options.',
    fr: 'L’équipe commerciale confirmera les options disponibles.',
  },
  'inversión': { en: 'Investment', fr: 'Investissement' },
  'ver ficha': { en: 'View Details', fr: 'Voir la Fiche' },
  'precio': { en: 'Price', fr: 'Prix' },
  'hab.': { en: 'Bed.', fr: 'Ch.' },
  'ubicación dentro del bloque': { en: 'Location within block', fr: 'Emplacement dans le bâtiment' },
  'especificaciones': { en: 'Specifications', fr: 'Caractéristiques' },
  'superficie total': { en: 'Total Area', fr: 'Surface Totale' },
  'tipo / modelo': { en: 'Type / Model', fr: 'Type / Modèle' },
  'línea blanca incluida': { en: 'Appliances Included', fr: 'Électroménagers Inclus' },
  'unidad seleccionada': { en: 'Selected unit', fr: 'Unité sélectionnée' },
  'cerrar ficha de unidad': { en: 'Close unit details', fr: 'Fermer la fiche d’unité' },
  'nevera': { en: 'Refrigerator', fr: 'Réfrigérateur' },
  'estufa': { en: 'Stove', fr: 'Cuisinière' },
  'extractor': { en: 'Range hood', fr: 'Hotte aspirante' },
  'lavadora-secadora': { en: 'Washer-Dryer', fr: 'Lave-linge séchant' },
  'lavadora / secadora': { en: 'Washer / Dryer', fr: 'Lave-linge / séchant' },
  'aires acondicionados': { en: 'Air conditioners', fr: 'Climatiseurs' },
  'aire acondicionado': { en: 'Air conditioner', fr: 'Climatiseur' },
  'precio de inversión': { en: 'Investment Price', fr: 'Prix d’Investissement' },
  'la disponibilidad y condiciones se confirman con el equipo comercial antes de reservar.': {
    en: 'Availability and conditions are confirmed with the sales team before booking.',
    fr: 'La disponibilité et les conditions sont confirmées auprès de l’équipe commerciale avant réservation.',
  },

  // Project Landing Sections
  'ver disponibilidad': { en: 'View Availability', fr: 'Voir la Disponibilité' },
  'explorar proyecto': { en: 'Explore Project', fr: 'Explorer le Projet' },
  'desde': { en: 'From', fr: 'À partir de' },
  'ubicación': { en: 'Location', fr: 'Emplacement' },
  'el proyecto': { en: 'The Project', fr: 'Le Projet' },
  'ubicación privilegiada': { en: 'Prime Location', fr: 'Emplacement Privilégié' },
  'gestión oficial': { en: 'Official Management', fr: 'Gestion Officielle' },
  'inventario y precios centralizados.': { en: 'Centralized inventory and pricing.', fr: 'Inventaire et prix centralisés.' },
  'desarrollador': { en: 'Developer', fr: 'Promoteur' },
  'galería oficial': { en: 'Official Gallery', fr: 'Galerie Officielle' },
  'conoce cada espacio.': { en: 'Discover every space.', fr: 'Découvrez chaque espace.' },
  'galería completa': { en: 'Full Gallery', fr: 'Galerie Complète' },
  'equipamiento': { en: 'Equipment', fr: 'Équipement' },
  'incluido': { en: 'included', fr: 'inclus' },
  'línea blanca completa en cada apartamento': { en: 'Complete appliances in every apartment', fr: 'Électroménagers complets dans chaque appartement' },
  'confotur aprobado (exento de impuestos)': { en: 'CONFOTUR APPROVED (TAX EXEMPT)', fr: 'CONFOTUR APPROUVÉ (EXONÉRATION FISCALE)' },
  'rentabilidad estimada': { en: 'Estimated Profitability', fr: 'Rentabilité Estimée' },
  'del proyecto': { en: 'of the project', fr: 'du projet' },
  'análisis financiero y proyecciones de retorno de inversión': {
    en: 'Financial Analysis and Return on Investment Projections',
    fr: 'Analyse Financière et Projections de Rentabilité',
  },
  'descargar imagen (png)': { en: 'Download Image (PNG)', fr: 'Télécharger l’Image (PNG)' },
  'plan de pago · entrega inmediata': { en: 'Payment Plan · Immediate Delivery', fr: 'Plan de Paiement · Livraison Immédiate' },
  'listo para entrega en cana bay': { en: 'Ready for delivery in Cana Bay', fr: 'Prêt à livrer à Cana Bay' },
  'reserva de bloqueo': { en: 'Reservation Deposit', fr: 'Dépôt de Réservation' },
  'bloqueo formal de la unidad en el inventario oficial del proyecto.': {
    en: 'Formal locking of the unit in the official project inventory.',
    fr: 'Blocage formel de l’unité dans l’inventaire officiel du projet.',
  },
  'completivo de inicial': { en: 'Down Payment Completion', fr: 'Complément d’Acompte' },
  'contra entrega': { en: 'Upon Delivery', fr: 'À la Livraison' },
  'calculadora inteligente': { en: 'Smart Calculator', fr: 'Calculateur Intelligent' },
  'de planes de pago': { en: 'of payment plans', fr: 'de plans de paiement' },
  'simula y estructura la mejor opción financiera para tu inversión al instante.': {
    en: 'Simulate and structure the optimal financing plan for your investment instantly.',
    fr: 'Simulez et structurez la meilleure option financière pour votre investissement en direct.',
  },
  'proyectos cana rock': { en: 'Cana Rock Projects', fr: 'Projets Cana Rock' },
  'imágenes': { en: 'images', fr: 'images' },
  'estufa eléctrica': { en: 'Electric Stove', fr: 'Cuisinière Électrique' },
  'lavadora secadora': { en: 'Washer Dryer', fr: 'Lave-linge Séchant' },
  'habitación': { en: 'Bedroom', fr: 'Chambre' },
  'paso': { en: 'Step', fr: 'Étape' },
  'condiciones de inversión': { en: 'Investment Terms', fr: 'Conditions d’Investissement' },
  'a la firma del contrato de promesa de compraventa (deduciendo los us$ 3,000 de reserva).': {
    en: 'Upon signing the preliminary purchase agreement (deducting the US$ 3,000 reservation).',
    fr: 'À la signature de la promesse de vente (déduction faite des 3 000 US$ de réservation).',
  },
  'listo para entrega inmediata. aplica financiamiento hipotecario bancario nacional o internacional.': {
    en: 'Ready for immediate delivery. Domestic or international mortgage financing applies.',
    fr: 'Prêt pour livraison immédiate. Financement bancaire national ou international applicable.',
  },
  'estándar (20% inicial / 40% obra / 40% entrega)': {
    en: 'Standard (20% Down / 40% Construction / 40% Delivery)',
    fr: 'Standard (20% Acompte / 40% Travaux / 40% Livraison)',
  },
  'pronto pago - 3% desc (50% inicial / 30% obra / 20% entrega)': {
    en: 'Early Payment - 3% Off (50% Down / 30% Construction / 20% Delivery)',
    fr: 'Paiement Anticipé - 3% Réd. (50% Acompte / 30% Travaux / 20% Livraison)',
  },
  'inversionista especial - 6% desc (80% inicial / 20% entrega)': {
    en: 'Special Investor - 6% Off (80% Down / 20% Delivery)',
    fr: 'Investisseur Spécial - 6% Réd. (80% Acompte / 20% Livraison)',
  },
  'meses para completar construcción': { en: 'Months to complete construction', fr: 'Mois pour achever la construction' },
  'meses': { en: 'Months', fr: 'Mois' },
  'desglose del plan de pagos estructurado': { en: 'Structured payment plan breakdown', fr: 'Ventilation structurée du plan de paiement' },
  'descuento aplicado': { en: 'Discount Applied', fr: 'Remise Appliquée' },
  'precio neto final': { en: 'Final Net Price', fr: 'Prix Net Final' },
  'mensualidad estimada (en obra)': { en: 'Estimated Monthly Payment (during construction)', fr: 'Mensualité Estimée (en travaux)' },
  'reserva de bloqueo (fijo)': { en: 'Reservation Deposit (Fixed)', fr: 'Dépôt de Réservation (Fixe)' },
  'total durante construcción': { en: 'Total during Construction', fr: 'Total pendant la Construction' },
  'cuotas de': { en: 'installments of', fr: 'mensualités de' },
  'contra entrega final': { en: 'Final Upon Delivery', fr: 'À la Livraison Finale' },
  '¡copiado al portapapeles!': { en: 'Copied to Clipboard!', fr: 'Copié dans le Presse-papiers !' },
  'copiar plan para whatsapp': { en: 'Copy Plan for WhatsApp', fr: 'Copier le Plan pour WhatsApp' },
  'precio de venta (us$)': { en: 'Purchase Price (US$)', fr: 'Prix de Vente (US$)' },
  'selecciona el plan de pago': { en: 'Select Payment Plan', fr: 'Sélectionnez le Plan de Paiement' },
  'plazo de construcción (meses)': { en: 'Construction Period (Months)', fr: 'Durée de Construction (Mois)' },
  'resumen de tu estructura de pago': { en: 'Your Payment Structure Summary', fr: 'Résumé de Votre Plan de Paiement' },
  'copiar simulación': { en: 'Copy Simulation', fr: 'Copier la Simulation' },
  'simulación copiada': { en: 'Simulation Copied', fr: 'Simulation Copiée' },

  // Marketing Descriptions
  'arquitectura contemporánea integrada con la naturaleza, el lago y el campo de golf.': {
    en: 'Contemporary architecture integrated with nature, the lake, and the golf course.',
    fr: 'Architecture contemporaine intégrée à la nature, au lac et au terrain de golf.',
  },
  'descubre un concepto residencial sublime donde la elegancia contemporánea se une con la serenidad de un entorno exclusivo. diseñado para ofrecer una experiencia de vida inigualable en una de las zonas de mayor crecimiento y plusvalía.': {
    en: 'Discover a sublime residential concept where contemporary elegance merges with the serenity of an exclusive environment. Designed to offer an incomparable living experience in one of the highest growth and appreciation areas.',
    fr: 'Découvrez un concept résidentiel sublime où l’élégance contemporaine s’allie à la sérénité d’un cadre exclusif. Conçu pour offrir une expérience de vie incomparable dans l’une des zones à plus forte croissance et plus-value.',
  },
  'residencial moderno en cana bay junto al hard rock golf club, con unidades listas para entrega inmediata.': {
    en: 'Modern residential in Cana Bay adjacent to the Hard Rock Golf Club, featuring units ready for immediate delivery.',
    fr: 'Résidence moderne à Cana Bay près du Hard Rock Golf Club, avec des unités prêtes pour une livraison immédiate.',
  },
  'combinación de diseño ecológico tropical y estilo de vida de resort de clase mundial dentro de cana bay.': {
    en: 'Combination of tropical eco-design and world-class resort lifestyle within Cana Bay.',
    fr: 'Combinaison d’éco-design tropical et d’art de vivre de villégiature haut de gamme au sein de Cana Bay.',
  },
  'proyecto residencial vanguardista con apartamentos inteligentes y vistas panorámicas al campo de golf.': {
    en: 'Avant-garde residential project featuring smart apartments and panoramic golf course views.',
    fr: 'Projet résidentiel d’avant-garde avec appartements connectés et vues panoramiques sur le parcours de golf.',
  },
  'nuevo hito arquitectónico con master plan integrado, amenidades de lujo y excelente retorno de inversión.': {
    en: 'New architectural landmark with an integrated master plan, luxury amenities, and outstanding return on investment.',
    fr: 'Nouveau repère architectural avec plan directeur intégré, équipements de prestige et excellente rentabilité.',
  },
};

export function autoTranslateDateOrPhrase(rawText: string | undefined | null, locale: Locale): string {
  if (!rawText || typeof rawText !== 'string') return '';
  if (locale === 'es') return rawText;

  const targetLang = locale as 'en' | 'fr';

  // Compound strings separated by " — " or " - "
  if (rawText.includes(' — ')) {
    return rawText
      .split(' — ')
      .map((chunk) => autoTranslateDateOrPhrase(chunk.trim(), locale))
      .join(' — ');
  }

  const trimmed = rawText.trim();
  const lower = trimmed.toLowerCase();

  // 1. Direct dictionary match
  if (COMMON_DICTIONARY[lower]?.[targetLang]) {
    return COMMON_DICTIONARY[lower][targetLang];
  }

  // 2. Developer badge pattern: "4 Desarrollos" or "1 Desarrollo" (and legacy "Desarrollador Oficial • 4 Desarrollos")
  const devBadgeMatch = trimmed.match(/^(?:Desarrollador Oficial\s*•\s*)?(\d+)\s*Desarrollo(s)?$/i);
  if (devBadgeMatch) {
    const count = devBadgeMatch[1];
    const isPlural = count !== '1';
    return targetLang === 'en'
      ? `${count} ${isPlural ? 'Developments' : 'Development'}`
      : `${count} ${isPlural ? 'Développements' : 'Développement'}`;
  }

  // 3. Month + Year patterns: "Diciembre de 2027", "Agosto 2026", "Mayo de 2027", etc.
  let translated = trimmed;
  const monthWithYearRegex = /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+de)?\s+(\d{4})\b/gi;
  if (monthWithYearRegex.test(translated)) {
    return translated.replace(monthWithYearRegex, (_match, m, y) => {
      const translatedMonth = MONTH_MAP[targetLang]?.[m.toLowerCase()] || m;
      return `${translatedMonth} ${y}`;
    });
  }

  // 4. Standalone month names
  const standaloneMonthRegex = /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi;
  if (standaloneMonthRegex.test(translated)) {
    return translated.replace(standaloneMonthRegex, (_match, m) => {
      return MONTH_MAP[targetLang]?.[m.toLowerCase()] || m;
    });
  }

  // 5. Partial phrase replacement
  for (const [key, mapping] of Object.entries(COMMON_DICTIONARY)) {
    if (lower.includes(key)) {
      const reg = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      translated = translated.replace(reg, mapping[targetLang]);
    }
  }

  return translated;
}

/**
 * Strips any supported locale prefix from the pathname.
 * e.g., "/en/proyectos/palm-view" -> "/proyectos/palm-view"
 *       "/fr" -> "/"
 */
export function stripLocaleFromPath(pathname: string): { locale?: Locale; pathnameWithoutLocale: string } {
  const match = pathname.match(/^\/(es|en|fr)(\/.*)?$/);
  if (!match) {
    return { pathnameWithoutLocale: pathname || '/' };
  }
  const locale = match[1] as Locale;
  const rest = match[2] || '/';
  return { locale, pathnameWithoutLocale: rest };
}

/**
 * Formats a pathname with the specified locale prefix.
 * e.g., ("/proyectos", "en") -> "/en/proyectos"
 *       ("/en/proyectos", "fr") -> "/fr/proyectos"
 *       ("/", "en") -> "/en"
 *       ("/es", "es") -> "/es"
 */
export function getLocalizedPath(pathname: string, targetLocale: Locale): string {
  const { pathnameWithoutLocale } = stripLocaleFromPath(pathname);
  if (pathnameWithoutLocale === '/' || pathnameWithoutLocale === '') {
    return `/${targetLocale}`;
  }
  return `/${targetLocale}${pathnameWithoutLocale.startsWith('/') ? '' : '/'}${pathnameWithoutLocale}`;
}
