from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "pdf"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_PATH = OUT_DIR / "Guia_entrega_Elements_Developer.pdf"

INK = HexColor("#1A1A1A")
MUTED = HexColor("#625E58")
BRONZE = HexColor("#A98162")
SAND = HexColor("#F4F1E8")
PALE = HexColor("#E8E1D6")


def wrap(text, font, size, width):
    words = text.split()
    lines, line = [], ""
    for word in words:
        candidate = word if not line else f"{line} {word}"
        if stringWidth(candidate, font, size) <= width:
            line = candidate
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def draw_wrapped(c, text, x, y, width, font="Helvetica", size=8.0, leading=9.35, color=INK):
    c.setFont(font, size)
    c.setFillColor(color)
    for line in wrap(text, font, size, width):
        c.drawString(x, y, line)
        y -= leading
    return y


def heading(c, number, title, x, y):
    c.setFillColor(BRONZE)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(x, y, f"{number}  {title.upper()}")
    return y - 15


def checklist(c, text, x, y, width):
    c.setStrokeColor(PALE)
    c.setLineWidth(0.7)
    c.rect(x, y - 4.2, 5.4, 5.4, stroke=1, fill=0)
    return draw_wrapped(c, text, x + 10, y, width - 10, size=7.65, leading=9.0) - 3.0


def note(c, lead, text, x, y, width):
    c.setFillColor(BRONZE)
    c.setFont("Helvetica-Bold", 7.45)
    c.drawString(x, y, lead)
    lead_w = stringWidth(lead, "Helvetica-Bold", 7.45)
    remaining = max(20, width - lead_w)
    first_lines = wrap(text, "Helvetica", 7.45, remaining)
    if first_lines:
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7.45)
        c.drawString(x + lead_w, y, first_lines[0])
        y -= 9.0
        for line in first_lines[1:]:
            c.drawString(x, y, line)
            y -= 9.0
    return y - 2


def draw_section(c, number, title, items, x, y, width, note_data=None):
    y = heading(c, number, title, x, y)
    for text in items:
        y = checklist(c, text, x, y, width)
    if note_data:
        y = note(c, note_data[0], note_data[1], x, y + 1, width)
    return y - 7


c = canvas.Canvas(str(OUT_PATH), pagesize=letter)
page_w, page_h = letter
c.setTitle("Guia de entrega para Elements Developer")
c.setAuthor("OB Brokers Team")

c.setFillColor(SAND)
c.rect(0, 0, page_w, page_h, stroke=0, fill=1)
c.setFillColor(BRONZE)
c.rect(0, page_h - 9, page_w, 9, stroke=0, fill=1)

left = 36
content_w = page_w - 72
c.setFillColor(INK)
c.setFont("Helvetica-Bold", 20)
c.drawString(left, 748, "Guia de entrega para Elements Developer")
c.setFillColor(BRONZE)
c.setFont("Helvetica-Bold", 8.8)
c.drawString(left, 728, "LANDING PUBLICA  |  INVENTARIO  |  PLATAFORMA OB BROKERS")

intro = (
    "Elements se incorporara como proyecto, igual que Cipres, bajo la desarrolladora Elements Developer. "
    "Entrega un solo archivo ZIP con la estructura indicada. Si elements.com.do sigue vigente, marca CONFIRMADO "
    "y autoriza su extraccion; no es necesario duplicar la informacion."
)
draw_wrapped(c, intro, left, 710, content_w, size=8.7, leading=10.2, color=MUTED)

gap = 22
col_w = (content_w - gap) / 2
x1, x2 = left, left + col_w + gap
y1 = y2 = 678

y1 = draw_section(c, "01", "Identidad y marca", [
    "Logo horizontal y simbolo en SVG; respaldo PNG transparente de 2000 px o mas.",
    "Manual de marca, colores oficiales y tipografias con sus licencias.",
    "Nombre comercial confirmado: ELEMENTS. Desarrolladora: Elements Developer.",
    "Versiones del logo para fondo claro, oscuro y fotografia.",
], x1, y1, col_w)

y1 = draw_section(c, "02", "Imagenes y movimiento", [
    "Un hero horizontal de al menos 2400 x 1600 px, limpio y sin texto incrustado.",
    "Entre 8 y 15 renders exteriores e interiores en alta resolucion.",
    "Entre 2 y 4 imagenes verticales para movil y revelaciones editoriales.",
    "Planos, master plan, mapa de ubicacion y fotografias de amenidades.",
    "Video hero opcional de 10 a 30 s, MP4 o WebM, 1080p o superior.",
    "Autorizacion para reutilizar recursos publicos de elements.com.do si faltan originales.",
], x1, y1, col_w)

y1 = draw_section(c, "03", "Informacion comercial vigente", [
    "Nombre oficial, fase, estado de venta, ubicacion y fecha estimada de entrega.",
    "Tipologias, metrajes interiores y exteriores, capacidad y equipamiento incluido.",
    "Precio desde, moneda, reserva, separacion y planes de pago.",
    "Inventario por unidad: codigo, modelo, precio, estado y disponibilidad.",
    "Amenidades, atributos sostenibles, paneles solares, picuzzi y upgrades.",
    "Comision de broker, incentivos, pronto pago y vigencias autorizadas.",
], x1, y1, col_w, ("Entrega minima: ", "logo, 6 renders, datos confirmados, contacto de ventas y autorizacion de activos."))

y2 = draw_section(c, "04", "Ventas contacto y conversion", [
    "WhatsApp con codigo de pais, telefono, correo y responsable comercial.",
    "Destinatarios del formulario y tiempo esperado de respuesta.",
    "Instagram y demas enlaces oficiales.",
    "CTA principal: reservar unidad, solicitar disponibilidad, invertir u otro.",
    "Ruta o dominio final y acceso deseado desde el portal.",
], x2, y2, col_w)

y2 = draw_section(c, "05", "Documentos y respaldo", [
    "Brochure, lista de precios, inventario y esquema de pagos vigentes.",
    "Memoria de calidades, especificaciones y planos aprobados.",
    "Aviso legal sobre renders, privacidad, terminos y cookies.",
    "Fuente del inventario: Supabase, Google Sheets o carga manual.",
], x2, y2, col_w)

y2 = draw_section(c, "06", "Datos detectados para confirmar", [
    "ELEMENTS Eco Residences & Resort; Fase 0; 12 Eco Suites.",
    "Modelos publicados: Eco Suite, Eco Deluxe y Eco Royal.",
    "Eco Suite desde US$95,000 y reserva publicada de US$500.",
    "Planes A y B; descuento publicado de 5% por pronto pago bajo condicion.",
    "Concepto de marca: Tierra, Agua, Aire y Fuego; enfoque sostenible y natural.",
], x2, y2, col_w, ("Accion: ", "marca CONFIRMADO, CORREGIR o RETIRAR junto a cada dato."))

y2 = draw_section(c, "07", "Estructura del archivo ZIP", [
    "01_Marca   02_Renders_Horizontales   03_Renders_Verticales",
    "04_Videos   05_Planos_y_Ubicacion   06_Inventario_y_Precios",
    "07_Documentos_Legales   08_Contactos_y_Enlaces",
], x2, y2, col_w)

y2 = draw_section(c, "08", "Decisiones rapidas", [
    "Idiomas: espanol / ingles / frances.",
    "Inventario: manual / Google Sheets / Supabase.",
    "Pagina: nueva ruta / subdominio / dominio propio.",
    "Flujo recomendado: concepto visual primero y luego desarrollo.",
], x2, y2, col_w, ("Direccion visual: ", "estructura inmobiliaria editorial y revelaciones cinematicas adaptadas a Elements."))

c.setFillColor(BRONZE)
c.setFont("Helvetica-Bold", 10.2)
c.drawString(left, 292, "FICHA DE RESPUESTA RAPIDA")

def response_line(label, x, y, width):
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 7.1)
    c.drawString(x, y, label.upper())
    c.setStrokeColor(PALE)
    c.setLineWidth(0.8)
    c.line(x, y - 13, x + width, y - 13)


response_line("Responsable comercial", x1, 271, col_w)
response_line("WhatsApp y telefono", x1, 238, col_w)
response_line("Correo y destinatario del formulario", x1, 205, col_w)
response_line("Ruta dominio o subdominio final", x1, 172, col_w)

response_line("CTA principal", x2, 271, col_w)
response_line("Fuente o enlace del inventario", x2, 238, col_w)
response_line("Idiomas requeridos", x2, 205, col_w)

c.setFillColor(MUTED)
c.setFont("Helvetica-Bold", 7.1)
c.drawString(x2, 172, "AUTORIZACIONES")
authorization_y = 155
for authorization in [
    "Los datos publicados siguen vigentes.",
    "Se autoriza extraer contenido de elements.com.do.",
    "Se autoriza usar imagenes publicas si faltan originales.",
]:
    c.setStrokeColor(PALE)
    c.rect(x2, authorization_y - 4, 5.4, 5.4, stroke=1, fill=0)
    c.setFillColor(INK)
    c.setFont("Helvetica", 6.9)
    c.drawString(x2 + 10, authorization_y, authorization)
    authorization_y -= 14

c.setFillColor(MUTED)
c.setFont("Helvetica-Bold", 7.1)
c.drawString(x1, 130, "NOTAS Y CORRECCIONES DE LOS DATOS PUBLICADOS")
c.setStrokeColor(PALE)
for line_y in [112, 91, 70]:
    c.line(x1, line_y, x1 + content_w, line_y)

c.setFillColor(MUTED)
c.setFont("Helvetica", 6.2)
c.drawCentredString(page_w / 2, 22, "OB Brokers Team  |  Preparacion de contenido para Elements Developer  |  Septiembre 2026")
c.save()
print(OUT_PATH)
