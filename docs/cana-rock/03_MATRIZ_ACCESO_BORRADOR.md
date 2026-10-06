# Matriz de acceso y aislamiento — borrador del Ciclo 001

El modelo combina membresía activa, rol base, acceso al proyecto y capacidad. La visibilidad del menú será consecuencia del permiso; no será el mecanismo de seguridad.

## Participantes aprobados o propuestos

| Participante | Organización | Rol base candidato | Alcance |
|---|---|---|---|
| Operación de plataforma | App OB Brokers | `super_admin` | Plataforma completa y auditoría |
| Osvaldo Bello | Cana Rock / Osvaldo Bello (`master_broker`) | `master_broker_admin` | Responsable primario de la organización y proyectos asignados |
| Operaciones Cana Rock | Master broker Cana Rock | `master_broker_operations` | Contenido, inventario y documentos autorizados |
| Desarrollador Cana Rock | Grupo Cana Rock (`developer`) | `developer_admin` | Proyectos propios y datos acordados |
| Consulta desarrollador | Grupo Cana Rock | `developer_viewer` | Lectura de inventario/métricas propias |
| Agencia aliada | Agencia | `agency_admin` | Equipo y oportunidades de su agencia |
| Broker | Agencia o master broker | `broker_agent` | Clientes propios y proyectos autorizados |
| Auditor/soporte | Plataforma o participante | `support_auditor` | Solo lectura trazable y limitada |

## Capacidades por proyecto candidatas

| Capacidad | Plataforma | MB admin | MB operaciones | Developer admin | Agency admin | Broker | Auditor |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Ver proyecto | Sí | Sí | Sí | Sí | Asignado | Asignado | Asignado |
| Administrar contenido | Sí | Sí | Sí | Acordado | No | No | No |
| Administrar activos | Sí | Sí | Sí | Acordado | No | No | No |
| Ver inventario | Sí | Sí | Sí | Sí | Asignado | Asignado | Asignado |
| Monitorear sincronización | Sí | Sí | Sí | Acordado | No | No | Asignado |
| Corregir excepción de inventario | Sí | Sí | Sí | Acordado | No | No | No |
| Ver CRM completo del master broker | Sí | Sí | Acordado | No | No | No | Acordado |
| Ver CRM de agencia/equipo | Sí | Sí | Acordado | No | Sí | Propio | Acordado |
| Crear propuesta/dossier | Sí | Sí | Sí | No | Sí | Sí | No |
| Revisar/aprobar propuesta | Sí | Sí | Acordado | Acordado | No | No | No |
| Administrar plantillas | Sí | Sí | Sí | Acordado | No | No | No |
| Ver estadísticas del proyecto | Sí | Sí | Sí | Acordado | Asignado | Propias | Asignado |
| Administrar miembros | Sí | Sí | No | Su organización | Su agencia | No | No |

`Acordado` y `Asignado` requieren una relación explícita y vigente; nunca se infieren por conocer la URL.

## Casos mínimos de aislamiento

Se prepararán dos master brokers ficticios, `MB-A` y `MB-B`, con `Proyecto-A` y `Proyecto-B`.

1. Un administrador de `MB-A` puede consultar y editar `Proyecto-A` dentro de sus capacidades.
2. El mismo usuario no puede leer, modificar, exportar ni inferir conteos de `Proyecto-B`.
3. Un broker de `MB-A` ve sus contactos y propuestas, no los de otro broker salvo acceso de equipo.
4. Un desarrollador de `Proyecto-A` no obtiene el CRM completo de `MB-A` por ser desarrollador.
5. Un enlace público solo expone el snapshot publicado, no tablas internas ni otros proyectos.
6. Un acceso vencido deja de funcionar tanto en interfaz como en consulta directa.
7. Un usuario suspendido pierde todas las rutas protegidas sin borrar su historial.
8. Las corridas del conector son visibles solo a participantes autorizados del proyecto.
9. Los errores no revelan existencia, nombres o conteos de la otra organización.
10. Exportaciones y descargas respetan exactamente el mismo alcance que la pantalla.

## Decisiones que requieren aprobación de negocio

- Quiénes forman la alianza y cuál es su relación legal/comercial.
- Si el responsable principal decide solo o dentro de un comité.
- Quién publica contenido, aprueba propuestas y gestiona excepciones de inventario.
- Propiedad de leads y propuestas al cambiar un broker de agencia.
- Profundidad de estadísticas visible para desarrollador, aliado, agencia y broker.
- Retención de CRM, telemetría, chat, campañas y propuestas.

Hasta aprobar estas decisiones, el esquema nuevo se limitará a fundaciones reversibles y no se migrarán usuarios reales.
