import assert from 'node:assert/strict';
import {
  calculateCommercialSchedule,
  buildFrozenProposalSnapshot,
  type SimulatorUnitData,
  type SimulatorPlanConfig,
} from '../lib/proposals/simulator';

console.log('--- TEST SUITE: Commercial Simulator & Proposal Snapshots ---');

// 1. Test standard schedule calculation in USD
{
  console.log('1. Testing standard USD commercial schedule...');
  const price = 200000;
  const config: SimulatorPlanConfig = {
    reservationAmount: 5000,
    initialPercentage: 20, // 20% = 40,000 => initial balance = 40,000 - 5,000 = 35,000
    duringConstructionPercentage: 30, // 30% = 60,000
    uponDeliveryPercentage: 50, // 50% = 100,000
    constructionMonths: 24,
  };

  const schedule = calculateCommercialSchedule(price, config);

  assert.equal(schedule.reservationAmount, 5000);
  assert.equal(schedule.initialAmount, 35000);
  assert.equal(schedule.duringConstructionAmount, 60000);
  assert.equal(schedule.uponDeliveryAmount, 100000);
  assert.equal(schedule.monthlyInstallmentAmount, 2500); // 60000 / 24

  const totalSum =
    schedule.reservationAmount +
    schedule.initialAmount +
    schedule.duringConstructionAmount +
    schedule.uponDeliveryAmount;
  assert.equal(totalSum, price, 'Sum of all payment milestones must equal total price');
  assert.equal(schedule.steps.length, 4);
  console.log('   ✓ USD schedule calculation verified.');
}

// 2. Test DOP and EUR currency support
{
  console.log('2. Testing DOP & EUR multi-currency calculation...');
  const dopPrice = 15000000;
  const dopConfig: SimulatorPlanConfig = {
    reservationAmount: 200000,
    initialPercentage: 10, // 1,500,000 => initial balance 1,300,000
    duringConstructionPercentage: 40, // 6,000,000
    uponDeliveryPercentage: 50, // 7,500,000
    constructionMonths: 20,
  };
  const dopSchedule = calculateCommercialSchedule(dopPrice, dopConfig);
  assert.equal(dopSchedule.reservationAmount, 200000);
  assert.equal(dopSchedule.initialAmount, 1300000);
  assert.equal(dopSchedule.duringConstructionAmount, 6000000);
  assert.equal(dopSchedule.uponDeliveryAmount, 7500000);
  assert.equal(dopSchedule.monthlyInstallmentAmount, 300000);
  console.log('   ✓ DOP schedule calculation verified.');

  const eurPrice = 350000;
  const eurConfig: SimulatorPlanConfig = {
    reservationAmount: 10000,
    initialPercentage: 20, // 70,000 => 60,000
    duringConstructionPercentage: 30, // 105,000
    uponDeliveryPercentage: 50, // 175,000
  };
  const eurSchedule = calculateCommercialSchedule(eurPrice, eurConfig);
  assert.equal(eurSchedule.reservationAmount, 10000);
  assert.equal(eurSchedule.initialAmount, 60000);
  assert.equal(eurSchedule.duringConstructionAmount, 105000);
  assert.equal(eurSchedule.uponDeliveryAmount, 175000);
  console.log('   ✓ EUR schedule calculation verified.');
}

// 3. Test Frozen Proposal Snapshot generation & Immutability
{
  console.log('3. Testing frozen proposal snapshot & immutability...');
  const unit: SimulatorUnitData = {
    id: 'unit-cana-rock-space-302',
    unitCode: 'CR-302',
    price: 260099,
    currency: 'USD',
    floor: 3,
    tower: 'Torre Vista',
    type: '2 Habitaciones',
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 95.4,
    deliveryDate: 'Diciembre 2026',
  };

  const planConfig: SimulatorPlanConfig = {
    reservationAmount: 5000,
    initialPercentage: 20,
    duringConstructionPercentage: 30,
    uponDeliveryPercentage: 50,
    constructionMonths: 18,
  };

  const snapshot = buildFrozenProposalSnapshot({
    title: 'Propuesta Personalizada - Cana Rock Space #302',
    projectSlug: 'cana-rock-space',
    projectName: 'Cana Rock Space',
    clientName: 'Carlos Mendoza',
    clientEmail: 'carlos.mendoza@email.com',
    clientPhone: '+18095554321',
    unit,
    planConfig,
    validDays: 15,
    approvedDocuments: [
      {
        title: 'Brochure Comercial Cana Rock Space',
        category: 'Comercial',
        versionNumber: 1,
        storagePath: 'cana-rock/brochure.pdf',
      },
    ],
    branding: {
      organizationName: 'OB Brokers',
      primaryColor: '#0052cc',
    },
  });

  // Verify frozen fields
  assert.equal(snapshot.unit.unitCode, 'CR-302');
  assert.equal(snapshot.unit.price, 260099);
  assert.equal(snapshot.unit.currency, 'USD');
  assert.equal(snapshot.client.name, 'Carlos Mendoza');
  assert.equal(snapshot.approvedDocuments.length, 1);
  assert.equal(snapshot.branding.organizationName, 'OB Brokers');
  assert.ok(snapshot.asOfDate);
  assert.ok(snapshot.validUntil > snapshot.asOfDate);

  // 4. Test Snapshot Immutability
  // Modifying the source unit or config does not mutate the snapshot
  unit.price = 999999;
  unit.unitCode = 'MUTATED';
  planConfig.reservationAmount = 99999;

  assert.equal(snapshot.unit.price, 260099, 'Snapshot unit price must remain unchanged');
  assert.equal(snapshot.unit.unitCode, 'CR-302', 'Snapshot unitCode must remain unchanged');
  assert.equal(snapshot.paymentPlan.reservationAmount, 5000, 'Snapshot reservation amount must remain unchanged');
  console.log('   ✓ Snapshot immutability verified.');
}

console.log('\nALL PROPOSAL SIMULATOR TESTS PASSED SUCCESSFULLY! ✓\n');
