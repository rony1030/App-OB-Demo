import os
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUTPUT_PDF = Path("output/pdf/modelo-acuerdo-colaboracion-cipres-residences.pdf")

NAVY = colors.HexColor("#081339")
BLUE_ACCENT = colors.HexColor("#1A365D")
GOLD = colors.HexColor("#B58726")
DARK_GRAY = colors.HexColor("#2D3748")
LIGHT_GRAY = colors.HexColor("#718096")
BG_CARD = colors.HexColor("#F8FAFC")
BORDER_COLOR = colors.HexColor("#E2E8F0")

def p(text, style):
    return Paragraph(text, style)

def header_footer(canvas, doc):
    canvas.saveState()
    # Top decorative line
    canvas.setStrokeColor(NAVY)
    canvas.setLineWidth(2)
    canvas.line(18 * mm, 268 * mm, 198 * mm, 268 * mm)
    
    # Top running header
    canvas.setFont("Helvetica-Bold", 7.5)
    canvas.setFillColor(NAVY)
    canvas.drawString(18 * mm, 271 * mm, "BELLO VALDEZ ENTERPRISE | MASTER BROKER OFICIAL")
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(LIGHT_GRAY)
    canvas.drawRightString(198 * mm, 271 * mm, "MODELO DE ACUERDO DE COLABORACIÓN COMERCIAL")
    
    # Bottom footer line
    canvas.setStrokeColor(BORDER_COLOR)
    canvas.setLineWidth(0.75)
    canvas.line(18 * mm, 15 * mm, 198 * mm, 15 * mm)
    
    # Bottom footer text
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(LIGHT_GRAY)
    canvas.drawString(18 * mm, 10 * mm, "Proyecto: Cipres Residences • Vigencia: 1 Año • Confidencial")
    canvas.drawRightString(198 * mm, 10 * mm, f"Página {doc.page}")
    canvas.restoreState()

def build_pdf():
    OUTPUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=letter,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=22 * mm,
        bottomMargin=20 * mm,
        title="Modelo de Acuerdo de Colaboración - Cipres Residences",
        author="Bello Valdez Enterprise",
    )

    sample = getSampleStyleSheet()
    
    styles = {
        "docTitle": ParagraphStyle("docTitle", parent=sample["Title"], fontName="Helvetica-Bold", fontSize=14, leading=18, textColor=NAVY, alignment=TA_CENTER, spaceAfter=4),
        "docSubtitle": ParagraphStyle("docSubtitle", parent=sample["Normal"], fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=GOLD, alignment=TA_CENTER, spaceAfter=14),
        "sectionHeading": ParagraphStyle("sectionHeading", parent=sample["Heading2"], fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=NAVY, spaceBefore=8, spaceAfter=4),
        "body": ParagraphStyle("body", parent=sample["BodyText"], fontName="Helvetica", fontSize=8.5, leading=12.5, textColor=DARK_GRAY, alignment=TA_JUSTIFY, spaceAfter=5),
        "bodyBold": ParagraphStyle("bodyBold", parent=sample["BodyText"], fontName="Helvetica-Bold", fontSize=8.5, leading=12.5, textColor=NAVY, spaceAfter=5),
        "bulletText": ParagraphStyle("bulletText", parent=sample["BodyText"], fontName="Helvetica", fontSize=8.2, leading=11.5, textColor=DARK_GRAY, alignment=TA_JUSTIFY),
        "calloutHeader": ParagraphStyle("calloutHeader", parent=sample["Normal"], fontName="Helvetica-Bold", fontSize=9, leading=11, textColor=NAVY),
        "calloutText": ParagraphStyle("calloutText", parent=sample["Normal"], fontName="Helvetica", fontSize=8, leading=11, textColor=DARK_GRAY),
        "tableHeader": ParagraphStyle("tableHeader", parent=sample["Normal"], fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=colors.white, alignment=TA_CENTER),
        "tableCell": ParagraphStyle("tableCell", parent=sample["Normal"], fontName="Helvetica", fontSize=8, leading=10.5, textColor=DARK_GRAY),
        "tableCellBold": ParagraphStyle("tableCellBold", parent=sample["Normal"], fontName="Helvetica-Bold", fontSize=8, leading=10.5, textColor=NAVY),
        "tableCellCenter": ParagraphStyle("tableCellCenter", parent=sample["Normal"], fontName="Helvetica", fontSize=8, leading=10.5, textColor=DARK_GRAY, alignment=TA_CENTER),
        "signLabel": ParagraphStyle("signLabel", parent=sample["Normal"], fontName="Helvetica-Bold", fontSize=7.5, leading=9.5, textColor=NAVY, alignment=TA_CENTER),
        "signText": ParagraphStyle("signText", parent=sample["Normal"], fontName="Helvetica", fontSize=7.5, leading=9.5, textColor=DARK_GRAY, alignment=TA_CENTER),
    }

    story = []

    # Title & Header banner
    story.append(p("ACUERDO DE COLABORACIÓN Y AUTORIZACIÓN DE VENTAS", styles["docTitle"]))
    story.append(p("MODELO OFICIAL DE INTERMEDIACIÓN INMOBILIARIA · PROYECTO CIPRES RESIDENCES", styles["docSubtitle"]))
    story.append(Spacer(1, 2 * mm))

    # Comparecencia de las partes
    intro_text = (
        "<b>DE UNA PARTE:</b> La sociedad mercantil <b>BELLO VALDEZ ENTERPRISE, S.R.L.</b>, "
        "sociedad organizada y existente de conformidad con las leyes de la República Dominicana, "
        "titular del Registro Nacional de Contribuyentes (RNC) N.º <b>[RNC BELLO VALDEZ]</b>, "
        "con su domicilio social y oficinas principales ubicadas en <b>[DOMICILIO SOCIAL BELLO VALDEZ]</b>, "
        "República Dominicana, debidamente representada para los fines del presente acto por su Gerente / Representante Legal, "
        "el señor <b>[REPRESENTANTE LEGAL]</b>, de nacionalidad dominicana, mayor de edad, portador de la Cédula de Identidad y Electoral "
        "N.º <b>[CÉDULA REPRESENTANTE]</b>; quien en lo que sigue del presente acto se denominará <b>EL MASTER BRÓKER</b>, o por su razón social completa; y"
    )
    story.append(p(intro_text, styles["body"]))

    intro_broker = (
        "<b>DE LA OTRA PARTE:</b> La sociedad / entidad comercial <b>[NOMBRE LEGAL DE LA AGENCIA / EMPRESA COLABORADORA]</b>, "
        "sociedad debidamente constituida bajo las leyes de la República Dominicana, titular del RNC N.º <b>[RNC SUB-BRÓKER]</b>, "
        "con domicilio social en <b>[DOMICILIO SOCIAL SUB-BRÓKER]</b>, debidamente representada por su Representante Legal / Director Comercial, "
        "el(la) señor(a) <b>[NOMBRE DEL REPRESENTANTE DE LA AGENCIA]</b>, mayor de edad, portador(a) de la Cédula de Identidad y Electoral / Pasaporte "
        "N.º <b>[CÉDULA / PASAPORTE]</b>; quien en lo que sigue del presente contrato se denominará <b>EL SUB-BRÓKER</b> o <b>LA AGENCIA COLABORADORA</b>."
    )
    story.append(p(intro_broker, styles["body"]))

    story.append(Spacer(1, 1 * mm))
    preambulo = (
        "<b>POR CUANTO:</b> <b>BELLO VALDEZ ENTERPRISE</b> ostenta la calidad de <b>Master Bróker Oficial</b> y gestor comercial autorizado del proyecto "
        "inmobiliario denominado <b>CIPRES RESIDENCES</b> (en lo adelante el <b>PROYECTO</b>), ubicado estratégicamente en la zona de Punta Cana - Bávaro, "
        "desarrollado por la empresa propietaria y promotora del desarrollo.<br/>"
        "<b>POR CUANTO:</b> <b>EL SUB-BRÓKER</b> es una agencia inmobiliaria / asesor profesional dedicado a la intermediación y comercialización de propiedades, "
        "con interés en promover y gestionar ventas de las unidades habitacionales pertenecientes a <b>CIPRES RESIDENCES</b>.<br/>"
        "<b>POR TANTO:</b> En el entendido de las consideraciones expuestas, las partes han convenido de mutuo acuerdo y de buena fe formalizar el presente acuerdo bajo las siguientes cláusulas y condiciones:"
    )
    story.append(p(preambulo, styles["body"]))

    story.append(Spacer(1, 2 * mm))

    # Cláusula 1: Objeto y Alcance
    story.append(p("CLÁUSULA PRIMERA: OBJETO DEL ACUERDO Y ALCANCE", styles["sectionHeading"]))
    c1 = (
        "El presente Acuerdo tiene por objeto autorizar a <b>EL SUB-BRÓKER</b>, con carácter no exclusivo, a realizar labores de promoción, "
        "mercadeo y gestión de ventas de las unidades inmobiliarias correspondientes al proyecto <b>CIPRES RESIDENCES</b>, "
        "conforme a las listas de precios, disponibilidades, condiciones comerciales y normativas suministradas oficialmente por <b>BELLO VALDEZ ENTERPRISE</b>."
    )
    story.append(p(c1, styles["body"]))

    # Cláusula 2: Deberes del Sub-Bróker
    story.append(p("CLÁUSULA SEGUNDA: OBLIGACIONES Y DEBERES DE EL SUB-BRÓKER", styles["sectionHeading"]))
    story.append(p("<b>a. Registro Obligatorio de Clientes:</b> Registrar previamente a cada prospecto comprador en la plataforma comercial de <b>BELLO VALDEZ ENTERPRISE</b> antes de suministrar cotizaciones formales. El registro otorga una custodia y protección de cliente por un período de ciento ochenta (180) días calendario.", styles["bulletText"]))
    story.append(p("<b>b. Integridad Comercial:</b> Respetar estrictamente los precios de lista oficiales, planes de pago autorizados y políticas de venta del Proyecto sin aplicar variaciones ni ofertas no avaladas por escrito por El Master Bróker.", styles["bulletText"]))
    story.append(p("<b>c. Gestión Documental y KYC:</b> Recopilar y verificar la documentación completa del comprador (identificaciones oficiales, formularios de Conozca a su Cliente / Prevención de Lavado de Activos, comprobantes de pago y acuerdos de reserva).", styles["bulletText"]))
    story.append(p("<b>d. Canales de Pago Autorizados:</b> Instruir al cliente que todo pago por concepto de reserva, separación o cuotas iniciales debe efectuarse única y exclusivamente en las cuentas bancarias fiduciarias / oficiales designadas para <b>CIPRES RESIDENCES</b>.", styles["bulletText"]))

    # Cláusula 3: Honorarios, Comisión y Forma de Desembolso
    story.append(p("CLÁUSULA TERCERA: HONORARIOS, COMISIÓN Y FORMA DE PAGO", styles["sectionHeading"]))
    c3_intro = (
        "Por cada venta efectiva y perfeccionada en el proyecto <b>CIPRES RESIDENCES</b> gestionada directamente por <b>EL SUB-BRÓKER</b>, "
        "<b>BELLO VALDEZ ENTERPRISE</b> reconocerá y gestionará el pago de honorarios por concepto de comisión inmobiliaria conforme al siguiente régimen:"
    )
    story.append(p(c3_intro, styles["body"]))

    # Resumen de comision en tabla elegante
    table_data = [
        [p("<b>CONCEPTO</b>", styles["tableHeader"]), p("<b>PORCENTAJE / CONDICIÓN</b>", styles["tableHeader"]), p("<b>CONDICIÓN DISPARADORA DEL DESEMBOLSO</b>", styles["tableHeader"])],
        [
            p("<b>Comisión Total Pactada</b>", styles["tableCellBold"]),
            p("<b>5% + ITBIS</b> sobre el valor de venta final cerrado", styles["tableCellCenter"]),
            p("Aplicable al precio de contrato de la unidad vendida.", styles["tableCell"])
        ],
        [
            p("<b>Primer Desembolso (50%)</b>", styles["tableCellBold"]),
            p("<b>50% del total de la comisión</b><br/>(2.5% + ITBIS)", styles["tableCellCenter"]),
            p("Cuando el cliente complete el pago del <b>10% del valor total de la unidad</b> y se encuentre suscrito el contrato de opción a compra.", styles["tableCell"])
        ],
        [
            p("<b>Segundo Desembolso (50%)</b>", styles["tableCellBold"]),
            p("<b>50% restante de la comisión</b><br/>(2.5% + ITBIS)", styles["tableCellCenter"]),
            p("Cuando el cliente complete el pago de un <b>10% adicional</b> del valor de la unidad (es decir, al completar el <b>20% total acumulado</b> del valor de la unidad).", styles["tableCell"])
        ],
    ]

    t_comm = Table(table_data, colWidths=[38 * mm, 48 * mm, 90 * mm])
    t_comm.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("BACKGROUND", (0, 1), (-1, 1), colors.white),
        ("BACKGROUND", (0, 2), (-1, 2), BG_CARD),
        ("BACKGROUND", (0, 3), (-1, 3), colors.white),
    ]))
    story.append(KeepTogether([t_comm]))
    story.append(Spacer(1, 2 * mm))

    c3_fiscal = (
        "<b>Párrafo Fiscal y Facturación:</b> Para tramitar cada desembolso, <b>EL SUB-BRÓKER</b> deberá presentar su factura con Número de Comprobante Fiscal "
        "válido para Crédito Fiscal (tipo B01 o equivalente) a nombre de <b>BELLO VALDEZ ENTERPRISE, S.R.L.</b> o de la entidad pagadora que ésta indique por escrito, "
        "agregando el <b>18% correspondiente al ITBIS</b> de conformidad con las leyes tributarias de la República Dominicana."
    )
    story.append(p(c3_fiscal, styles["body"]))

    # Cláusula 4: Vigencia
    story.append(p("CLÁUSULA CUARTA: VIGENCIA DEL ACUERDO", styles["sectionHeading"]))
    c4 = (
        "El presente acuerdo tendrá una vigencia estricta de <b>un (1) año</b> calendario a partir de la fecha de su suscripción. "
        "Al término de dicho período, el acuerdo quedará extinguido de pleno derecho salvo que las partes acuerden su renovación o prórroga mediante adenda escrita o nueva firma electrónica."
    )
    story.append(p(c4, styles["body"]))

    # Cláusula 5: Independencia Jurídica y Laboral
    story.append(p("CLÁUSULA QUINTA: INDEPENDENCIA CONTRACTUAL", styles["sectionHeading"]))
    c5 = (
        "Las partes reconocen expresamente que actúan como contratistas comerciales independientes. El presente acuerdo no constituye sociedad accidental, asociación, "
        "franquicia ni relación laboral o de subordinación entre <b>BELLO VALDEZ ENTERPRISE</b> y <b>EL SUB-BRÓKER</b> o su personal dependiente."
    )
    story.append(p(c5, styles["body"]))

    # Cláusula 6: Confidencialidad y Ley Aplicable
    story.append(p("CLÁUSULA SEXTA: CONFIDENCIALIDAD, FIRMA DIGITAL Y JURISDICCIÓN", styles["sectionHeading"]))
    c6 = (
        "Toda información de precios, clientes, estrategias y condiciones es de carácter estrictamente confidencial. "
        "Las partes acuerdan que el presente contrato podrá formalizarse válidamente mediante firma manuscrita o firma electrónica de conformidad con la <b>Ley No. 126-02</b> sobre Comercio Electrónico, "
        "Documentos y Firmas Digitales de la República Dominicana, sometiéndose a la jurisdicción exclusiva de los tribunales de la República Dominicana."
    )
    story.append(p(c6, styles["body"]))

    story.append(Spacer(1, 4 * mm))

    # Bloque de Cierre y Firmas
    closure = "En fe de lo cual, las partes firman el presente acuerdo en dos (2) originales de un mismo tenor y efecto en la ciudad de Santo Domingo / Punta Cana, República Dominicana, a los [DÍA] días del mes de [MES] del año [AÑO]."
    story.append(p(closure, styles["body"]))
    story.append(Spacer(1, 10 * mm))

    sign_box_data = [
        [
            p("<b>POR EL MASTER BRÓKER:</b><br/><b>BELLO VALDEZ ENTERPRISE, S.R.L.</b>", styles["signLabel"]),
            p("<b>POR EL SUB-BRÓKER / AGENCIA:</b><br/><b>[NOMBRE DE LA EMPRESA / AGENCIA]</b>", styles["signLabel"]),
        ],
        [
            p("<br/><br/><br/>________________________________________<br/><b>Firma Autorizada</b><br/>Nombre: [REPRESENTANTE LEGAL]<br/>Cédula: [CÉDULA REPRESENTANTE]<br/>Cargo: Gerente General", styles["signText"]),
            p("<br/><br/><br/>________________________________________<br/><b>Firma Autorizada</b><br/>Nombre: [NOMBRE DEL SUB-BRÓKER]<br/>Cédula / Pasaporte: [CÉDULA / PASAPORTE]<br/>Cargo: Representante Autorizado", styles["signText"]),
        ]
    ]
    t_sign = Table(sign_box_data, colWidths=[88 * mm, 88 * mm])
    t_sign.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(KeepTogether([t_sign]))

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"PDF successfully generated at: {OUTPUT_PDF}")

if __name__ == "__main__":
    build_pdf()
