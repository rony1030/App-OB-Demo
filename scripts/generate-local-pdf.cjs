const fs = require('fs');
const path = require('path');

require('./register-typescript.cjs');

const { generateAgreementPdf } = require('../lib/signatures/pdf-stamp.ts');

async function main() {
  const commissionTerms = 'Para Cipres Residences: 5% más ITBIS, pagadero a la firma del contrato cuando el cliente haya pagado el 0% del valor del inmueble.';

  const { bytes } = await generateAgreementPdf({
    masterBroker: {
      legalName: 'BELLO VALDEZ ENTERPRISE, SRL',
      taxId: '132558871',
      address: 'Calle Trinitarias Número 39, Mirador Del Oeste, Santo Domingo Oeste',
      repName: 'Gleivys Osvaldo Bello',
      repPosition: 'Gerente General',
      repId: null,
      repEmail: 'info@osvaldobello.com',
    },
    brokerOrg: {
      legalName: 'LUNOVI REALESTATE, S.R.L.',
      taxId: '1-32-19226-5',
      address: 'Plaza San Juan Shopping Center, Local E-6, Ave. Barceló, D.M.T. Verón-Punta Cana, Prov. La Altagracia',
    },
    signerName: 'Dr. Sabine Vicioso David',
    signerIdNumber: '402-5016067-4',
    project: {
      name: 'Cipres Residences',
      location: 'Cv de Verón - Bávaro 23000, Punta Cana 23000',
      developerName: 'KYSER',
    },
    developer: {
      legalName: 'KYSER',
      taxId: null,
      address: null,
    },
    commissionRate: 5,
    commissionTerms: commissionTerms,
    validMonths: 12,
    kind: 'project_specific',
  });

  const targetPath = 'C:\\Users\\Rony\\Downloads\\acuerdo\\Acuerdo_Colaboracion_Cipres_Lunovi.pdf';
  fs.writeFileSync(targetPath, Buffer.from(bytes));
  console.log('Saved agreement PDF directly to:', targetPath);
}

main().catch(console.error);
