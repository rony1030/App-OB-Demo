# Roles y permisos — App OB Brokers

**Estado de referencia:** 15 de agosto de 2026  
**Modelo de Seguridad:** Row Level Security (RLS) en Supabase Postgres con funciones de verificación `private.has_org_role` y `private.has_org_slug_role`.

---

## 1. Modelo de Identidad y Membresías

En la plataforma OB Brokers Team:
- La identidad personal reside en `auth.users` y se amplía con `public.profiles`.
- Un usuario interactúa con la plataforma a través de una o más `public.memberships` asociadas a una `public.organizations`.
- Cada membresía asigna un rol específico y un estado (`pending`, `active`, `suspended`, `revoked`).
- El acceso y aislamiento de datos se evalúan estrictamente por organización y rol mediante políticas RLS en base de datos.

---

## 2. Definición de Roles del Sistema

El esquema Postgres implementa 8 roles normalizados:

### 2.1. `super_admin` (Superadministrador de Plataforma)
- Máxima jerarquía técnica y operativa del sistema.
- Gestiona organizaciones (creación, activación, suspensión).
- Acceso global a registros de auditoría y soporte técnico.
- Asigna administradores iniciales para master brokers y desarrolladores.

### 2.2. `master_broker_admin` (Administrador Master Broker)
- Control total sobre la organización de master corretaje.
- Da de alta desarrolladores, proyectos inmobiliarios e inventarios maestros.
- Aprueba y gestiona el acceso a proyectos para agencias aliadas y brokers.
- Supervisa todos los contactos, leads, reportes y oportunidades de la organización.
- Administra comisiones, acuerdos comerciales y confirma reservas finales.

### 2.3. `master_broker_operations` (Operaciones Master Broker)
- Mantiene la precisión del catálogo de proyectos, tipologías, precios y unidades.
- Revisa reportes de clientes para validar conflictos de duplicidad.
- Gestiona la biblioteca documental y listas de precios vigentes.
- No puede modificar la configuración sensible de la organización ni comisiones de alto nivel.

### 2.4. `agency_admin` (Administrador de Inmobiliaria / Agencia Aliada)
- Administra a los brokers y agentes pertenecientes a su agencia (`teams`/`memberships`).
- Gestiona los proyectos asignados formalmente a su inmobiliaria.
- Supervisa las Smart Lists, oportunidades y propuestas de los agentes de su equipo.
- Consulta métricas de rendimiento y comisiones acumuladas de su inmobiliaria.

### 2.5. `broker_agent` (Broker o Agente Comercial)
- Accede exclusivamente a los proyectos autorizados para su organización o perfil.
- Reporta y protege clientes mediante el módulo de registro rápido o workspace completo.
- Gestiona sus contactos con Smart Lists, timeline omnicanal, notas, tareas y pipeline personal.
- Crea dossiers y propuestas comerciales personalizadas con su marca personal/agencia.
- Genera solicitudes de separación y reserva para sus clientes; consulta sus comisiones.

### 2.6. `developer_admin` (Administrador Desarrollador)
- Gestiona la organización del desarrollador inmobiliario.
- Mantiene el inventario, tipologías, amenidades y planos de sus propios desarrollos.
- Carga y actualiza documentos oficiales (brochures, listas de precios, contratos de promesa).
- Recibe y valida solicitudes de separación y reserva en tiempo real.

### 2.7. `developer_viewer` (Consulta Desarrollador)
- Visualiza el estado en tiempo real del inventario de sus proyectos.
- Monitorea métricas de ventas y reservas confirmadas.
- Modo de solo lectura: no puede alterar precios, unidades ni documentos sin aprobación.

### 2.8. `support_auditor` (Auditor o Soporte Técnico)
- Rol especializado para auditoría de cumplimiento, resolución de disputas o soporte.
- Acceso de lectura trazable a logs de auditoría (`audit_events`) y reportes de protección.

---

## 3. Matriz de Permisos por Rol

| Capacidad / Módulo | Super Admin | Master Admin | Master Ops | Agency Admin | Broker Agent | Dev Admin | Dev Viewer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Crear / suspender organizaciones** |  Sí | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Gestionar miembros propios** |  Sí |  Sí | ⚠️ Limitado |  Sí | ❌ No |  Sí | ❌ No |
| **Crear y editar proyectos** |  Sí |  Sí |  Sí | ❌ No | ❌ No |  Solo propios | ❌ No |
| **Publicar precios y documentos** |  Sí |  Sí | ⚠️ Con permiso | ❌ No | ❌ No | ⚠️ Con aprobación | ❌ No |
| **Asignar proyectos a agencias** |  Sí |  Sí | ⚠️ Con permiso | ❌ No | ❌ No | ❌ No | ❌ No |
| **Reportar y proteger leads** |  Sí |  Sí |  Sí |  Sí |  Sí | ❌ No | ❌ No |
| **Ver todos los leads de la org** |  Sí |  Sí |  Sí | ⚠️ Su equipo | ⚠️ Solo asignados | ❌ No | ❌ No |
| **Smart Lists y Custom Fields** |  Sí |  Sí |  Sí |  Sí |  Sí (propios) | ❌ No | ❌ No |
| **Crear propuestas y dossiers** |  Sí |  Sí |  Sí |  Sí |  Sí | ❌ No | ❌ No |
| **Solicitar reserva de unidad** |  Sí |  Sí |  Sí |  Sí |  Sí | ❌ No | ❌ No |
| **Aprobar / confirmar reserva** |  Sí |  Sí |  Sí | ❌ No | ❌ No |  Valida | ❌ No |
| **Configurar comisiones** |  Sí |  Sí | ❌ No | ⚠️ Equipo | ❌ No | ❌ No | ❌ No |
| **Ver auditoría completa** |  Global |  Organización | ⚠️ Limitada | ⚠️ Equipo | ⚠️ Personal | ⚠️ Propia | ⚠️ Propia |

---

## 4. Reglas de Visibilidad y Protección de Datos

1. **Aislamiento por Organización:** RLS fuerza `organization_id` en todas las consultas de escritura y lectura autenticadas. Un broker de la Agencia A no puede ver contactos ni propuestas de la Agencia B.
2. **Protección de Clientes (Regla de Exclusividad):** Al reportar un cliente para un proyecto específico, se genera un `lead_reports` con estado `protected` y fecha de vigencia (`protected_until`). Si otro broker intenta registrar el mismo email/teléfono, el sistema alerta de un posible conflicto.
3. **Privacidad del Desarrollador:** Los desarrolladores ven las reservas y solicitudes de sus unidades, pero no tienen acceso a la base general de clientes ni a las propuestas de otros proyectos que gestiona el master broker.
4. **Almacenamiento Seguro:** Los documentos privados (`private-documents`) solo se descargan mediante URLs firmadas generadas en backend tras verificar la membresía activa del usuario solicitante.

---

## 5. Relaciones, responsabilidades y capacidades por proyecto

Para operaciones donde participan varias empresas, el rol general se complementa con alcance de proyecto:

- `organization_relationships` registra la relación formal entre master broker, desarrollador, aliado y agencia.
- `project_access` determina qué organización, equipo o membresía puede acceder al proyecto y con qué nivel base.
- `project_access_capabilities` limita las acciones concretas habilitadas dentro de ese acceso.
- `project_responsibilities` identifica responsables primarios/secundarios por proyecto y periodo.

El acceso efectivo requiere membresía activa, proyecto visible y capacidad suficiente. Una relación comercial por sí sola no concede acceso a CRM, inventario, documentos o estadísticas.

En Cana Rock se manejarán dos organizaciones: `Cana Rock / Osvaldo Bello` como master broker y `Grupo Cana Rock` como desarrollador. El desarrollador no recibe acceso automático al CRM completo del master broker.
