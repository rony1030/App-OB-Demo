const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function createGuidePdf() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  function createPage() {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    
    // Top banner
    page.drawRectangle({
      x: 0,
      y: height - 55,
      width: width,
      height: 55,
      color: rgb(0.047, 0.035, 0.306) // #0C094E
    });

    page.drawText('OB BROKERS TEAM · PLATAFORMA MASTER BROKER', {
      x: 40,
      y: height - 34,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    // Footer
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: 35,
      color: rgb(0.96, 0.96, 0.98)
    });

    page.drawText('Guia Oficial de Administracion · OB Brokers Platform 2026', {
      x: 40,
      y: 13,
      size: 8,
      font: font,
      color: rgb(0.4, 0.4, 0.5)
    });

    return page;
  }

  // --- PAGE 1: SUBIR Y PUBLICAR PROYECTOS ---
  let page1 = createPage();
  let y = 750;

  page1.drawText('GUIA 1: COMO SUBIR Y PUBLICAR UN PROYECTO', {
    x: 40,
    y,
    size: 15,
    font: fontBold,
    color: rgb(0.05, 0.15, 0.5)
  });

  y -= 22;
  page1.drawText('Ruta: Panel Portal > Administracion > + Subir Nuevo Proyecto (/portal/admin/projects/new)', {
    x: 40,
    y,
    size: 9,
    font: fontBold,
    color: rgb(0.2, 0.4, 0.8)
  });

  y -= 25;
  const sections = [
    {
      title: '1. Informacion General del Desarrollo',
      items: [
        '- Nombre del Proyecto: Identificador comercial principal (ej: Luma Towers, Mar Azul Residences).',
        '- Desarrolladora: Asocia el proyecto a la empresa constructora correspondiente.',
        '- Ubicacion y Zona: Cap Cana, Punta Cana, Bavaro (permite filtros en el catalogo web).',
        '- Estado de Obra: En Planos, En Construccion o Entrega Inmediata.',
        '- Fecha de Entrega y Precio Desde: Datos clave para la evaluacion del cliente e inversionista.',
        '- Beneficio CONFOTUR: Si aplica exencion del 3% de transferencia y 1% IPI anual por 15 anos.',
        '- Descripcion Comercial: Redaccion atractiva que alimenta el Dossier Digital y las Propuestas.'
      ]
    },
    {
      title: '2. Multimedia y Renders',
      items: [
        '- Imagen de Portada (Hero): Foto principal de alta resolucion (portada en la web y cabecera del dossier).',
        '- Galeria de Renders: Sube las imagenes de interiores, amenidades sociales y planos arquitectonicos.'
      ]
    },
    {
      title: '3. Plan de Pagos Comercial',
      items: [
        '- Monto de Reserva (ej: $5,000 USD).',
        '- Porcentaje Inicial a la Firma (ej: 20%).',
        '- Durante Construccion (ej: 40%).',
        '- Contra Entrega de Unidad (ej: 40%).'
      ]
    },
    {
      title: '4. Inventario de Unidades (Disponibilidad en Vivo)',
      items: [
        '- Asistente AI (Gemini): Sube un PDF de lista de precios o pega el texto; la IA extrae las unidades.',
        '- Manual: Agrega unidades con el boton (+ Agregar Unidad) especificando numero, tipologia, m2 y precio.',
        '- Google Sheets: Pega el enlace de la hoja de calculo del desarrollador para sincronizacion en vivo.'
      ]
    }
  ];

  for (const sec of sections) {
    page1.drawText(sec.title, { x: 40, y, size: 10.5, font: fontBold, color: rgb(0.1, 0.1, 0.2) });
    y -= 15;
    for (const it of sec.items) {
      page1.drawText(it, { x: 50, y, size: 8, font: font, color: rgb(0.25, 0.25, 0.3) });
      y -= 12;
    }
    y -= 8;
  }

  // --- PAGE 2: CREACIÓN DE USUARIOS, ROLES Y CONTRASEÑAS ---
  let page2 = createPage();
  y = 750;

  page2.drawText('GUIA 2: GESTION DE USUARIOS, ROLES Y CONTRASEÑAS', {
    x: 40,
    y,
    size: 15,
    font: fontBold,
    color: rgb(0.05, 0.15, 0.5)
  });

  y -= 25;
  const userGuides = [
    {
      title: '1. Como Crear un Nuevo Usuario / Agente',
      items: [
        '- Paso 1: Entra al panel de Supabase de tu proyecto (whrimmszdeghblbktivp.supabase.co).',
        '- Paso 2: En el menu lateral izquierdo, ve a Authentication > Users.',
        '- Paso 3: Haz clic en el boton superior derecho (Add User > Create user).',
        '- Paso 4: Escribe el Correo Electronico del broker y su Contrasena Inicial.',
        '- Paso 5: Marca la casilla (Auto Confirm User?) para que pueda entrar de inmediato sin esperar correo.'
      ]
    },
    {
      title: '2. Como Asignar Roles y Permisos en el Sistema',
      items: [
        '- En Supabase ve a Table Editor > tabla (memberships) e inserta una fila con:',
        '   * organization_id: 1 (para pertenecer a OB Brokers Team).',
        '   * user_id: El UUID del usuario creado en Authentication.',
        '   * role: Selecciona el nivel de acceso deseado:',
        '       - super_admin / master_broker_admin: Control total (crear proyectos, editar brokers, admin).',
        '       - broker_agent: Rol estandar de agente (ver proyectos, crear propuestas, registrar clientes).',
        '       - agency_admin: Director de agencia aliada (gestiona su propio equipo).',
        '   * status: active | is_primary: true.'
      ]
    },
    {
      title: '3. Como Cambiar o Resetear la Contrasena de un Usuario',
      items: [
        '- Metodo Directo (Administrador): En Supabase > Authentication > Users, busca el usuario, haz',
        '  clic en los tres puntos (...) a la derecha y selecciona (Change Password) o (Send Password Reset).',
        '- Metodo por el Usuario: En la pantalla de login (/login), el agente hace clic en (Olvidaste tu contrasena?),',
        '  introduce su correo y recibe un enlace directo para actualizar su clave de acceso.'
      ]
    },
    {
      title: '4. Matriz de Permisos por Rol en el Portal',
      items: [
        '- Master Broker / Super Admin: Gestion de Proyectos, Inventario Global, Creacion de Brokers, CRM, Auditoria.',
        '- Broker / Agente: Catalogo de Proyectos, Generador de Propuestas WhatsApp, Registro y Proteccion de Clientes 60 dias.',
        '- Desarrollador Admin: Visor exclusivo de sus unidades, reservaciones y reportes de clientes.'
      ]
    }
  ];

  for (const ug of userGuides) {
    page2.drawText(ug.title, { x: 40, y, size: 10.5, font: fontBold, color: rgb(0.1, 0.1, 0.2) });
    y -= 15;
    for (const it of ug.items) {
      page2.drawText(it, { x: 50, y, size: 8, font: font, color: rgb(0.25, 0.25, 0.3) });
      y -= 12;
    }
    y -= 8;
  }

  const pdfBytes = await pdfDoc.save();
  if (!fs.existsSync('public/docs')) fs.mkdirSync('public/docs', { recursive: true });
  fs.writeFileSync('public/docs/GUIA_MAESTRA_PROYECTOS_Y_USUARIOS.pdf', pdfBytes);
  fs.writeFileSync('docs/GUIA_MAESTRA_PROYECTOS_Y_USUARIOS.pdf', pdfBytes);
  console.log('PDF generated successfully at public/docs/GUIA_MAESTRA_PROYECTOS_Y_USUARIOS.pdf and docs/GUIA_MAESTRA_PROYECTOS_Y_USUARIOS.pdf');
}

createGuidePdf().catch(console.error);
