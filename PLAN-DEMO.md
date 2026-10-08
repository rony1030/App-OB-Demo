# Plan del Proyecto Demo (App-OB-Demo)

Este documento contiene la arquitectura, el estado actual, las credenciales del entorno y la hoja de ruta para el proyecto independiente **App-OB-Demo** alojado en GitHub en [`rony1030/App-OB-Demo`](https://github.com/rony1030/App-OB-Demo) y desplegado en producción en **[demo.osvaldobello.com](https://demo.osvaldobello.com)**.

---

## 1. Identificación y Entorno

- **Repositorio GitHub:** `https://github.com/rony1030/App-OB-Demo`
- **Carpeta Local:** `C:\Users\Rony\Documents\GitHub\App-OB-Demo`
- **Dominio de Producción:** `https://demo.osvaldobello.com`
- **Proyecto en Vercel:** `demo-osvaldobello` (Team: `rony-8f47`)
- **Alcance / Scope (`NEXT_PUBLIC_APP_SCOPE`):** `demo`
- **Usuario Demo Predeterminado:** `soporte@osvaldobello.com`
- **Proyecto Demo Activo:** *Villas en Punta Cana* (Slug: `villas-en-punta-cana`, Unidades: 101, etc.)
- **Acceso Inversionista Demo:** `/inversionista/demo` (Código de acceso: `DEMO2026`)

---

## 2. Lo que se ha Implementado y Corregido (Estado Actual)

### Autenticación y Navegación
- **Ruta de Login (`/login`):**
  - Acceso directo con el usuario demo precargado `soporte@osvaldobello.com`.
  - Enlaces directos inferiores para:
    - **Portal Demo de Inversionista** (`/inversionista/demo`).
    - **Portal Demo de Desarrollador** *(pendiente de diseño)*.
- **Seguridad y Recursos:**
  - Content Security Policy (CSP) ajustada para permitir recursos de mapas y hojas de estilo (Leaflet / unpkg / osm).
  - PWA Web Manifest configurado como JSON estático válido.

### Creador de Propuestas (`/portal/proposals/new`)
- **Destinatario por Defecto:**
  - En el alcance `demo` no se exige vincular un lead ni aparece el recuadro amarillo de "Presentar a inversionista directo". La propuesta asume automáticamente la opción de Inversionista sin fricción.
- **Barra de Acciones Superior Persistente:**
  - Barra de acciones (`Volver`, `Guardar`, `Descargar PDF`, `WhatsApp`, etc.) con posición `sticky top-20` para mantenerse visible mientras se hace scroll en toda la propuesta.
- **Barra Flotante para Dispositivos Móviles:**
  - Barra fija inferior (`fixed bottom-4 left-3 right-3 sm:hidden`) con accesos táctiles rápidos para **Volver**, **Guardar** y **Descargar PDF**.
- **Descarga de PDF Condicional:**
  - El botón de descarga de PDF permanece inactivo hasta que la propuesta haya sido guardada, evitando descargas de borradores no sincronizados.

---

## 3. Próximos Pasos en el Demo

- [ ] **Demo de Desarrollador (`/portal/developer`):**
  - Implementar modo demo para que el usuario pueda visualizar la experiencia de una desarrolladora/promotora viendo métricas, unidades vendidas/reservadas y reportes sin requerir credenciales reales.
- [ ] **Catálogo y Unidades en Memoria / LocalStorage:**
  - Permitir al usuario crear o alterar unidades o crear cotizaciones temporales sin alterar la base de datos de producción de Supabase.
- [ ] **Presentaciones Interactivas (`/p/[token]`):**
  - Validar que los enlaces compartidos de las propuestas creadas en el demo se puedan visualizar y aprobar/rechazar fluidamente en mobile y desktop.

---

## 4. Comandos Frecuentes para el Agente

```powershell
# En la carpeta: C:\Users\Rony\Documents\GitHub\App-OB-Demo

# 1. Compilación y chequeo de tipos
npm run build

# 2. Guardar y subir a GitHub
git add .
git commit -m "feat/fix: descripción"
git push origin main

# 3. Despliegue directo a producción en Vercel
npx vercel --prod --yes --token <TU_VERCEL_TOKEN>
```

## 2026-10-08 · Recorrido comercial para grabaciones

El alcance `demo` usa contactos y proyectos ficticios y conserva las operaciones interactivas en el navegador. La interfaz comercial no muestra etiquetas de demo o prueba.

- Crear lead, consultar su expediente, registrar notas y actividades y adjuntar PDF o imágenes en IndexedDB.
- Crear, guardar, aceptar y editar propuestas vinculadas al contacto; personalizar dossiers sin escribir al disco del servidor.
- Crear negociación y reservar una unidad. Reportar el pago del cliente; pago y promesa se confirman automáticamente a los cuatro segundos.
- Solicitar comisión, generar proforma y descargarla en PDF. A los diez segundos de su generación se aprueba y se habilita la factura final.
- Generar factura con número fiscal y sello ficticios; diez segundos después se confirma el pago de comisión.
- Los tiempos se calculan desde marcas de fecha persistidas: al recargar o volver al expediente, el flujo retoma la etapa correspondiente.
- Las sesiones del inversionista usan cookies de cada navegador y sus reportes se conservan en el mismo flujo local; no se envían correos ni se ejecutan pagos reales.

Validación: recorrido completo con Lucía Ventura / Villas Bahía Coral / BA-01; proforma y factura descargadas y renderizadas para revisión visual; expediente verificado después de recargar. Once suites de pruebas, incluida la secuencia y sus tiempos exactos.

Alcance del almacenamiento: los contactos creados, archivos y enlaces personalizados se conservan en ese navegador y origen. Para grabar varias etapas, continuar desde el mismo navegador. No se sincronizan con otra computadora ni con el repositorio principal.
