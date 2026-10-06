# Documentación de producto — OB Brokers Team

**Estado de referencia:** 15 de agosto de 2026  
Esta carpeta constituye la **fuente de verdad técnica, operativa y funcional** del proyecto. Se mantiene sincronizada con el estado del código, la base de datos Supabase Postgres y las decisiones comerciales.

---

## Índice de Documentación

1. **[00_PRODUCTO_MAESTRO.md](./00_PRODUCTO_MAESTRO.md):**  
   Visión de negocio, arquitectura de portales (`/portal`, `/portal/admin`, `/portal/dev`), principios fundamentales, módulos funcionales y criterios de éxito.
2. **[01_ROLES_Y_PERMISOS.md](./01_ROLES_Y_PERMISOS.md):**  
   Definición de los 8 roles de la plataforma, funciones de validación RLS (`private.has_org_role`), matriz de permisos y reglas de aislamiento multiempresa.
3. **[02_DATOS_Y_FLUJOS.md](./02_DATOS_Y_FLUJOS.md):**  
   Catálogo de las 43 tablas de base de datos, máquinas de estado de unidades y oportunidades, y flujos transaccionales críticos (CRM estilo GHL, deduplicación/fusión, snapshots inmutables y bloqueo atómico de inventario).
4. **[03_ROADMAP_Y_DECISIONES.md](./03_ROADMAP_Y_DECISIONES.md):**  
   Checklist de progreso por fases (Fase 0 completada), registro cronológico de decisiones arquitectónicas y preguntas de negocio prioritarias.
5. **[04_PLAN_MAESTRO_IMPLEMENTACION.md](./04_PLAN_MAESTRO_IMPLEMENTACION.md):**  
   Análisis exhaustivo del estado técnico, especificación a profundidad del CRM estilo GoHighLevel (Smart Lists, Ficha 360 en 3 columnas, Custom Fields, Bulk Actions, DND, Theming CSS) y roadmap de pasos inmediatos para el lanzamiento en producción.
6. **[05_PLAN_MAESTRO_CANA_ROCK.md](./05_PLAN_MAESTRO_CANA_ROCK.md):**
   Incorporación incremental de Cana Rock al sistema multiempresa: alianzas, permisos por proyecto, conector de inventario, migración de datos, CRM, propuestas, dossiers, estadísticas y ciclo continuo de análisis, ejecución y auditoría.

### Evidencia de Cana Rock

- **[Inventario técnico](./cana-rock/01_INVENTARIO_TECNICO.md):** base, conteos, relaciones, activos y disponibilidad.
- **[Matriz de paridad](./cana-rock/02_MATRIZ_PARIDAD_FUNCIONAL.md):** capacidades existentes, parciales y pendientes por fase.
- **[Matriz de acceso](./cana-rock/03_MATRIZ_ACCESO_BORRADOR.md):** roles, capacidades y casos de aislamiento.
- **[Registro de ciclos](./cana-rock/04_REGISTRO_CICLOS.md):** ejecución, auditoría, decisiones y próximos pases.
- **[Decisiones aprobadas](./cana-rock/05_DECISIONES_APROBADAS.md):** acuerdos de negocio convertidos en reglas de arquitectura.

---

## Protocolo de Actualización Continua

- Toda nueva decisión técnica o comercial se registra en `03_ROADMAP_Y_DECISIONES.md`.
- Si se modifica la estructura de datos o flujos de usuario, se actualiza `02_DATOS_Y_FLUJOS.md`.
- Si cambian los permisos o roles, se actualiza `01_ROLES_Y_PERMISOS.md`.
- Si evoluciona la visión o módulos del producto, se actualiza `00_PRODUCTO_MAESTRO.md`.
- `04_PLAN_MAESTRO_IMPLEMENTACION.md` se mantiene como la guía técnica ejecutiva de despliegue y validación de calidad.
- `05_PLAN_MAESTRO_CANA_ROCK.md` registra cada ciclo y criterio de salida de la incorporación de Cana Rock.

---

## Referencias Técnicas y de Diseño
- **Backend & DB:** Supabase Postgres (43 tablas, RLS, Functions, Triggers, Storage).
- **Frontend:** Next.js 16 (App Router, Turbopack, React 19, TypeScript, Tailwind CSS).
- **Referencia CRM & Contactos:** Arquitectura de contactos, Smart Lists y Ficha 360 de GoHighLevel (GHL).
- **Identidad Visual:** Superficies claras/blancas, acentos azul marino (`#0c094e` y `#2563eb`), microinteracciones ágiles y personalización mediante variables CSS.
