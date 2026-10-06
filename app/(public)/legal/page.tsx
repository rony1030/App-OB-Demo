
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';
import Link from 'next/link';

const sections = [
  { id: 'disclaimer', label: 'Disclaimer y responsabilidad' },
  { id: 'privacidad', label: 'Política de privacidad' },
  { id: 'cookies', label: 'Política de cookies' },
];

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#1b2b20]">
      <header className="border-b border-[#d9e3d2] bg-[#14291b] px-5 py-8 text-white sm:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#bad784]"><LocalizedText text={"OB Brokers Team"} /></p>
            <h1 className="mt-3 font-serif text-4xl tracking-[-.04em] sm:text-5xl"><LocalizedText text={"Información legal"} /></h1>
          </div>
          <Link href="/" className="rounded-full border border-white/25 px-4 py-2 text-xs font-bold text-white/80 transition hover:bg-white/10"><LocalizedText text={"Volver al portal"} /></Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-10 px-5 py-12 sm:px-10 lg:grid-cols-[220px_1fr]">
        <UITranslationBoundary attributes={["aria-label"]}><nav aria-label="Secciones legales" className="h-fit rounded-2xl border border-[#d9e3d2] bg-white p-4 lg:sticky lg:top-6">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6d8f3c]"><LocalizedText text={"Documentos"} /></p>
          <div className="mt-4 grid gap-2 text-sm font-semibold text-[#31583a]">
            {sections.map((section) => <a key={section.id} href={`#${section.id}`} className="rounded-xl px-3 py-2 transition hover:bg-[#edf4e5]">{section.label}</a>)}
          </div>
        </nav></UITranslationBoundary>

        <div className="space-y-8">
          <section id="disclaimer" className="scroll-mt-6 rounded-3xl border border-[#d9e3d2] bg-white p-6 shadow-sm sm:p-9">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#6d8f3c]"><LocalizedText text={"01 · Disclaimer"} /></p>
            <h2 className="mt-3 font-serif text-3xl text-[#24422b]"><LocalizedText text={"Presentación comercial y responsabilidad"} /></h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-[#536359]">
              <p><LocalizedText text={"Este sitio, sus landings, dossiers, propuestas, imágenes, planos, textos y demás materiales se presentan por autorización comercial de los desarrolladores, propietarios y/o titulares de las marcas correspondientes. Cada marca, nombre comercial, logotipo, imagen, plano, diseño, texto y material pertenece a su respectivo titular. La publicación de estos contenidos no transfiere propiedad intelectual ni crea una licencia distinta de la autorización comercial otorgada."} /></p>
              <p><LocalizedText text={"OB Brokers, osvaldobello.com y las agencias aliadas actúan únicamente como plataforma y canal de comercialización autorizado. El contenido tiene carácter informativo y comercial; no constituye una oferta irrevocable, promesa de venta, garantía de inversión, asesoría legal, financiera, fiscal o técnica, ni sustituye los documentos oficiales del desarrollador."} /></p>
              <p><LocalizedText text={"Precios, disponibilidad, metrajes, diseños, renders, planos, fechas de entrega, amenidades, rentabilidad, condiciones de pago, beneficios, permisos, terminaciones y cualquier otra característica pueden cambiar, estar sujetos a aprobación o contener diferencias respecto del material final. Todo dato debe ser confirmado directamente con el desarrollador antes de reservar, pagar o contratar."} /></p>
              <p><LocalizedText text={"La exactitud, ejecución y responsabilidad sobre el proyecto, la unidad, la construcción, los permisos, las entregas, las especificaciones y los servicios corresponde exclusivamente al desarrollador o proveedor responsable. OB Brokers, osvaldobello.com y las agencias aliadas no garantizan precios, disponibilidad, diseño, entrega, rentabilidad, resultados ni la permanencia de ninguna condición comercial."} /></p>
              <p><LocalizedText text={"El interesado debe realizar su propia revisión legal, financiera, técnica y contractual y consultar a sus asesores independientes. En caso de conflicto entre este material y un contrato, cotización oficial o documento emitido por el desarrollador, prevalecerá el documento oficial aplicable."} /></p>
            </div>
          </section>

          <section id="privacidad" className="scroll-mt-6 rounded-3xl border border-[#d9e3d2] bg-white p-6 shadow-sm sm:p-9">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#6d8f3c]"><LocalizedText text={"02 · Privacidad"} /></p>
            <h2 className="mt-3 font-serif text-3xl text-[#24422b]"><LocalizedText text={"Política de privacidad"} /></h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-[#536359]">
              <p><LocalizedText text={"Cuando una persona solicita información, acceso comercial, una visita o una propuesta, podemos tratar los datos que proporciona —como nombre, correo, teléfono, empresa, perfil profesional y mensaje— para atender la solicitud, coordinar comunicaciones y prestar los servicios comerciales solicitados."} /></p>
              <p><LocalizedText text={"Los datos se comparten únicamente con el personal, agencias aliadas, proveedores tecnológicos o responsables del proyecto que necesiten intervenir en la atención de la solicitud, respetando las obligaciones de confidencialidad y seguridad aplicables. No vendemos los datos personales."} /></p>
              <p><LocalizedText text={"Conservamos la información durante el tiempo necesario para gestionar la relación comercial, cumplir obligaciones aplicables, resolver incidencias y mantener registros de seguridad. La persona puede solicitar información sobre el tratamiento de sus datos, actualización o eliminación a través del canal oficial de contacto indicado en el sitio."} /></p>
              <p><LocalizedText text={"La persona debe proporcionar datos verdaderos y no enviar información sensible que no sea necesaria para la solicitud. El envío del formulario no garantiza aprobación, disponibilidad ni contratación."} /></p>
            </div>
          </section>

          <section id="cookies" className="scroll-mt-6 rounded-3xl border border-[#d9e3d2] bg-white p-6 shadow-sm sm:p-9">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#6d8f3c]"><LocalizedText text={"03 · Cookies"} /></p>
            <h2 className="mt-3 font-serif text-3xl text-[#24422b]"><LocalizedText text={"Política de cookies"} /></h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-[#536359]">
              <p><LocalizedText text={"Este sitio puede utilizar cookies y tecnologías similares para mantener sesiones, recordar preferencias, proteger formularios, medir el uso del sitio y mejorar la experiencia. Algunas cookies son necesarias para que el sitio funcione y otras dependen de servicios de terceros incorporados en determinadas páginas."} /></p>
              <p><LocalizedText text={"La persona puede bloquear o eliminar cookies desde la configuración de su navegador. Al hacerlo, algunas funciones —como el inicio de sesión, preferencias o formularios— podrían no funcionar correctamente."} /></p>
              <p><LocalizedText text={"Las tecnologías de terceros se rigen también por las políticas de sus respectivos proveedores. Esta página se actualizará cuando cambien las herramientas, finalidades o proveedores utilizados."} /></p>
            </div>
          </section>

          <p className="text-xs leading-5 text-[#718078]"><LocalizedText text={"Última actualización: septiembre de 2026."} /></p>
        </div>
      </div>
    </main>
  );
}
