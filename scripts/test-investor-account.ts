import assert from 'node:assert/strict';
import { buildDemoUnit } from '../lib/data/investor-demo';
import { computeAccount } from '../lib/investor/account';
import { validatePaymentReport, validateReceiptFile } from '../lib/investor/payment-report';

const asOf = new Date(2026, 9, 3); // 3 oct 2026
const unit = (code: string) => {
  const u = buildDemoUnit(code, asOf);
  return { u, a: computeAccount({ price: u.price, installments: u.installments, deliveryStatus: u.deliveryStatus, collectionStatus: u.collectionStatus, asOf }) };
};

// Cliente 1 · CRS-204 al día
{
  const { u, a } = unit('CRS-204');
assert.equal(u.price, 178000);
assert.equal(a.operationalStatus, 'al_dia');
assert.equal(a.overdueCount, 0);
assert.equal(a.moraAmount, 0);
assert.equal(a.schedule[0].paidAmount + a.schedule[1].paidAmount, 35600); // reserva 3,000 + inicial 32,600
assert.equal(a.schedule[1].amount, 32600);
}

// Cliente 2 · CIP-301 al día / UVE-115 vencida / PV-408 legal
assert.equal(unit('CIP-301').a.operationalStatus, 'al_dia');
{
const { a } = unit('UVE-115');
assert.equal(a.operationalStatus, 'vencida');
assert.equal(a.overdueCount, 2);
assert.equal(a.overdueAmount, 7000);
assert.equal(a.moraAmount, 650);
}
{
const { a } = unit('PV-408');
assert.equal(a.operationalStatus, 'en_legal');
assert.ok(a.schedule.filter((r) => r.state === 'legal').length >= 6);
}

// Cliente 3 · CRS-101 entregada / PV-202 negociación al día / UVE-108 proceso de entrega
{
const { a } = unit('CRS-101');
assert.equal(a.operationalStatus, 'entregada');
assert.equal(a.remainingBalance, 0);
}
{
const { a } = unit('PV-202');
assert.equal(a.operationalStatus, 'negociacion');
assert.equal(a.overdueCount, 0);
}
{
const { a } = unit('UVE-108');
assert.equal(a.operationalStatus, 'proceso_entrega');
assert.equal(a.insolutoBalance, 120000);
assert.equal(a.overdueCount, 3);
assert.equal(a.overdueAmount, 12000);
assert.equal(a.moraAmount, 1800);
assert.equal(a.totalToDeliver, 133800);
}

// Los demo no caducan: misma conclusión con otra fecha de corte
const later = new Date(2027, 2, 20);
const u2 = buildDemoUnit('UVE-108', later);
assert.equal(computeAccount({ price: u2.price, installments: u2.installments, deliveryStatus: u2.deliveryStatus, collectionStatus: u2.collectionStatus, asOf: later }).totalToDeliver, 133800);

// Reporte de pago: validación
const today = '2026-10-03';
const base = { amount: 7650, paidAt: '2026-10-02', method: 'transferencia', reference: ' ABC123 ', note: '' };
assert.equal(validatePaymentReport(base, today).ok, true);
assert.equal(validatePaymentReport(base, today).value?.reference, 'ABC123');
assert.equal(validatePaymentReport({ ...base, amount: 0 }, today).ok, false);
assert.equal(validatePaymentReport({ ...base, amount: NaN }, today).ok, false);
assert.equal(validatePaymentReport({ ...base, paidAt: '2026-10-04' }, today).ok, false); // futura
assert.equal(validatePaymentReport({ ...base, paidAt: 'ayer' }, today).ok, false);
assert.equal(validatePaymentReport({ ...base, method: 'bitcoin' }, today).ok, false);
assert.equal(validateReceiptFile(null), null);
assert.equal(validateReceiptFile({ size: 1000, type: 'application/pdf' }), null);
assert.ok(validateReceiptFile({ size: 5 * 1024 * 1024, type: 'application/pdf' }));
assert.ok(validateReceiptFile({ size: 1000, type: 'application/zip' }));

// Investor Auth & OTP verification checks
import { generateOtpCode, hashValue, checkDemoAccessCode, isValidEmail, normalizeEmail } from '../lib/investor/auth';
const testCode = generateOtpCode(6);
assert.equal(testCode.length, 6);
assert.match(testCode, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
assert.equal(hashValue('abc'), hashValue('abc'));
assert.notEqual(hashValue('abc'), hashValue('def'));
assert.equal(isValidEmail('test@investor.com'), true);
assert.equal(isValidEmail('invalido'), false);
assert.equal(normalizeEmail('  Test@Investor.com '), 'test@investor.com');
assert.equal(checkDemoAccessCode(process.env.INVESTOR_DEMO_ACCESS_CODE || 'DEMO2026'), true);
assert.equal(checkDemoAccessCode('WRONG'), false);

console.log('test-investor-account: ok');
