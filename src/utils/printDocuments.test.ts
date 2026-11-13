import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateTechnicalSpecsHtml,
  generateInvoiceHtml,
  generateFinancialRecapHtml,
  generateActiveViewReportHtml,
} from './printDocuments';
import {
  INITIAL_CUSTOMERS,
  INITIAL_INVENTORY,
  INITIAL_JOBS,
  INITIAL_TECHNICIANS,
} from '../data/mockData';

test('generateTechnicalSpecsHtml outputs full motor nameplate and winding specs', () => {
  const job = INITIAL_JOBS[0];
  const html = generateTechnicalSpecsHtml(job, job.technicalSpecs);

  assert.ok(html.includes('CV. MUSTOFA JAYA TEKNIK'));
  assert.ok(html.includes(job.id));
  assert.ok(html.includes(job.motorBrand));
  assert.ok(html.includes(`${job.technicalSpecs.slots} Slot`));
  assert.ok(html.includes(job.technicalSpecs.pitchSpan));
  assert.ok(html.includes(`${job.technicalSpecs.wireDiameterMm} mm`));
});

test('generateInvoiceHtml generates both invoice and quotation documents accurately', () => {
  const job = INITIAL_JOBS[0];
  const invoiceHtml = generateInvoiceHtml(
    job,
    'invoice',
    job.costs,
    job.paymentStatus,
    job.dpAmount || 0
  );
  assert.ok(invoiceHtml.includes('FAKTUR TAGIHAN'));
  assert.ok(invoiceHtml.includes('INV/'));
  assert.ok(invoiceHtml.includes(job.customerCompany));
  assert.ok(invoiceHtml.includes('Uang Muka (DP) Diterima'));

  const quotationHtml = generateInvoiceHtml(
    job,
    'quotation',
    job.costs,
    'Belum Ditagih',
    0
  );
  assert.ok(quotationHtml.includes('SURAT PENAWARAN HARGA'));
  assert.ok(quotationHtml.includes('QUO/'));
  assert.ok(!quotationHtml.includes('Uang Muka (DP) Diterima'));
});

test('generateFinancialRecapHtml outputs financial totals and invoice rows', () => {
  const html = generateFinancialRecapHtml(INITIAL_JOBS, INITIAL_JOBS, 'Lunas');
  assert.ok(html.includes('LAPORAN REKAPITULASI FAKTUR TAGIHAN'));
  assert.ok(html.includes('Lunas'));
  assert.ok(html.includes(INITIAL_JOBS[0].id));
  assert.ok(html.includes(INITIAL_JOBS[1].customerCompany));
});

test('generateActiveViewReportHtml generates context-specific reports for inventory, customers, and dashboard', () => {
  const payload = {
    jobs: INITIAL_JOBS,
    inventory: INITIAL_INVENTORY,
    customers: INITIAL_CUSTOMERS,
    technicians: INITIAL_TECHNICIANS,
  };

  const invHtml = generateActiveViewReportHtml('inventory', payload);
  assert.ok(invHtml.includes('LAPORAN STOK GUDANG MATERIAL'));
  assert.ok(invHtml.includes(INITIAL_INVENTORY[0].code));

  const custHtml = generateActiveViewReportHtml('customers', payload);
  assert.ok(custHtml.includes('DATABASE PELANGGAN &amp; TEKNISI'));
  assert.ok(custHtml.includes(INITIAL_CUSTOMERS[0].company));

  const dashHtml = generateActiveViewReportHtml('dashboard', payload);
  assert.ok(dashHtml.includes('LAPORAN OPERASIONAL BENGKEL'));
  assert.ok(dashHtml.includes(INITIAL_JOBS[0].id));
});
