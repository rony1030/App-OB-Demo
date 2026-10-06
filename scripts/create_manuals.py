from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether

OUT = Path('output/pdf')
OUT.mkdir(parents=True, exist_ok=True)

NAVY = colors.HexColor('#0B173D')
BLUE = colors.HexColor('#2563EB')
GOLD = colors.HexColor('#C9A227')
INK = colors.HexColor('#172033')
MUTED = colors.HexColor('#5C687A')
LINE = colors.HexColor('#DDE4EE')
PALE = colors.HexColor('#F5F8FC')

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='CoverKicker', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=BLUE, alignment=TA_CENTER, spaceAfter=12, uppercase=True))
styles.add(ParagraphStyle(name='CoverTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=27, leading=32, textColor=NAVY, alignment=TA_CENTER, spaceAfter=14))
styles.add(ParagraphStyle(name='CoverSub', parent=styles['Normal'], fontName='Helvetica', fontSize=12, leading=18, textColor=MUTED, alignment=TA_CENTER, spaceAfter=24))
styles.add(ParagraphStyle(name='H1Manual', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=19, leading=24, textColor=NAVY, spaceBefore=6, spaceAfter=10))
styles.add(ParagraphStyle(name='H2Manual', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=13, leading=17, textColor=NAVY, spaceBefore=10, spaceAfter=6))
styles.add(ParagraphStyle(name='BodyManual', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.5, leading=14, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle(name='SmallManual', parent=styles['BodyText'], fontName='Helvetica', fontSize=8, leading=11, textColor=MUTED, spaceAfter=4))
styles.add(ParagraphStyle(name='Step', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.5, leading=14, textColor=INK, leftIndent=10, firstLineIndent=-10, spaceAfter=6))
styles.add(ParagraphStyle(name='Callout', parent=styles['BodyText'], fontName='Helvetica-Bold', fontSize=9, leading=13, textColor=NAVY, spaceAfter=4))

def P(text, style='BodyManual'):
    return Paragraph(text, styles[style])

def steps(items):
    return [P(f'<b>{i + 1}.</b> {item}', 'Step') for i, item in enumerate(items)]

def note(title, text, color=colors.HexColor('#EAF2FF')):
    table = Table([[P(title, 'Callout')], [P(text, 'SmallManual')]], colWidths=[170 * mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), color),
        ('BOX', (0, 0), (-1, -1), 0.6, LINE),
        ('LINEBEFORE', (0, 0), (0, -1), 3, BLUE),
        ('LEFTPADDING', (0, 0), (-1, -1), 11),
        ('RIGHTPADDING', (0, 0), (-1, -1), 11),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    return table

def checklist(items):
    data = [[P('<b>Verificacion</b>', 'SmallManual')], *[[P(f'- {item}', 'SmallManual')] for item in items]]
    table = Table(data, colWidths=[170 * mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PALE), ('BOX', (0, 0), (-1, -1), 0.6, LINE),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    return table

def footer(canvas, doc, short_title):
    canvas.saveState()
    w, h = A4
    canvas.setStrokeColor(LINE)
    canvas.line(20 * mm, 15 * mm, w - 20 * mm, 15 * mm)
    canvas.setFont('Helvetica-Bold', 7.5)
    canvas.setFillColor(NAVY)
    canvas.drawString(20 * mm, 10 * mm, 'OB Brokers Team')
    canvas.setFont('Helvetica', 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(w - 20 * mm, 10 * mm, f'{short_title}  |  Pagina {doc.page}')
    canvas.restoreState()

def cover(title, subtitle, audience):
    return [Spacer(1, 33 * mm), P('MANUAL OPERATIVO', 'CoverKicker'), P(title, 'CoverTitle'), P(subtitle, 'CoverSub'),
            Table([[P(audience, 'SmallManual')]], colWidths=[100 * mm], hAlign='CENTER', style=TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), PALE), ('BOX', (0, 0), (-1, -1), 0.7, LINE),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('TOPPADDING', (0, 0), (-1, -1), 12), ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ])), Spacer(1, 80 * mm), P('Version 1.0 | Septiembre 2026', 'SmallManual'), PageBreak()]

def build_agency():
    story = cover('Agencias y agentes', 'Guia para crear, configurar y administrar una agencia dentro del CRM.', 'Para administradores de agencia y responsables comerciales')
    story += [P('Como usar este manual', 'H1Manual'), P('Este manual explica las tareas que debe realizar una agencia para quedar lista para trabajar: registrar sus datos, crear agentes, asignar proyectos y controlar accesos. El agente recibe una experiencia simple; la configuracion detallada queda bajo responsabilidad del administrador.', 'BodyManual'), note('Regla principal', 'Crea primero la agencia, luego configura la identidad comercial y finalmente agrega los agentes. No asignes permisos amplios antes de comprobar que el usuario pertenece a la agencia correcta.'), P('1. Crear una agencia', 'H1Manual'), P('La agencia representa la empresa que trabajara con el Master Broker. Sus datos se utilizan en reportes, documentos, propuestas y comunicaciones comerciales.', 'BodyManual')]
    story += steps(['Entra al CRM con una cuenta con permisos de administracion.', 'Abre Administracion y selecciona Agencias o Brokers.', 'Pulsa Crear agencia.', 'Escribe el nombre comercial, nombre legal si aplica, correo general, telefono y zona de operacion.', 'Revisa que el estado quede Activa y guarda.'])
    story += [P('Datos recomendados', 'H2Manual'), checklist(['Usar el nombre comercial que reconocen los agentes.', 'Colocar un correo que la agencia revise con frecuencia.', 'Usar un telefono de contacto real.', 'Completar logo y datos de marca antes de crear documentos comerciales.']), PageBreak(), P('2. Configurar la agencia', 'H1Manual'), P('La configuracion define como aparece la agencia en propuestas, dossiers y comunicaciones. Mantenerla actualizada evita documentos con logos, nombres o datos antiguos.', 'BodyManual')]
    story += steps(['Abre la ficha de la agencia y selecciona Configuracion o Marca.', 'Carga el logo principal en buena resolucion y revisa que se lea sobre fondo claro.', 'Completa colores, nombre de contacto y datos publicos.', 'Define el correo operativo para recibir solicitudes y avisos.', 'Guarda y abre una vista previa antes de usar la marca en una propuesta.'])
    story += [P('3. Crear agentes', 'H1Manual'), P('Cada vendedor debe tener su propio usuario. Esto permite atribuir clientes, propuestas, negociaciones y comisiones sin mezclar actividades.', 'BodyManual')]
    story += steps(['Ve a Administracion > Usuarios.', 'Pulsa Invitar usuario o Crear usuario.', 'Escribe nombre completo, correo y telefono.', 'Selecciona Vendedor / Asesor Inmobiliario para un agente comercial.', 'Marca solo los proyectos que puede vender y guarda.', 'Envia la invitacion y confirma que el agente complete su perfil.'])
    story += [note('Perfil del agente', 'El agente debe mantener actualizados su nombre, foto, telefono, correo y cargo comercial. El cargo puede ser personalizado, pero debe ser breve y profesional porque aparece en documentos y contactos.', colors.HexColor('#FFF9E8')), PageBreak(), P('4. Asignar proyectos y permisos', 'H1Manual'), P('El acceso a un proyecto debe corresponder a un acuerdo comercial vigente. Asignar un proyecto no convierte al agente en administrador; solo le permite trabajar dentro del alcance autorizado.', 'BodyManual')]
    story += steps(['Abre Administracion > Usuarios y selecciona el agente.', 'En Proyectos autorizados, marca los proyectos permitidos.', 'Comprueba el nivel de acceso antes de guardar.', 'Usa el rol de Administrador de Agencia solo para personas que gestionan equipo y datos de la agencia.', 'Usa Soporte de Agencia cuando la persona necesite ayudar con operaciones sin administrar toda la agencia.'])
    story += [P('5. Agregar o retirar responsables', 'H1Manual'), P('Los responsables reciben avisos operativos y dan seguimiento a solicitudes. Antes de retirarlos, agrega un reemplazo para no dejar comunicaciones sin atender.', 'BodyManual')]
    story += steps(['Entra en la configuracion de notificaciones de la agencia o del proyecto.', 'Agrega cada correo en una linea y guarda.', 'Para retirar un responsable, elimina su correo y guarda de nuevo.', 'Si la persona deja la agencia, suspende su usuario y revisa sus proyectos autorizados.', 'Conserva el historial de negociaciones y propuestas; retirar acceso no debe borrar la trazabilidad.'])
    story += [P('6. Desactivar o eliminar', 'H1Manual'), P('Se recomienda suspender antes que eliminar. Suspender bloquea el acceso y conserva la historia. La eliminacion solo debe usarse cuando la politica interna y la trazabilidad lo permitan.', 'BodyManual'), checklist(['Antes de suspender, reasigna clientes y negociaciones activas.', 'Retira proyectos autorizados.', 'Confirma que otro responsable recibe los avisos.', 'No borres una agencia con operaciones pendientes sin revisar el impacto legal y comercial.']), PageBreak(), P('Flujo diario recomendado', 'H1Manual'), P('La agencia trabaja con un flujo corto para que el agente solo tenga que seleccionar, completar y compartir.', 'BodyManual')]
    story += steps(['Registrar o seleccionar el cliente en el CRM.', 'Elegir proyecto y unidad disponible.', 'Generar propuesta o plan de pagos con datos oficiales.', 'Registrar la negociacion y su siguiente actividad.', 'Solicitar reserva solo cuando exista una intencion real y documentada.', 'Actualizar el estado hasta cierre, perdida o pausa.'])
    story += [note('Errores que deben evitarse', 'Crear usuarios duplicados, compartir cuentas, dar acceso a todos los proyectos sin necesidad, cambiar precios manualmente y eliminar registros para corregir un error.'), P('Lista final de puesta en marcha', 'H1Manual'), checklist(['Agencia activa y datos correctos.', 'Logo y marca revisados.', 'Correo operativo confirmado.', 'Agentes invitados y perfiles completos.', 'Proyectos autorizados individualmente.', 'Responsables de notificacion probados.', 'Primer flujo de propuesta verificado.'])]
    doc = SimpleDocTemplate(str(OUT / 'Manual_Agencias_y_Agentes_OB_Brokers.pdf'), pagesize=A4, rightMargin=20 * mm, leftMargin=20 * mm, topMargin=18 * mm, bottomMargin=22 * mm, title='Manual de Agencias y Agentes')
    doc.build(story, onFirstPage=lambda c, d: footer(c, d, 'Agencias y agentes'), onLaterPages=lambda c, d: footer(c, d, 'Agencias y agentes'))

def build_master():
    story = cover('Master Brokers y desarrolladoras', 'Guia para crear el Master Broker, publicar propiedades y controlar responsables, accesos y resultados.', 'Para administradores Master Broker, operaciones y equipos de desarrolladora')
    story += [P('Objetivo del manual', 'H1Manual'), P('El Master Broker es el centro de coordinacion comercial entre la desarrolladora, las agencias y los agentes. Este manual explica como organizar esa relacion sin perder control sobre inventario, negociaciones, pagos y responsabilidades.', 'BodyManual'), note('Principio de seguridad', 'Cada proyecto debe tener un propietario claro, responsables definidos y permisos limitados. La desarrolladora puede consultar sus datos sin recibir permisos de administracion del CRM.'), P('1. Crear el Master Broker', 'H1Manual')]
    story += steps(['Entra con una cuenta de administracion de plataforma.', 'Abre Administracion > Brokers y pulsa Crear organizacion.', 'Selecciona el tipo Master Broker.', 'Completa nombre comercial, datos legales, correo, telefono y slug interno.', 'Crea o invita al administrador principal.', 'Confirma que la organizacion quede activa antes de cargar proyectos.'])
    story += [P('2. Configurar el Master Broker', 'H1Manual'), P('La configuracion del Master Broker controla la identidad que veran agencias y agentes y los canales donde llegan avisos.', 'BodyManual')]
    story += steps(['Carga logo, colores y datos de contacto.', 'Define el correo principal y los correos operativos.', 'Configura roles para administrador y operaciones.', 'Revisa politicas de propuestas, reservas, documentos y comisiones.', 'Prueba una vista de agente para comprobar que solo aparecen proyectos autorizados.'])
    story += [PageBreak(), P('3. Subir un proyecto', 'H1Manual'), P('Cada proyecto debe tener una ficha oficial y una fuente de inventario confiable. La calidad de la propuesta depende de que nombre, precios, unidades, imagenes y fechas esten actualizados.', 'BodyManual')]
    story += steps(['Ve a Administracion > Proyectos y selecciona Nuevo proyecto.', 'Indica nombre oficial, desarrolladora, ubicacion, zona, etapa, entrega y moneda.', 'Carga la portada y la galeria en buena resolucion.', 'Registra tipologias, areas, habitaciones, banos, parqueos y precios.', 'Carga o conecta la fuente de inventario autorizada.', 'Configura plan de pagos y condiciones comerciales.', 'Publica solo despues de revisar la ficha publica y la disponibilidad.'])
    story += [P('Tipologias y disponibilidad', 'H2Manual'), P('La tipologia es el modelo comercial; la unidad es el inventario concreto. Una tipologia puede aparecer en la landing y tambien debe estar configurada en el editor para poder editar nombre, imagen, metraje y caracteristicas.', 'BodyManual'), checklist(['No mezclar tipologias entre proyectos.', 'Verificar que cada precio tenga moneda.', 'Revisar que la unidad tenga estado y visibilidad correctos.', 'No marcar como vendida una unidad solo porque la desarrolladora la retiro externamente.']), PageBreak(), P('4. Responsables por proyecto', 'H1Manual'), P('Los responsables son las personas u organizaciones encargadas de revisar, responder y dar seguimiento. Puede existir un responsable principal y responsables operativos.', 'BodyManual')]
    story += steps(['Abre el proyecto y entra en Proceso de reserva o Responsables.', 'Selecciona el Master Broker responsable del proyecto.', 'Agrega responsables operativos por correo o por usuario del CRM.', 'Marca un responsable principal cuando el flujo necesite una persona de referencia.', 'Define fechas de inicio y fin si la responsabilidad es temporal.', 'Guarda y realiza una prueba enviando una solicitud de información.'])
    story += [note('Importante sobre ventas externas', 'Una unidad marcada como vendida por una fuente externa no debe contarse como venta del Master Broker. Para atribuir una venta al CRM debe existir una negociacion, reserva, pago o venta registrada y vinculada a cliente, unidad y responsable.', colors.HexColor('#FFF9E8')), P('5. Acceso para la desarrolladora', 'H1Manual'), P('La desarrolladora puede tener una o varias personas con acceso de consulta a sus propios proyectos. El acceso debe limitarse a la informacion necesaria: inventario, negociaciones, pagos y reportes autorizados.', 'BodyManual')]
    story += steps(['Crea o selecciona la organizacion de tipo Desarrolladora.', 'Invita a cada persona con su correo individual.', 'Asigna Desarrollador Admin solo a quien deba gestionar proyectos y datos autorizados.', 'Asigna Consulta Desarrollador a quien solo necesite ver informacion.', 'Vincula el usuario a los proyectos de esa desarrolladora.', 'Comprueba que no vea proyectos de otra desarrolladora ni datos de otras organizaciones.'])
    story += [P('6. Reportes y operaciones', 'H1Manual'), P('El sistema debe distinguir entre inventario, actividad comercial y cierre comprobado.', 'BodyManual')]
    report_table = Table([[P('<b>Vista</b>', 'SmallManual'), P('<b>Que debe mostrar</b>', 'SmallManual'), P('<b>Evidencia</b>', 'SmallManual')], [P('Negociaciones en proceso', 'SmallManual'), P('Oportunidades activas, etapa, cliente, unidad y responsable.', 'SmallManual'), P('Registro de oportunidad y actividades.', 'SmallManual')], [P('Reservas', 'SmallManual'), P('Solicitud, estado, unidad y comprobantes.', 'SmallManual'), P('Reserva y pago relacionado.', 'SmallManual')], [P('Ventas completadas', 'SmallManual'), P('Venta cerrada, precio, cliente y unidad.', 'SmallManual'), P('Venta registrada y fecha de cierre.', 'SmallManual')], [P('Comisiones y pagos', 'SmallManual'), P('Importes, estado, factura o confirmacion.', 'SmallManual'), P('Registro financiero vinculado.', 'SmallManual')]], colWidths=[42 * mm, 76 * mm, 52 * mm])
    report_table.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), PALE), ('GRID', (0, 0), (-1, -1), 0.4, LINE), ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 7), ('RIGHTPADDING', (0, 0), (-1, -1), 7), ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7)]))
    story += [report_table, PageBreak(), P('7. Agregar o retirar responsables y accesos', 'H1Manual')]
    story += steps(['Antes de retirar a una persona, identifica negociaciones y tareas que tenga asignadas.', 'Asigna un reemplazo y comprueba que reciba las notificaciones.', 'Suspende el usuario cuando necesites conservar el historial.', 'Retira el proyecto o la capacidad concreta que ya no corresponda.', 'Revisa reportes y auditoria para confirmar que la historia permanece intacta.', 'Elimina solo datos duplicados o creados por error y con autorizacion.'])
    story += [P('8. Operacion recomendada del Master Broker', 'H1Manual'), P('El Master Broker debe trabajar con controles simples pero constantes:', 'BodyManual')]
    story += steps(['Revisar inventario y precios antes de habilitarlos.', 'Mantener tipologias, imagenes y condiciones actualizadas.', 'Revisar negociaciones activas y su proxima actividad.', 'Confirmar reservas y pagos con evidencia.', 'Cerrar ventas solo cuando la operacion este registrada en el CRM.', 'Compartir reportes con la desarrolladora segun sus permisos.', 'Auditar mensualmente responsables, accesos y proyectos visibles.'])
    story += [note('Regla de atribucion', 'El CRM puede demostrar lo que se trabajo dentro de la plataforma. Una venta externa puede mantenerse como dato de disponibilidad o estado operativo, pero no debe sumarse a las ventas, negociaciones o comisiones generadas por el Master Broker.'), P('Lista final de control', 'H1Manual'), checklist(['Master Broker activo y configurado.', 'Desarrolladora vinculada al proyecto correcto.', 'Responsable principal y operativos definidos.', 'Usuarios de desarrolladora con permisos limitados.', 'Inventario y tipologias verificados.', 'Negociaciones y reservas con evidencia.', 'Reportes de pagos y ventas revisados.', 'Accesos retirados cuando dejan de ser necesarios.'])]
    doc = SimpleDocTemplate(str(OUT / 'Manual_Master_Brokers_y_Desarrolladoras_OB_Brokers.pdf'), pagesize=A4, rightMargin=20 * mm, leftMargin=20 * mm, topMargin=18 * mm, bottomMargin=22 * mm, title='Manual de Master Brokers y Desarrolladoras')
    doc.build(story, onFirstPage=lambda c, d: footer(c, d, 'Master Brokers y desarrolladoras'), onLaterPages=lambda c, d: footer(c, d, 'Master Brokers y desarrolladoras'))

if __name__ == '__main__':
    build_agency()
    build_master()
    print('PDF manuals created')
