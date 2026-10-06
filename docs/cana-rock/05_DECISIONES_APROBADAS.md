# Decisiones aprobadas — incorporación de Cana Rock

## DEC-001 — Separación entre master broker y desarrollador

**Estado:** Aprobada<br>
**Fecha:** 3 de septiembre de 2026

### Decisión

Cana Rock se modelará con dos organizaciones relacionadas:

1. **Cana Rock / Osvaldo Bello** — organización de tipo `master_broker`.
2. **Grupo Cana Rock** — organización de tipo `developer`.

La relación será `master_broker_for`, con Cana Rock / Osvaldo Bello como organización origen y Grupo Cana Rock como organización destino.

### Consecuencias

- Los proyectos serán administrados comercialmente por el master broker y asociados a Grupo Cana Rock como desarrollador.
- Osvaldo Bello será una membresía con responsabilidad primaria, no una llave técnica ni un nombre codificado en la autorización.
- El desarrollador podrá consultar o administrar únicamente las capacidades acordadas para sus proyectos.
- El desarrollador no obtiene acceso automático al CRM completo del master broker.
- Agencias, aliados y brokers recibirán acceso mediante `project_access` y capacidades específicas.
- El mismo modelo funcionará con futuros master brokers y desarrolladores.

### Implementación preparada

- `organization_relationships`: vínculo formal entre organizaciones.
- `project_responsibilities`: responsable primario o secundario por proyecto y periodo.
- `project_access_capabilities`: capacidades granulares que complementan un acceso existente.
- `private.can_manage_project_configuration`: validación central para administrar responsables y capacidades.

La creación de usuarios reales, organizaciones productivas y proyectos Cana Rock se hará después de probar RLS y aprobar los datos legales/comerciales mínimos.
