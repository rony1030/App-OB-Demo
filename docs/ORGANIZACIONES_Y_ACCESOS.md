# Separación de organizaciones y accesos

Una persona puede administrar su agencia y, mediante otra membresía, gestionar Master Brokers. Sus vendedores reciben el acceso comercial de la agencia; el cargo administrativo de su director no se transmite a ellos.

| Entidad | Función | Relación con proyectos |
| --- | --- | --- |
| Agencia | Equipo comercial, clientes y propuestas | Acuerdos firmados vigentes y alcance autorizado |
| Desarrolladora | Empresa que desarrolla el inmueble | `projects.developer_organization_id` |
| Master Broker | Operación comercial y acuerdos | `projects.organization_id`, con responsables explícitos |
| Usuario | Persona autenticada | Membresías por organización y permisos por proyecto |
| Administración de plataforma | Supervisión global | Rol de persona; no convierte su agencia en desarrolladora |

## Implementado

- [x] Directorio incluye desarrolladoras, agencias y Master Brokers con etiquetas legibles.
- [x] Elimina la atribución genérica de «desarrollos» a agencias y Master Brokers.
- [x] Separa proyectos desarrollados, gestión registrada y accesos explícitos.
- [x] Excluye accesos explícitos vencidos del contador.
- [x] Muestra acuerdos firmados vigentes de agencias por separado. Un acuerdo no equivale necesariamente a un proyecto.
- [x] Cuenta membresías como membresías, porque una persona puede pertenecer a varias organizaciones.

## Pendiente

- [ ] Verificar datos publicados: Bello Valdez y HP Brokers tienen tipo `master_broker`; separar sus equipos comerciales de las operaciones Master Broker requiere un mapa de reasignación de organizaciones, proyectos, membresías y acuerdos.
- [ ] UVE es nombre de proyecto y también de una operación Master Broker. Comprobar su vínculo con el proyecto y la desarrolladora real.
- [x] Corregir `private.can_view_project`: la migración `20260915210000_restore_agreement_project_visibility.sql` conserva el acceso explícito y restaura acuerdos firmados vigentes por Master Broker y proyecto.
- [ ] Aplicar la migración en producción y probar acuerdo general, acuerdo de proyecto, acuerdo vencido y membresía suspendida.
- [ ] Unificar catálogo, servidor y políticas: membresía activa + agencia activa + acuerdo vigente + alcance del proyecto. Conservar excepciones administrativas explícitas y auditadas.
- [ ] Comprobar que vendedores de Blue Land no heredan el rol Master Broker de Veronica.
- [ ] Revisar destinatarios, ventas, pagos y comisiones por proyecto y rol. Los correos operativos no otorgan permisos.
- [ ] Configurar responsables y desarrolladora directamente desde la ficha del Master Broker.
- [ ] Validar con vendedor, admin de agencia, admin Master, desarrolladora y plataforma; probar acuerdo vencido y membresía suspendida.

## Transición de datos

Preparar tabla de IDs actuales y destino antes de migrar. Conservar contratos, propuestas y auditoría con referencias históricas. Crear membresías adicionales para responsables en su operación Master Broker; mantener vendedores en su agencia y sus acuerdos comerciales. No convertir automáticamente organizaciones por nombre: la clasificación actual puede sostener permisos y contratos.

Esta revisión corrige el directorio y documenta la reorganización. Las reasignaciones de producción se ejecutan solo después de comprobar los accesos históricos.

## Auditoría de producción — 2026-09-15

- UVE (`22`) administra ahora Uve Residences (`project 26`), cuya desarrolladora es Dominican Condos (`23`). Rony y Veronica tienen membresías activas como administradores de UVE.
- Se aplicó y verificó `restore_agreement_project_visibility` en Supabase. Los acuerdos firmados vigentes vuelven a ser una fuente válida de acceso por Master Broker y proyecto.
- Blue Land (`21`) tiene un acuerdo general pendiente de firma con Bello Valdez (`1`); por eso no se cuenta como agencia vigente ni se mueve automáticamente a UVE.
- Ciprés (`project 13`) todavía pertenece a Bello Valdez (`1`) y tiene como desarrolladora a KYSER (`11`). Conserva accesos históricos para Anna, Osvaldo, una cuenta de KYSER y Veronica.
- Cana Rock (`projects 22–25`) pertenece a `Cana Rock / Osvaldo Bello` (`16`, tipo `partner`) y tiene como desarrolladora a Grupo Cana Rock (`17`). Sus accesos y responsabilidades comerciales están registrados para esa organización.
- Pendiente de aprobación antes de ejecutar en producción: mover Ciprés a HP Brokers (`18`), agregar a Osvaldo como administrador de HP, convertir la organización `16` en Master Broker `Cana Rock` y agregar a Osvaldo como administrador de esa organización. Los accesos históricos se conservarán.

### Ejecución autorizada — 2026-09-15

- Ciprés (`13`) ahora pertenece a HP Brokers (`18`) y conserva a KYSER (`11`) como desarrolladora.
- Se conservaron los cuatro registros históricos de acceso de Ciprés y se actualizaron al nuevo propietario operativo.
- Osvaldo quedó como administrador activo de HP Brokers junto a Anna.
- La organización `Cana Rock / Osvaldo Bello` (`16`) ahora se llama `Cana Rock` y es `master_broker`.
- Grupo Cana Rock (`17`) continúa como `developer` de los cuatro proyectos Cana Rock.
- Se cambió la relación de Cana Rock con Grupo Cana Rock a `master_broker_for` y Osvaldo quedó como administrador activo de Cana Rock.
- UVE (`22`) conserva el proyecto UVE, la relación activa con Dominican Condos (`23`) y sus dos administradores.
- Se aplicó en Supabase la migración de acceso por acuerdos firmados vigentes.
- La vista publicada anterior todavía requiere el despliegue del código local para mostrar las nuevas etiquetas y contadores.
