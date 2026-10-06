import { autoTranslateDateOrPhrase, type Locale } from './locale';

// Deterministic document labels: never depend on a translation API.
export const documentCopy: Record<string, [string, string]> = {
  'Disponibilidad': ['Availability', 'Disponibilité'],
  'disponibilidad': ['availability', 'disponibilité'],
  'DISPONIBILIDAD': ['AVAILABILITY', 'DISPONIBILITÉ'],
  'Compartir': ['Share', 'Partager'],
  'compartir': ['share', 'partager'],
  'COMPARTIR': ['SHARE', 'PARTAGER'],
  'Copiar enlace': ['Copy link', 'Copier le lien'],
  '¡Copiado!': ['Copied!', 'Copié !'],
  'Compartir por WhatsApp': ['Share via WhatsApp', 'Partager sur WhatsApp'],
  'Finanzas': ['Finances', 'Finances'],
  'Concepto': ['Concept', 'Concept'],
  'Contenido': ['Contents', 'Sommaire'],
  'CONTENIDO': ['CONTENTS', 'SOMMAIRE'],
  'Propuesta de inversión': ['Investment proposal', "Proposition d’investissement"],
  'Propuesta personalizada': ['Personalized proposal', 'Proposition personnalisée'],
  'Beneficio autorizado': ['Authorized benefit', 'Avantage autorisé'],
  'Ubicación por confirmar': ['Location to be confirmed', 'Emplacement à confirmer'],
  'Presentado a': ['Presented to', 'Présentée à'],
  'Inversionista': ['Investor', 'Investisseur'],
  'Unidad seleccionada': ['Selected unit', 'Bien sélectionné'],
  'Unidades seleccionadas': ['Selected units', 'Biens sélectionnés'],
  'Unidad disponible': ['Available unit', 'Bien disponible'],
  'Unidad': ['Unit', 'Unité'],
  'hab.': ['bed', 'ch.'],
  'habs.': ['beds', 'ch.'],
  'baño': ['bath', 'sdb'],
  'baños': ['baths', 'sdb'],
  'parqueo': ['parking', 'parking'],
  'parqueos': ['parkings', 'parkings'],
  'parq.': ['pkg.', 'stat.'],
  'parqs.': ['pkgs.', 'stats.'],
  'Valor de la unidad': ['Unit price', 'Prix du bien'],
  'Valor de las unidades': ['Units value', 'Valeur des biens'],
  'Rango de valor': ['Value range', 'Fourchette de prix'],
  'adicionales': ['additional', 'supplémentaires'],
  'Por confirmar': ['To be confirmed', 'À confirmer'],
  'Condiciones comerciales sujetas a confirmación.': ['Commercial terms subject to confirmation.', 'Conditions commerciales sous réserve de confirmation.'],
  'Imagen de la propuesta': ['Proposal image', 'Image de la proposition'],
  'La unidad seleccionada aparecerá aquí al crear la propuesta.': ['The selected unit will appear here when the proposal is created.', 'Le bien sélectionné apparaîtra ici lors de la création de la proposition.'],
  'Unidades de esta tipología': ['Units of this type', 'Biens de cette typologie'],
  'la tipología': ['the unit type', 'la typologie'],
  'Habitaciones': ['Bedrooms', 'Chambres'],
  'Baños': ['Bathrooms', 'Salles de bains'],
  'Parqueos': ['Parking spaces', 'Places de parking'],
  'Metraje': ['Area', 'Surface'],
  'Reserva de unidad': ['Unit reservation', 'Réservation du bien'],
  'Firma de contrato': ['Contract signing', 'Signature du contrat'],
  'Pago contra entrega': ['Payment on handover', 'Paiement à la livraison'],
  'Amenidades por confirmar': ['Amenities to be confirmed', 'Équipements à confirmer'],
  'Plano técnico de la unidad': ['Unit floor plan', 'Plan du bien'],
  'Selecciona uno o dos planos desde la biblioteca de medios.': ['Select one or two plans from the media library.', 'Sélectionnez un ou deux plans dans la médiathèque.'],
  'Ubicación del proyecto': ['Project location', 'Emplacement du projet'],
  'Selecciona el mapa o imagen de ubicación.': ['Select a map or location image.', 'Sélectionnez une carte ou une image de localisation.'],
  'Asesor': ['Advisor', 'Conseiller'],
  'Asesor inmobiliario': ['Real estate advisor', 'Conseiller immobilier'],
  'Equipo comercial': ['Sales team', 'Équipe commerciale'],
  'Contacto disponible a solicitud': ['Contact details available on request', 'Coordonnées disponibles sur demande'],
  'Agencia': ['Agency', 'Agence'],
  'Atención personalizada para su proceso de inversión.': ['Personalized support throughout your investment.', 'Un accompagnement personnalisé pour votre investissement.'],
  'Galería': ['Gallery', 'Galerie'],
  'Portada': ['Cover', 'Couverture'],
  'Proyecto': ['Project', 'Projet'],
  'Tipología': ['Unit type', 'Typologie'],
  'Plan de pago': ['Payment plan', 'Plan de paiement'],
  'Pagos': ['Payments', 'Paiements'],
  'Amenidades': ['Amenities', 'Équipements'],
  'Índice': ['Contents', 'Sommaire'],
  'Índice de la propuesta': ['Proposal contents', 'Sommaire de la proposition'],
  'Mostrar índice': ['Show contents', 'Afficher le sommaire'],
  'Ocultar índice': ['Hide contents', 'Masquer le sommaire'],
  'Página': ['Page', 'Page'],
  'Preparando documento': ['Preparing document', 'Préparation du document'],
  'Preparando página': ['Preparing page', 'Préparation de la page'],
  'de': ['of', 'sur'],
  'Diapositiva': ['Slide', 'Diapositive'],
  'PÁG.': ['PAGE', 'PAGE'],
  'Pág.': ['Page', 'Page'],
  'PÁGINA': ['PAGE', 'PAGE'],
  'DE': ['OF', 'SUR'],
  'Preparada para': ['Prepared for', 'Préparée pour'],
  'Diciembre 2027': ['December 2027', 'Décembre 2027'],
  'Preparado y enviado por': ['Prepared and sent by', 'Préparé et envoyé par'],
  'Quedo a su disposición para acompañarle en la evaluación de esta oportunidad.': ['I am available to help you evaluate this opportunity.', 'Je suis à votre disposition pour vous accompagner dans l’évaluation de cette opportunité.'],
  'Master Plan': ['Master plan', 'Plan d’ensemble'],
  '1 Habitación (Estándar)': ['1 Bedroom (Standard)', '1 chambre (standard)'],
  'Agotado': ['Sold out', 'Épuisé'],
  'Penthouse (5to Nivel)': ['Penthouse (5th floor)', 'Penthouse (5e étage)'],
  'Desde': ['From', 'À partir de'],
  'Inventario oficial verificado': ['Verified official inventory', 'Inventaire officiel vérifié'],
  'Ubicación': ['Location', 'Emplacement'],
  'Disponibles': ['Available', 'Disponibles'],
  'Entrega': ['Handover', 'Livraison'],
  'No hay documentos para mostrar.': ['No documents to display.', 'Aucun document à afficher.'],
  'Beneficiario': ['Beneficiary', 'Bénéficiaire'],
  'Banco': ['Bank', 'Banque'],
  'Banco ••••••••': ['Bank ••••••••', 'Banque ••••••••'],
  'Cuenta USD': ['USD account', 'Compte USD'],
  'Referencia': ['Reference', 'Référence'],
  'Validar la versión final con el equipo legal antes de enviarla.': ['Have the legal team validate the final version before sending.', 'Faire valider la version finale par le service juridique avant l’envoi.'],
  'Desarrollo': ['Development', 'Programme immobilier'],
  'Vista previa': ['Preview', 'Aperçu'],
  'Vista previa — broker': ['Broker preview', 'Aperçu — courtier'],
  'Pendiente de verificación — no visible para el cliente': ['Pending verification — not visible to the client', 'En attente de vérification — non visible par le client'],
  'Pantalla completa': ['Full screen', 'Plein écran'],
  'Salir de pantalla completa': ['Exit full screen', 'Quitter le plein écran'],
  'Esta propuesta fue generada con datos correctos al momento de su creación. Los precios, imágenes, disponibilidad y condiciones comerciales deben ser confirmados formalmente antes de reservar.': ['This proposal was generated using information valid at the time of creation. Prices, images, availability and commercial terms must be formally confirmed before reserving.', 'Cette proposition a été générée à partir des données valides au moment de sa création. Les prix, images, disponibilités et conditions commerciales doivent être confirmés formellement avant toute réservation.'],
  'Información de carácter ilustrativo y sujeta a cambios sin previo aviso. Precios, disponibilidad, terminaciones y condiciones comerciales deben ser confirmados antes de formalizar cualquier operación.': [
    'Illustrative information subject to change without notice. Prices, availability, finishes and commercial conditions must be confirmed before formalising any transaction.',
    'Informations à titre illustratif et susceptibles de modifications sans préavis. Les prix, disponibilités, finitions et conditions commerciales doivent être confirmés avant de formaliser toute opération.',
  ],
};

export function documentText(text: string, locale: Locale) {
  if (locale === 'es' || !text) return text;
  const direct = documentCopy[text]?.[locale === 'en' ? 0 : 1];
  if (direct) return direct;

  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const lowerMatch = documentCopy[lower]?.[locale === 'en' ? 0 : 1];
  if (lowerMatch) {
    if (trimmed === trimmed.toUpperCase()) return lowerMatch.toUpperCase();
    if (trimmed[0] === trimmed[0].toUpperCase()) return lowerMatch.charAt(0).toUpperCase() + lowerMatch.slice(1);
    return lowerMatch;
  }

  const auto = autoTranslateDateOrPhrase(trimmed, locale);
  if (auto && auto !== trimmed) {
    if (trimmed === trimmed.toUpperCase()) return auto.toUpperCase();
    return auto;
  }

  return text;
}
