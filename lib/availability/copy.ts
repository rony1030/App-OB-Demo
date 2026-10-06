import type { Locale } from '@/lib/i18n/locale';

const columnLabels: Record<string,string> = {
  'METROS CUADRADOS':'Terreno m²', lot_sqm:'Terreno m²', habitable_sqm:'Área habitable m²',
  terrace_sqm:'Terraza m²', parking_sqm:'Área de parqueo m²', deluxe_price:'Precio Deluxe',
  royal_price:'Precio Royal', SECCION:'Sección', 'm2 Extra':'Área adicional m²',
  'm2 Terreno':'Terreno m²', 'Cant. Niveles':'Niveles',
};

const copy: Record<string,[string,string]> = {
  'Disponibilidad de unidades':['Unit availability','Disponibilité des unités'],
  'Última actualización del inventario:':['Inventory last updated:','Dernière mise à jour de l’inventaire :'],
  'Descargar PDF':['Download PDF','Télécharger le PDF'], 'Copiar enlace':['Copy link','Copier le lien'],
  'Actualizar consulta':['Refresh availability','Actualiser la disponibilité'], 'Consultar a un ejecutivo':['Contact an Osvaldo Bello advisor','Contacter un conseiller Osvaldo Bello'],
  'Buscar unidad':['Search units','Rechercher une unité'], 'Unidad, modelo o bloque':['Unit, model or block','Unité, modèle ou bloc'],
  'Estado':['Status','Statut'], 'Solo disponibles':['Available units only','Unités disponibles uniquement'],
  'Todos los estados':['All statuses','Tous les statuts'], 'Disponible':['Available','Disponible'],
  'Separada':['On hold','Réservée'], 'Vendida':['Sold','Vendue'], 'Bloqueada':['Blocked','Bloquée'],
  'Entrega':['Delivery','Livraison'], 'Todos los plazos':['All delivery periods','Tous les délais'],
  'Enlace copiado.':['Link copied.','Lien copié.'], 'Copia este enlace:':['Copy this link:','Copiez ce lien :'],
  'unidades':['units','unités'], 'PDF en tamaño carta horizontal. Los filtros también se aplican a la descarga.':['Landscape Letter PDF. Selected filters also apply to the download.','PDF au format Lettre paysage. Les filtres s’appliquent aussi au téléchargement.'],
  'No hay unidades que coincidan con estos filtros.':['No units match these filters.','Aucune unité ne correspond à ces filtres.'],
  'Disponibilidad en línea:':['Online availability:','Disponibilité en ligne :'],
  'Unidad':['Unit','Unité'], 'Torre / bloque':['Tower / block','Tour / bloc'], 'Tipología':['Unit type','Type d’unité'],
  'Piso':['Floor','Étage'], 'Hab. / Baños / Parq.':['Beds / Baths / Parking','Ch. / Bains / Parking'],
  'parking':['Parking spaces','Places de parking'],
  'Terreno m²':['Land area m²','Terrain m²'], 'Área habitable m²':['Living area m²','Surface habitable m²'],
  'Terraza m²':['Terrace m²','Terrasse m²'], 'Área de parqueo m²':['Parking area m²','Surface de parking m²'],
  'Precio Deluxe':['Deluxe price','Prix Deluxe'], 'Precio Royal':['Royal price','Prix Royal'],
  'Sección':['Section','Section'], 'Área adicional m²':['Additional area m²','Surface supplémentaire m²'],
  'Niveles':['Levels','Niveaux'], 'Etapa':['Phase','Phase'], 'Vista':['View','Vue'],
  'Área m²':['Area m²','Surface m²'], 'METROS CUADRADOS':['Land area m²','Terrain m²'], 'Precio':['Price','Prix'],
  'Consultar':['Contact advisor','Consulter'], 'Inventario':['Inventory','Inventaire'],
  'Generado:':['Generated:','Généré le :'], 'Última actualización de inventario:':['Inventory last updated:','Dernière mise à jour :'],
  '(hora de Santo Domingo)':['(Santo Domingo time)','(heure de Saint-Domingue)'],
  'unidades en este reporte':['units in this report','unités dans ce rapport'],
  'Dossier oficial':['Official dossier','Dossier officiel'], 'páginas':['pages','pages'], 'Abrir dossier completo':['Open full dossier','Ouvrir le dossier complet'],
  'Dossier pendiente de publicación':['Dossier awaiting publication','Dossier en attente de publication'],
  'La información de abajo es la ficha del proyecto. El dossier completo aparecerá aquí cuando esté publicado.':['The information below is the project overview. The full dossier will appear here once it is published.','Les informations ci-dessous présentent le projet. Le dossier complet apparaîtra ici une fois publié.'],
  'Abrir editor del dossier':['Open dossier editor','Ouvrir l’éditeur du dossier'],
  'Disponibilidad para compartir':['Share availability','Partager la disponibilité'],
  'Enlace independiente con inventario actualizado y PDF carta horizontal.':['Standalone link with current inventory and a landscape Letter PDF.','Lien indépendant avec inventaire actualisé et PDF Lettre paysage.'],
  'Abrir disponibilidad en línea':['Open online availability','Ouvrir la disponibilité en ligne'],
  'Compartir enlace y descargar PDF de disponibilidad':['Share link and download availability PDF','Partager le lien et télécharger le PDF de disponibilité'],
};
export function availabilityText(text:string,locale:Locale = 'es'):string {
  text = columnLabels[text] || text;
  if (locale === 'es') return text;
  if (copy[text]) return copy[text][locale==='en'?0:1];
  return text.replace(/^Entrega:/,locale==='en'?'Delivery:':'Livraison :').replace(/\bmeses\b/g,locale==='en'?'months':'mois').replace(/ · Datos /,locale==='en'?' · Data ':' · Données ');
}
export function availabilityDisclaimer(locale:Locale = 'es') {
  return locale==='en' ? 'This document reflects the data consulted when it was generated and may change without notice. This PDF does not guarantee that prices or availability will remain the same when you consult it. Contact an Osvaldo Bello advisor to validate and confirm current availability and conditions before reserving.' : locale==='fr' ? 'Ce document reflète les données consultées lors de sa génération et peut changer sans préavis. Ce PDF ne garantit pas que les prix ou la disponibilité restent identiques au moment de sa consultation. Contactez un conseiller Osvaldo Bello pour valider et confirmer la disponibilité et les conditions actualisées avant de réserver.' : 'La información refleja los datos consultados al generar este documento y puede cambiar sin previo aviso. Este PDF no garantiza que los precios ni la disponibilidad sean los mismos al momento de consultarlo. Consulte a un ejecutivo de Osvaldo Bello para validar y confirmar la disponibilidad y las condiciones actualizadas antes de reservar.';
}
