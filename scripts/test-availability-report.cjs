require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { PDFDocument } = require('pdf-lib');
const { availabilityReport, availabilityTables } = require('../lib/availability/report.ts');
const { availabilityText } = require('../lib/availability/copy.ts');
const { buildAvailabilityPdf } = require('../lib/export/availability-pdf.ts');

const unit = { id:'1', unit:'A201', tower:'A', floor:2, type:'Apartamento', bedrooms:2, bathrooms:2, area:85, price:285890, currency:'USD', status:'Disponible', isPublic:true, customColumns:{parking:'1',external_id:'private-source-id'} };
const project = {name:'Cana Rock',slug:'cana-rock-universe',projectType:'building',lots:[],updatedAt:'29 septiembre 2026',customColumnsList:['parking','external_id'],units:[unit,{...unit,id:'2',unit:'A202',isPublic:false}]};
const report = availabilityReport(project);
assert.equal(report.units.length,1);
assert.deepEqual(report.customColumns,['parking']);
assert.equal(report.units[0].customColumns.external_id,undefined);
const table = availabilityTables(report)[0];
assert.ok(table.columns.includes('Precio'));
assert.ok(table.columns.includes('Área m²'));
assert.equal(table.rows[0][5],'85');
assert.match(table.rows[0][6],/285[,.]890/);
assert.equal(table.rows[0][4],'2 / 2 / 1');

const cipres = availabilityReport({...project,name:'Cipres',slug:'cipres-residences',customColumnsList:['AMBAR','PERLA','ESMERALDA','METROS CUADRADOS','Plazo de entrega'],units:[
  {...unit,unit:'M4 S3',price:116250,customColumns:{AMBAR:'USD$140,000',PERLA:'USD$123,750',ESMERALDA:'USD$116,250','METROS CUADRADOS':'204 M2','Plazo de entrega':'12 meses'}},
  {...unit,id:'3',unit:'M8 S3',price:116250,customColumns:{AMBAR:'USD$140,000',PERLA:'USD$123,750',ESMERALDA:'USD$116,250','METROS CUADRADOS':'204 M2','Plazo de entrega':'24 meses'}},
]});
const matrices = availabilityTables(cipres);
assert.equal(matrices.length,2);
assert.deepEqual(matrices[0].columns,['Unidad','METROS CUADRADOS','ESMERALDA','PERLA','AMBAR','Estado']);
assert.deepEqual(matrices[0].rows[0].slice(2,5),['USD$116,250','USD$123,750','USD$140,000']);
assert.equal(matrices[0].title,'Entrega: 12 meses');
assert.equal(matrices[1].title,'Entrega: 24 meses');
assert.equal(availabilityText('lot_sqm','es'),'Terreno m²');
assert.equal(availabilityText('Precio','en'),'Price');
assert.equal(availabilityText('Dossier pendiente de publicación','fr'),'Dossier en attente de publication');

const extras = availabilityTables({...report,customColumns:['deluxe_price'],units:[{...unit,customColumns:{deluxe_price:'300000'}}]});
assert.equal(extras.length,2);
assert.ok(extras[0].columns.includes('Precio'));
assert.match(extras[1].rows[0][1],/300[,.]000/);

(async()=>{
  const bytes = await buildAvailabilityPdf({...cipres,availabilityUrl:'https://brokers.osvaldobello.com/disponibilidad/cipres-residences'});
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(),2);
  for(const page of pdf.getPages()) assert.deepEqual(page.getSize(),{width:792,height:612});
  console.log('Availability report regression checks passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
