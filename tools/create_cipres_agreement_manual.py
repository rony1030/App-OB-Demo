from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


OUTPUT = Path("output/pdf/manual-acuerdo-cipres-para-agencia.pdf")


def p(text, style):
    return Paragraph(text, style)


def step(number, title, body, styles):
    return KeepTogether([
        Table([[p(str(number), styles["stepNumber"]), p(f"<b>{title}</b><br/>{body}", styles["body"])]], colWidths=[11 * mm, 150 * mm], style=TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#0B1B4D")),
            ("TEXTCOLOR", (0, 0), (0, 0), colors.white),
            ("BOX", (0, 0), (0, 0), 0.5, colors.HexColor("#0B1B4D")),
            ("LEFTPADDING", (0, 0), (0, 0), 0),
            ("RIGHTPADDING", (0, 0), (0, 0), 0),
            ("TOPPADDING", (0, 0), (0, 0), 0),
            ("BOTTOMPADDING", (0, 0), (0, 0), 0),
            ("LEFTPADDING", (1, 0), (1, 0), 10),
            ("TOPPADDING", (1, 0), (1, 0), 2),
            ("BOTTOMPADDING", (1, 0), (1, 0), 8),
        ])),
        Spacer(1, 5 * mm),
    ])


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#D7DFEC"))
    canvas.line(18 * mm, 14 * mm, 192 * mm, 14 * mm)
    canvas.setFillColor(colors.HexColor("#50627E"))
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(18 * mm, 9 * mm, "OB Brokers Team | Guia operativa de acuerdos")
    canvas.drawRightString(192 * mm, 9 * mm, f"Pagina {doc.page}")
    canvas.restoreState()


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT), pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=18 * mm, bottomMargin=22 * mm,
        title="Manual: acuerdo de colaboracion Cipres",
        author="OB Brokers Team",
    )
    sample = getSampleStyleSheet()
    styles = {
        "kicker": ParagraphStyle("kicker", parent=sample["Normal"], fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=colors.HexColor("#2473E8"), spaceAfter=4),
        "title": ParagraphStyle("title", parent=sample["Title"], fontName="Helvetica-Bold", fontSize=27, leading=31, textColor=colors.HexColor("#0B1B4D"), spaceAfter=8),
        "subtitle": ParagraphStyle("subtitle", parent=sample["Normal"], fontName="Helvetica", fontSize=11, leading=17, textColor=colors.HexColor("#50627E"), spaceAfter=14),
        "h2": ParagraphStyle("h2", parent=sample["Heading2"], fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=colors.HexColor("#0B1B4D"), spaceBefore=5, spaceAfter=8),
        "body": ParagraphStyle("body", parent=sample["BodyText"], fontName="Helvetica", fontSize=9.5, leading=14, textColor=colors.HexColor("#283A56")),
        "small": ParagraphStyle("small", parent=sample["BodyText"], fontName="Helvetica", fontSize=8.5, leading=12, textColor=colors.HexColor("#50627E")),
        "stepNumber": ParagraphStyle("stepNumber", parent=sample["Normal"], alignment=TA_CENTER, fontName="Helvetica-Bold", fontSize=11, leading=11, textColor=colors.white),
        "callout": ParagraphStyle("callout", parent=sample["BodyText"], fontName="Helvetica-Bold", fontSize=9.5, leading=14, textColor=colors.HexColor("#0B1B4D")),
    }
    story = []
    story += [
        p("OB BROKERS TEAM | ADMINISTRACION", styles["kicker"]),
        p("Como crear y firmar el acuerdo de Cipres", styles["title"]),
        p("Guia para habilitar a la administradora de una agencia externa y permitirle trabajar el proyecto Cipres Residences con trazabilidad.", styles["subtitle"]),
        Table([[p("Resultado esperado", styles["callout"]), p("La agencia queda vinculada por un acuerdo especifico de Cipres, la administradora firma desde su cuenta y puede reportar las ventas en proceso segun los permisos asignados.", styles["body"])]], colWidths=[41 * mm, 115 * mm], style=TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#E7F0FF")),
            ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#F7FAFE")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#C8D8F2")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ])),
        Spacer(1, 11 * mm),
        p("Antes de empezar", styles["h2"]),
        p("No emitas el acuerdo desde Bello Valdez Enterprise para Verónica. Primero debe existir su propia agencia. Un administrador de agencia siempre pertenece a una agencia independiente; nunca debe heredar la organizacion activa del administrador que la crea.", styles["body"]),
        Spacer(1, 6 * mm),
        Table([
            [p("Necesitas", styles["callout"]), p("Preparar", styles["callout"])],
            [p("Nombre legal o comercial de la agencia de Verónica", styles["body"]), p("RNC, domicilio legal y datos del representante, si aplican", styles["body"])],
            [p("Correo de Verónica y rol: Administradora de Agencia", styles["body"]), p("Documentos corporativos requeridos y sus fechas de vencimiento", styles["body"])],
            [p("Acceso al proyecto Cipres Residences", styles["body"]), p("Comision, forma de pago y vigencia del acuerdo", styles["body"])],
        ], colWidths=[78 * mm, 78 * mm], style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0B1B4D")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D7DFEC")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ])),
        PageBreak(),
        p("FLUJO DE ALTA", styles["kicker"]),
        p("1. Crear la agencia y a Verónica", styles["h2"]),
        step(1, "Crear o seleccionar la agencia", "En <b>Panel de plataforma > Usuarios y acceso</b>, selecciona <b>Administrador de Agencia</b>. El sistema debe pedir el nombre de la agencia o permitir seleccionar una agencia existente. Para Verónica, crea o selecciona solamente su propia agencia; no Bello Valdez Enterprise.", styles),
        step(2, "Crear la cuenta", "Elige <b>Enviar activacion</b> para que reciba un enlace seguro, o <b>Crear sin correo</b> si le entregarás una clave temporal por un canal seguro. La primera vez que inicie sesion debe cambiar la contraseña.", styles),
        step(3, "Completar la marca de la agencia", "Con la sesión de Verónica, entra en <b>Mi marca</b> o <b>Configuracion de Agencia</b> y registra logo, nombre comercial, datos de contacto, RNC, domicilio y documentos. Esta informacion pertenece a su agencia y no se mezcla con la de OB o Bello Valdez.", styles),
        step(4, "Dar acceso a Cipres", "En Usuarios y acceso, marca <b>Cipres Residences</b> en Proyectos autorizados. Conserva el acceso minimo necesario para que pueda registrar y dar seguimiento a sus oportunidades de venta.", styles),
        Spacer(1, 5 * mm),
        p("Control importante", styles["h2"]),
        p("El historial debe conservar la creacion, cambios de acceso, documentos y firma. Si algun documento vence o falta, el sistema debe bloquear el boton de firmar y mostrar exactamente cual requisito debe corregirse.", styles["body"]),
        PageBreak(),
        p("ACUERDO DE CIPRES", styles["kicker"]),
        p("2. Emitir el acuerdo especifico", styles["h2"]),
        step(1, "Abrir Acuerdos", "Desde el modo de administracion, abre <b>Acuerdos</b> y usa <b>Emitir acuerdo de colaboracion</b>.", styles),
        step(2, "Seleccionar a la contraparte", "En Organización del broker selecciona la agencia de Verónica. Luego elige a Verónica como Firmante. Si no aparece, revisa que su cuenta este activa y que sea Administradora de Agencia.", styles),
        step(3, "Definir el alcance", "Selecciona <b>Especifico de proyecto</b> y elige <b>Cipres Residences</b>. Usa General solamente cuando la agencia pueda trabajar toda la red de proyectos, no para este caso.", styles),
        step(4, "Completar las condiciones", "Indica la vigencia en meses, la comision, como se paga la comision y los datos legales del contrato. La vigencia debe coincidir con el acuerdo comercial de Cipres, por ejemplo 1, 2, 3, 6 o 12 meses.", styles),
        step(5, "Crear el acuerdo", "Presiona <b>Crear acuerdo</b>. El estado inicial queda pendiente de firma. Verifica en la lista que el proyecto, agencia, firmante y vigencia sean correctos antes de continuar.", styles),
        Spacer(1, 5 * mm),
        Table([[p("No firmar todavia si", styles["callout"]), p("Falta un documento requerido, hay un documento vencido, el firmante no es la administradora correcta, o las condiciones de comision/vigencia aun no estan confirmadas.", styles["body"])]], colWidths=[42 * mm, 114 * mm], style=TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#FFF2D8")),
            ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#FFF9ED")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#F5C56B")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ])),
        PageBreak(),
        p("FIRMA Y OPERACION", styles["kicker"]),
        p("3. Firma, comprobacion y reporte de ventas", styles["h2"]),
        step(1, "Completar y guardar", "Verónica abre el acuerdo desde Acuerdos o Mis documentos. Puede completar los campos preparados, adjuntar los documentos pendientes y usar <b>Guardar borrador</b> mientras reune requisitos.", styles),
        step(2, "Firmar y sellar", "Cuando todos los documentos requeridos esten vigentes, presiona <b>Firmar y sellar</b>. El sistema registra fecha, hora, firmante y la version firmada. Debe generarse el PDF final y enviarse a los correos configurados para acuerdos.", styles),
        step(3, "Verificar vigencia", "Confirma que el acuerdo quede como <b>Firmado</b>, con fecha de vencimiento visible. El sistema debe alertar antes del vencimiento y bloquear nueva operacion cuando venza, segun la politica definida.", styles),
        step(4, "Reportar ventas en proceso", "Con el acuerdo de Cipres firmado y el acceso al proyecto activo, Verónica puede crear o actualizar leads, registrar propuestas y dar seguimiento a las ventas. Cada movimiento debe conservar usuario, fecha, estado anterior y estado nuevo.", styles),
        Spacer(1, 7 * mm),
        p("Lista final de comprobacion", styles["h2"]),
    ]
    checks = [
        "La agencia de Verónica es independiente y tiene sus propios datos de marca.",
        "Verónica tiene rol Administradora de Agencia y acceso a Cipres Residences.",
        "El acuerdo es Especifico de proyecto: Cipres Residences.",
        "La comision, forma de pago y vigencia fueron revisadas.",
        "Los documentos requeridos estan aprobados y no vencidos.",
        "El PDF firmado fue recibido por los destinatarios de acuerdos y quedo en el historial.",
        "Las ventas en proceso se registran como leads y oportunidades dentro de Cipres.",
    ]
    for item in checks:
        story.append(Table([[p("OK", styles["stepNumber"]), p(item, styles["body"])]], colWidths=[9 * mm, 147 * mm], style=TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#18794E")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (0, 0), 0),
            ("RIGHTPADDING", (0, 0), (0, 0), 0),
            ("TOPPADDING", (0, 0), (0, 0), 0),
            ("BOTTOMPADDING", (0, 0), (0, 0), 0),
            ("LEFTPADDING", (1, 0), (1, 0), 8),
            ("TOPPADDING", (1, 0), (1, 0), 4),
            ("BOTTOMPADDING", (1, 0), (1, 0), 4),
            ("LINEBELOW", (1, 0), (1, 0), 0.35, colors.HexColor("#D7DFEC")),
        ])))
    story.append(Spacer(1, 6 * mm))
    story.append(p("Nota: este manual refleja el flujo que el sistema debe aplicar. El alta de Administrador de Agencia se corregira para exigir la agencia antes de crear la cuenta, evitando que una administradora herede la organizacion activa equivocada.", styles["small"]))
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


if __name__ == "__main__":
    build()
