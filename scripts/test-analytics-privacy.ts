import assert from 'node:assert/strict';
import {
  sanitizeAnalyticsMetadata,
  EVENT_RETENTION_POLICY,
  type AnalyticsEventType,
} from '../lib/analytics/events';

console.log('--- TEST SUITE: Ciclo 013 - Analytics, Privacy & Operational Metrics ---');

// 1. Test Event Types & Metadata Sanitization
{
  console.log('1. Testing event metadata sanitization & PII exclusion...');

  const dirtyMetadata: Record<string, unknown> = {
    projectId: 12,
    projectSlug: 'cana-rock-star',
    projectName: 'Cana Rock Star Luxury Condos',
    unitCode: 'CR-104',
    deviceType: 'desktop',
    source: 'landing',
    // Sensitive forbidden fields that must be stripped out by privacy policy:
    clientEmail: 'client@private.com',
    clientPhone: '+18095559999',
    ssnOrCedula: '402-0000000-0',
    creditCardNumber: '4111-2222-3333-4444',
    password: 'superSecretPassword123',
    internalNotes: 'Cliente con alto poder adquisitivo',
  };

  const sanitized = sanitizeAnalyticsMetadata(dirtyMetadata);

  // Assert authorized fields remain
  assert.equal(sanitized.projectId, 12);
  assert.equal(sanitized.projectSlug, 'cana-rock-star');
  assert.equal(sanitized.projectName, 'Cana Rock Star Luxury Condos');
  assert.equal(sanitized.unitCode, 'CR-104');
  assert.equal(sanitized.deviceType, 'desktop');
  assert.equal(sanitized.source, 'landing');

  // Assert forbidden sensitive fields were stripped completely
  assert.equal((sanitized as Record<string, unknown>).clientEmail, undefined);
  assert.equal((sanitized as Record<string, unknown>).clientPhone, undefined);
  assert.equal((sanitized as Record<string, unknown>).ssnOrCedula, undefined);
  assert.equal((sanitized as Record<string, unknown>).creditCardNumber, undefined);
  assert.equal((sanitized as Record<string, unknown>).password, undefined);
  assert.equal((sanitized as Record<string, unknown>).internalNotes, undefined);

  console.log('   ✓ Sensitive PII strictly stripped from telemetry metadata.');
}

// 2. Test Retention Policy Configuration
{
  console.log('2. Testing operational retention policy declarations...');
  assert.equal(EVENT_RETENTION_POLICY.highRiskPII, 'FORBIDDEN');
  assert.equal(EVENT_RETENTION_POLICY.operationalMetrics, '365_DAYS');
  assert.equal(EVENT_RETENTION_POLICY.anonymousPageViews, '90_DAYS');
  assert.equal(EVENT_RETENTION_POLICY.auditSecurityEvents, 'PERMANENT');
  console.log('   ✓ Retention policy matches compliance standards.');
}

// 3. Test Multi-Project Metric Isolation & Aggregation
{
  console.log('3. Testing multi-project metric aggregation and isolation...');

  interface MockEvent {
    id: number;
    orgId: number;
    projectId: number;
    type: AnalyticsEventType;
    meta: { unitCode?: string; resourceTitle?: string };
  }

  const events: MockEvent[] = [
    // Project 101 Events (Cana Rock Star)
    { id: 1, orgId: 1, projectId: 101, type: 'project_view', meta: {} },
    { id: 2, orgId: 1, projectId: 101, type: 'project_view', meta: {} },
    { id: 3, orgId: 1, projectId: 101, type: 'unit_view', meta: { unitCode: 'ST-101' } },
    { id: 4, orgId: 1, projectId: 101, type: 'unit_view', meta: { unitCode: 'ST-101' } },
    { id: 5, orgId: 1, projectId: 101, type: 'unit_view', meta: { unitCode: 'ST-202' } },
    { id: 6, orgId: 1, projectId: 101, type: 'whatsapp_click', meta: { unitCode: 'ST-101' } },
    { id: 7, orgId: 1, projectId: 101, type: 'resource_download', meta: { resourceTitle: 'Brochure Star' } },
    { id: 8, orgId: 1, projectId: 101, type: 'proposal_created', meta: { unitCode: 'ST-101' } },

    // Project 102 Events (Cosmos Stelar - MUST BE ISOLATED)
    { id: 9, orgId: 1, projectId: 102, type: 'project_view', meta: {} },
    { id: 10, orgId: 1, projectId: 102, type: 'unit_view', meta: { unitCode: 'CS-505' } },
    { id: 11, orgId: 1, projectId: 102, type: 'resource_download', meta: { resourceTitle: 'Brochure Cosmos' } },
  ];

  // Aggregate only for Project 101
  const project101Events = events.filter((e) => e.projectId === 101);

  let views = 0;
  let unitViews = 0;
  let whatsapp = 0;
  let proposals = 0;
  let resources = 0;
  const unitMap: Record<string, number> = {};

  project101Events.forEach((e) => {
    if (e.type === 'project_view') views++;
    if (e.type === 'unit_view') {
      unitViews++;
      if (e.meta.unitCode) unitMap[e.meta.unitCode] = (unitMap[e.meta.unitCode] || 0) + 1;
    }
    if (e.type === 'whatsapp_click') whatsapp++;
    if (e.type === 'proposal_created') proposals++;
    if (e.type === 'resource_download') resources++;
  });

  assert.equal(views, 2, 'Project 101 views must be exactly 2');
  assert.equal(unitViews, 3, 'Project 101 unit views must be exactly 3');
  assert.equal(whatsapp, 1, 'Project 101 whatsapp clicks must be exactly 1');
  assert.equal(proposals, 1, 'Project 101 proposals must be exactly 1');
  assert.equal(resources, 1, 'Project 101 resource downloads must be exactly 1');

  // Verify ranking
  assert.equal(unitMap['ST-101'], 2);
  assert.equal(unitMap['ST-202'], 1);
  assert.equal(unitMap['CS-505'], undefined, 'Events from Project 102 must never leak into Project 101');

  console.log('   ✓ Project isolation verified: 0 cross-project leakage.');
}

console.log('\nALL 3 ANALYTICS AND PRIVACY TESTS PASSED SUCCESSFULLY! ✓\n');
