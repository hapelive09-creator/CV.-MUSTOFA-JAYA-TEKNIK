import {
  Customer,
  InventoryItem,
  JobOrder,
  PaymentStatus,
  TechnicalSpecs,
  Technician,
} from '../types';
import { WORKSHOP_PROFILE } from '../data/mockData';
import { calculateWireArea, formatRupiah } from './rewindingCalculators';

function escapeHtml(value: string | number | undefined | null): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SHARED_PRINT_CSS = `
  @page {
    size: A4 portrait;
    margin: 12mm 14mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
    font-size: 10pt;
    line-height: 1.45;
    padding: 8px;
  }
  .header-table {
    width: 100%;
    border-bottom: 2.5px solid #0f172a;
    padding-bottom: 8px;
    margin-bottom: 12px;
    border-collapse: collapse;
  }
  .company-title {
    font-size: 15pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.3px;
  }
  .company-subtitle {
    font-size: 9.5pt;
    font-weight: 700;
    color: #b45309;
    margin-top: 1px;
  }
  .company-desc {
    font-size: 8pt;
    color: #475569;
    margin-top: 3px;
  }
  .doc-meta {
    text-align: right;
    vertical-align: top;
  }
  .doc-badge {
    font-size: 10pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #0f172a;
  }
  .doc-no {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10pt;
    font-weight: 700;
    color: #1e293b;
    margin-top: 2px;
  }
  .doc-sub {
    font-size: 8pt;
    color: #475569;
    margin-top: 2px;
  }
  .doc-banner {
    text-align: center;
    font-size: 11pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    margin: 8px 0 12px 0;
    padding: 5px 8px;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
  }
  .section-title {
    font-size: 9.5pt;
    font-weight: 700;
    text-transform: uppercase;
    color: #0f172a;
    margin: 12px 0 5px 0;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 2px;
    display: flex;
    justify-content: space-between;
  }
  .grid-table, .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    font-size: 8.5pt;
  }
  .grid-table td, .data-table th, .data-table td {
    border: 1px solid #cbd5e1;
    padding: 5px 7px;
    text-align: left;
    vertical-align: top;
  }
  .grid-table td {
    background: #f8fafc;
  }
  .data-table th {
    background: #e2e8f0;
    font-weight: 700;
    color: #1e293b;
  }
  .label {
    font-size: 7.5pt;
    color: #64748b;
    text-transform: uppercase;
    display: block;
    margin-bottom: 1px;
  }
  .val {
    font-weight: 700;
    color: #0f172a;
    font-size: 9pt;
  }
  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .right {
    text-align: right !important;
  }
  .center {
    text-align: center !important;
  }
  .summary-strip {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
  }
  .summary-strip td {
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    padding: 7px 10px;
    width: 33.33%;
  }
  .signatures {
    width: 100%;
    margin-top: 22px;
    text-align: center;
    font-size: 8.5pt;
    border-collapse: collapse;
  }
  .signatures td {
    vertical-align: top;
    padding: 0 10px;
  }
  .sig-line {
    margin-top: 48px;
    border-top: 1px solid #334155;
    font-weight: 700;
    padding-top: 3px;
  }
  .sig-role {
    font-size: 7.5pt;
    color: #64748b;
  }
`;

function renderLetterhead(badgeText: string, docNumber: string, metaLines: string[]): string {
  return `
    <table class="header-table">
      <tr>
        <td>
          <div class="company-title">${escapeHtml(WORKSHOP_PROFILE.companyName)}</div>
          <div class="company-subtitle">${escapeHtml(WORKSHOP_PROFILE.tagline)}</div>
          <div class="company-desc">
            ${escapeHtml(WORKSHOP_PROFILE.address)}, ${escapeHtml(WORKSHOP_PROFILE.city)}<br>
            Telp: ${escapeHtml(WORKSHOP_PROFILE.phone)} · WA: ${escapeHtml(WORKSHOP_PROFILE.whatsapp)} · Email: ${escapeHtml(WORKSHOP_PROFILE.email)}<br>
            ${escapeHtml(WORKSHOP_PROFILE.legalNumber)}
          </div>
        </td>
        <td class="doc-meta">
          <div class="doc-badge">${escapeHtml(badgeText)}</div>
          <div class="doc-no">${escapeHtml(docNumber)}</div>
          <div class="doc-sub">${metaLines.join('<br>')}</div>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Reliable hidden-iframe HTML print dispatcher (works inside embedded iframes without popup blockers).
 */
export function printHtmlDocument(html: string, title = 'Cetak Dokumen'): void {
  const existing = document.querySelectorAll('iframe[data-print-frame="true"]');
  existing.forEach((node) => node.remove());

  const iframe = document.createElement('iframe');
  iframe.setAttribute('data-print-frame', 'true');
  iframe.setAttribute('title', title);
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  iframe.style.pointerEvents = 'none';

  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    window.print();
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  };

  try {
    win.addEventListener('afterprint', cleanup, { once: true });
  } catch {
    // Ignore if listener cannot attach
  }

  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch (err) {
      console.warn('Iframe print failed, falling back to window.print', err);
      window.print();
    } finally {
      setTimeout(cleanup, 15000);
    }
  }, 200);
}

/**
 * Generates printable A4 Technical Rewinding Data Sheet HTML
 */
export function generateTechnicalSpecsHtml(
  job: JobOrder,
  specs: TechnicalSpecs
): string {
  const wireArea = calculateWireArea(specs.wireDiameterMm) * (specs.parallelWires || 1);
  const printDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Data Teknis Gulungan - ${escapeHtml(job.id)}</title>
  <style>${SHARED_PRINT_CSS}</style>
</head>
<body>
  ${renderLetterhead('LEMBAR DATA TEKNIS GULUNGAN', job.id, [
    `Tag Unit: <strong>${escapeHtml(job.customerUnitTag)}</strong>`,
    `Tgl Cetak: <strong>${escapeHtml(printDate)}</strong>`,
  ])}

  <div class="doc-banner">
    LEMBAR SPESIFIKASI REKAYASA TEKNIS GULUNGAN STATOR
  </div>

  <div class="section-title">
    <span>1. Spesifikasi Nameplate Motor Listrik</span>
    <span class="mono">SPK: ${escapeHtml(job.id)}</span>
  </div>
  <table class="grid-table">
    <tr>
      <td style="width:25%"><span class="label">Pelanggan / Pabrik</span><span class="val">${escapeHtml(job.customerCompany)}</span></td>
      <td style="width:25%"><span class="label">Merk / Manufaktur</span><span class="val">${escapeHtml(job.motorBrand)}</span></td>
      <td style="width:25%"><span class="label">Daya Motor</span><span class="val">${job.powerHp} HP (${job.powerKw} kW)</span></td>
      <td style="width:25%"><span class="label">Kecepatan &amp; Kutub</span><span class="val">${job.rpm} RPM (${job.poles} Pole)</span></td>
    </tr>
    <tr>
      <td><span class="label">Tegangan Kerja</span><span class="val">${escapeHtml(job.voltage)} (${job.phase}-Phase)</span></td>
      <td><span class="label">Tipe Hubungan</span><span class="val mono">${escapeHtml(job.connection)}</span></td>
      <td><span class="label">Frame Size</span><span class="val mono">${escapeHtml(job.frameSize)}</span></td>
      <td><span class="label">Nomor Seri</span><span class="val mono">${escapeHtml(job.serialNumber)}</span></td>
    </tr>
  </table>

  <div class="section-title">
    <span>2. Konstruksi Alur &amp; Kumparan Stator</span>
  </div>
  <table class="grid-table">
    <tr>
      <td style="width:33.3%"><span class="label">Jumlah Alur Stator (Slots)</span><span class="val mono">${specs.slots} Slot</span></td>
      <td style="width:33.3%"><span class="label">Tipe Gulungan Kumparan</span><span class="val">${escapeHtml(specs.windingType)}</span></td>
      <td style="width:33.3%"><span class="label">Langkah Alur (Pitch Span)</span><span class="val mono">${escapeHtml(specs.pitchSpan)}</span></td>
    </tr>
    <tr>
      <td><span class="label">Kumparan per Group</span><span class="val mono">${specs.coilsPerGroup} Coil/Group</span></td>
      <td><span class="label">Jumlah Lilitan per Alur</span><span class="val mono">${specs.turnsPerSlot} Turns</span></td>
      <td><span class="label">Diagram Sambungan Fasa</span><span class="val mono">${escapeHtml(specs.connectionDiagram)}</span></td>
    </tr>
  </table>

  <div class="section-title">
    <span>3. Spesifikasi Kawat Email Tembaga</span>
    <span class="mono">Luas Penampang Efektif: ${wireArea.toFixed(4)} mm²</span>
  </div>
  <table class="grid-table">
    <tr>
      <td style="width:25%"><span class="label">Diameter Kawat</span><span class="val mono">Ø ${specs.wireDiameterMm} mm</span></td>
      <td style="width:25%"><span class="label">Gauge Kawat (SWG)</span><span class="val mono">SWG ${specs.swg}</span></td>
      <td style="width:25%"><span class="label">Jumlah Kawat Paralel</span><span class="val mono">${specs.parallelWires} Rangkap</span></td>
      <td style="width:25%"><span class="label">Estimasi Berat Tembaga</span><span class="val mono">${specs.copperWeightKg} kg</span></td>
    </tr>
  </table>

  <div class="section-title">
    <span>4. Bahan Isolasi, Vernis Oven &amp; Bearing</span>
  </div>
  <table class="grid-table">
    <tr>
      <td style="width:33.3%"><span class="label">Kelas Isolasi Termal</span><span class="val">${escapeHtml(specs.insulationClass)}</span></td>
      <td style="width:33.3%"><span class="label">Isolasi Alur (Slot Liner)</span><span class="val">${escapeHtml(specs.slotInsulationType)}</span></td>
      <td style="width:33.3%"><span class="label">Tipe Vernis &amp; Baking</span><span class="val">${escapeHtml(specs.varnishType)}</span></td>
    </tr>
    <tr>
      <td><span class="label">Bearing Depan (DE)</span><span class="val mono">${escapeHtml(specs.bearingFrontType)}</span></td>
      <td><span class="label">Bearing Belakang (NDE)</span><span class="val mono">${escapeHtml(specs.bearingRearType)}</span></td>
      <td><span class="label">Kabel Keluar (Lead Wire)</span><span class="val">${escapeHtml(specs.leadWireSpec)}</span></td>
    </tr>
  </table>

  <table class="signatures">
    <tr>
      <td style="width:33.3%">
        <div>Teknisi Penggulung (Rewinder)</div>
        <div class="sig-line">(${escapeHtml(job.assignedTechnicians[0] || 'Teknisi Gulung')})</div>
        <div class="sig-role">Divisi Stator Winding</div>
      </td>
      <td style="width:33.3%">
        <div>Teknisi Mekanikal &amp; Bubut</div>
        <div class="sig-line">(Budi Hartono)</div>
        <div class="sig-role">Divisi Mekanikal</div>
      </td>
      <td style="width:33.3%">
        <div>Mengetahui, Kepala Bengkel</div>
        <div class="sig-line">(${escapeHtml(WORKSHOP_PROFILE.managerName)})</div>
        <div class="sig-role">${escapeHtml(WORKSHOP_PROFILE.companyName)}</div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates printable A4 Invoice or Quotation HTML
 */
export function generateInvoiceHtml(
  job: JobOrder,
  docType: 'invoice' | 'quotation',
  costs: JobOrder['costs'],
  paymentStatus: PaymentStatus,
  dpAmount: number
): string {
  const spkCode = job.id.split('-').pop() || '001';
  const year = new Date().getFullYear();
  const docNumber =
    docType === 'invoice' ? `INV/${year}/${spkCode}` : `QUO/${year}/${spkCode}`;
  const docTitle =
    docType === 'invoice' ? 'FAKTUR TAGIHAN' : 'SURAT PENAWARAN HARGA';
  const printDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const copperCost = costs.copperWireKg * costs.copperPricePerKg;
  const partsSubtotal =
    copperCost +
    costs.bearingFrontCost +
    costs.bearingRearCost +
    costs.insulationAndVarnishCost +
    costs.machiningCost +
    costs.transportCost;
  const subtotal = partsSubtotal + costs.laborCost;
  const taxAmount = (subtotal * costs.taxPercent) / 100;
  const grandTotal = subtotal + taxAmount;
  const remainingDue = grandTotal - dpAmount;

  let lineNo = 1;
  const rows: string[] = [
    `<tr>
      <td class="center">${lineNo++}</td>
      <td>
        <strong>Jasa Rewinding Stator &amp; Overhaul Total Motor Listrik</strong><br>
        <span style="font-size:8pt;color:#475569;">Bongkar-pasang, pembersihan core stator, lilit ulang kawat tembaga ${escapeHtml(job.technicalSpecs.insulationClass)}, perendaman vernis oven &amp; uji running test 60 menit.</span>
      </td>
      <td class="center">1 Unit</td>
      <td class="right mono">${escapeHtml(formatRupiah(costs.laborCost))}</td>
      <td class="right mono"><strong>${escapeHtml(formatRupiah(costs.laborCost))}</strong></td>
    </tr>`,
    `<tr>
      <td class="center">${lineNo++}</td>
      <td>
        <strong>Kawat Email Tembaga Murni Supreme / Essex (Ø ${job.technicalSpecs.wireDiameterMm} mm)</strong><br>
        <span style="font-size:8pt;color:#475569;">Standar tembaga murni 99.9% konduktivitas tinggi tahan panas 200°C.</span>
      </td>
      <td class="center mono">${costs.copperWireKg} kg</td>
      <td class="right mono">${escapeHtml(formatRupiah(costs.copperPricePerKg))}</td>
      <td class="right mono"><strong>${escapeHtml(formatRupiah(copperCost))}</strong></td>
    </tr>`,
    `<tr>
      <td class="center">${lineNo++}</td>
      <td>
        <strong>Penggantian Bearing Depan (Drive End)</strong><br>
        <span style="font-size:8pt;color:#475569;">Tipe: ${escapeHtml(job.technicalSpecs.bearingFrontType)}</span>
      </td>
      <td class="center">1 pcs</td>
      <td class="right mono">${escapeHtml(formatRupiah(costs.bearingFrontCost))}</td>
      <td class="right mono"><strong>${escapeHtml(formatRupiah(costs.bearingFrontCost))}</strong></td>
    </tr>`,
    `<tr>
      <td class="center">${lineNo++}</td>
      <td>
        <strong>Penggantian Bearing Belakang (Non-Drive End)</strong><br>
        <span style="font-size:8pt;color:#475569;">Tipe: ${escapeHtml(job.technicalSpecs.bearingRearType)}</span>
      </td>
      <td class="center">1 pcs</td>
      <td class="right mono">${escapeHtml(formatRupiah(costs.bearingRearCost))}</td>
      <td class="right mono"><strong>${escapeHtml(formatRupiah(costs.bearingRearCost))}</strong></td>
    </tr>`,
    `<tr>
      <td class="center">${lineNo++}</td>
      <td>
        <strong>Bahan Isolasi Nomex/DMD, Kabel Silikon &amp; Vernis Oven Baking</strong><br>
        <span style="font-size:8pt;color:#475569;">${escapeHtml(job.technicalSpecs.slotInsulationType)}, selongsong fiberglass &amp; resin.</span>
      </td>
      <td class="center">1 Lot</td>
      <td class="right mono">${escapeHtml(formatRupiah(costs.insulationAndVarnishCost))}</td>
      <td class="right mono"><strong>${escapeHtml(formatRupiah(costs.insulationAndVarnishCost))}</strong></td>
    </tr>`,
  ];

  if (costs.machiningCost > 0) {
    rows.push(`<tr>
      <td class="center">${lineNo++}</td>
      <td><strong>Jasa Bubut Dudukan Bearing / Balancing Dinamis Rotor</strong></td>
      <td class="center">1 Lot</td>
      <td class="right mono">${escapeHtml(formatRupiah(costs.machiningCost))}</td>
      <td class="right mono"><strong>${escapeHtml(formatRupiah(costs.machiningCost))}</strong></td>
    </tr>`);
  }

  if (costs.transportCost > 0) {
    rows.push(`<tr>
      <td class="center">${lineNo++}</td>
      <td><strong>Biaya Transportasi Antar-Jemput Unit Workshop ke Pabrik</strong></td>
      <td class="center">1 Trip</td>
      <td class="right mono">${escapeHtml(formatRupiah(costs.transportCost))}</td>
      <td class="right mono"><strong>${escapeHtml(formatRupiah(costs.transportCost))}</strong></td>
    </tr>`);
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(docTitle)} - ${escapeHtml(docNumber)}</title>
  <style>${SHARED_PRINT_CSS}</style>
</head>
<body>
  ${renderLetterhead(docTitle, `No: ${docNumber}`, [
    `Tanggal: <strong>${escapeHtml(printDate)}</strong>`,
    `Ref SPK: <strong class="mono">${escapeHtml(job.id)}</strong> · Status: <strong>${escapeHtml(paymentStatus)}</strong>`,
  ])}

  <table class="grid-table">
    <tr>
      <td style="width:50%">
        <span class="label">Ditujukan Kepada (Pelanggan):</span>
        <div class="val" style="font-size:10pt;">${escapeHtml(job.customerCompany)}</div>
        <div>PIC: ${escapeHtml(job.customerName)}</div>
        <div style="color:#475569;">Telp: ${escapeHtml(job.customerPhone)}</div>
      </td>
      <td style="width:50%">
        <span class="label">Identitas Unit Motor Listrik:</span>
        <div class="val">${escapeHtml(job.motorBrand)} · ${job.powerHp} HP (${job.powerKw} kW) · ${job.rpm} RPM</div>
        <div>Tegangan: ${escapeHtml(job.voltage)} · Frame: ${escapeHtml(job.frameSize)} · Pole: ${job.poles}P</div>
        <div class="mono" style="color:#475569;">Tag: <strong>${escapeHtml(job.customerUnitTag)}</strong> (SN: ${escapeHtml(job.serialNumber)})</div>
      </td>
    </tr>
  </table>

  <table class="data-table">
    <thead>
      <tr>
        <th class="center" style="width:32px">No</th>
        <th>Uraian Pekerjaan / Material Suku Cadang</th>
        <th class="center" style="width:72px">Jumlah</th>
        <th class="right" style="width:110px">Harga Satuan</th>
        <th class="right" style="width:115px">Total Harga</th>
      </tr>
    </thead>
    <tbody>
      ${rows.join('\n')}
    </tbody>
  </table>

  <table class="grid-table" style="margin-top: 10px;">
    <tr>
      <td style="width:52%; background:#f8fafc;">
        <span class="label">Instruksi Pembayaran Transfer Bank:</span>
        <div style="margin-top:4px;">Bank Tujuan: <strong>${escapeHtml(WORKSHOP_PROFILE.bankAccount.bankName)}</strong></div>
        <div>Nomor Rekening: <strong class="mono">${escapeHtml(WORKSHOP_PROFILE.bankAccount.accountNumber)}</strong></div>
        <div>Atas Nama: <strong>${escapeHtml(WORKSHOP_PROFILE.bankAccount.accountHolder)}</strong></div>
        <div style="font-size:7.5pt; color:#64748b; margin-top:6px;">
          * Mohon cantumkan nomor dokumen <strong>${escapeHtml(docNumber)}</strong> pada berita transfer.
        </div>
      </td>
      <td style="width:48%; background:#ffffff;">
        <table style="width:100%; border-collapse:collapse; font-size:8.5pt;">
          <tr>
            <td style="border:none; padding:2px 0; background:none;">Subtotal Jasa &amp; Suku Cadang:</td>
            <td style="border:none; padding:2px 0; background:none;" class="right mono"><strong>${escapeHtml(formatRupiah(subtotal))}</strong></td>
          </tr>
          <tr>
            <td style="border:none; padding:2px 0; background:none;">PPN (${costs.taxPercent}%):</td>
            <td style="border:none; padding:2px 0; background:none;" class="right mono">${escapeHtml(formatRupiah(taxAmount))}</td>
          </tr>
          <tr>
            <td style="border:none; border-top:2px solid #0f172a; padding:5px 0 2px 0; background:none; font-weight:800;">TOTAL AKHIR:</td>
            <td style="border:none; border-top:2px solid #0f172a; padding:5px 0 2px 0; background:none; font-weight:800; font-size:10pt; color:#1d4ed8;" class="right mono">${escapeHtml(formatRupiah(grandTotal))}</td>
          </tr>
          ${
            dpAmount > 0
              ? `<tr>
                  <td style="border:none; padding:2px 0; background:none; color:#15803d;">Uang Muka (DP) Diterima:</td>
                  <td style="border:none; padding:2px 0; background:none; color:#15803d;" class="right mono">- ${escapeHtml(formatRupiah(dpAmount))}</td>
                </tr>
                <tr>
                  <td style="border:none; border-top:1px solid #cbd5e1; padding:4px 0 0 0; background:none; font-weight:700;">SISA TAGIHAN:</td>
                  <td style="border:none; border-top:1px solid #cbd5e1; padding:4px 0 0 0; background:none; font-weight:700; color:#b45309;" class="right mono">${escapeHtml(formatRupiah(remainingDue))}</td>
                </tr>`
              : ''
          }
        </table>
      </td>
    </tr>
  </table>

  <table class="signatures">
    <tr>
      <td style="width:50%">
        <div>Tanda Terima Pelanggan / Pabrik</div>
        <div class="sig-line">(${escapeHtml(job.customerName)})</div>
        <div class="sig-role">${escapeHtml(job.customerCompany)}</div>
      </td>
      <td style="width:50%">
        <div>Hormat Kami, ${escapeHtml(WORKSHOP_PROFILE.companyName)}</div>
        <div class="sig-line">(${escapeHtml(WORKSHOP_PROFILE.managerName)})</div>
        <div class="sig-role">Pimpinan / Direktur Utama</div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates printable A4 Financial Recap Report HTML for InvoicesListView
 */
export function generateFinancialRecapHtml(
  filteredJobs: JobOrder[],
  allJobs: JobOrder[],
  filterStatus: string
): string {
  let totalRevenue = 0;
  let totalPaid = 0;
  let totalPending = 0;

  allJobs.forEach((job) => {
    const copperCost = job.costs.copperWireKg * job.costs.copperPricePerKg;
    const parts =
      copperCost +
      job.costs.bearingFrontCost +
      job.costs.bearingRearCost +
      job.costs.insulationAndVarnishCost +
      job.costs.machiningCost +
      job.costs.transportCost;
    const subtotal = parts + job.costs.laborCost;
    const grand = subtotal + (subtotal * job.costs.taxPercent) / 100;

    totalRevenue += grand;
    if (job.paymentStatus === 'Lunas') {
      totalPaid += grand;
    } else if (job.paymentStatus === 'DP Diterima') {
      const dp = job.dpAmount || 0;
      totalPaid += dp;
      totalPending += grand - dp;
    } else {
      totalPending += grand;
    }
  });

  const year = new Date().getFullYear();
  const printDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const tableRows = filteredJobs
    .map((job) => {
      const copperCost = job.costs.copperWireKg * job.costs.copperPricePerKg;
      const parts =
        copperCost +
        job.costs.bearingFrontCost +
        job.costs.bearingRearCost +
        job.costs.insulationAndVarnishCost +
        job.costs.machiningCost +
        job.costs.transportCost;
      const subtotal = parts + job.costs.laborCost;
      const grandTotal = subtotal + (subtotal * job.costs.taxPercent) / 100;
      const spkCode = job.id.split('-').pop() || '001';
      const invNo = `INV/${year}/${spkCode}`;

      return `<tr>
        <td class="mono"><strong>${escapeHtml(invNo)}</strong><br><span style="font-size:7.5pt;color:#64748b;">${escapeHtml(job.id)}</span></td>
        <td><strong>${escapeHtml(job.customerCompany)}</strong><br><span style="font-size:7.5pt;color:#64748b;">${escapeHtml(job.customerName)}</span></td>
        <td>${escapeHtml(job.motorBrand)} ${job.powerHp} HP<br><span style="font-size:7.5pt;color:#64748b;">${escapeHtml(job.customerUnitTag)}</span></td>
        <td class="right mono">${escapeHtml(formatRupiah(job.costs.laborCost))}</td>
        <td class="right mono">${escapeHtml(formatRupiah(parts))}</td>
        <td class="right mono"><strong>${escapeHtml(formatRupiah(grandTotal))}</strong></td>
        <td class="center">${escapeHtml(job.paymentStatus)}</td>
      </tr>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Rekap Keuangan &amp; Tagihan - CV. Mustofa Jaya Teknik</title>
  <style>${SHARED_PRINT_CSS}</style>
</head>
<body>
  ${renderLetterhead('REKAPITULASI KEUANGAN & TAGIHAN', `RKP/${year}/FIN`, [
    `Tanggal Cetak: <strong>${escapeHtml(printDate)}</strong>`,
    `Filter Status: <strong>${filterStatus === 'all' ? 'Semua Status' : escapeHtml(filterStatus)}</strong>`,
  ])}

  <div class="doc-banner">LAPORAN REKAPITULASI FAKTUR TAGIHAN &amp; PIUTANG BENGKEL</div>

  <table class="summary-strip">
    <tr>
      <td><span class="label">Total Nilai Tagihan (Omset)</span><span class="val mono">${escapeHtml(formatRupiah(totalRevenue))}</span></td>
      <td><span class="label">Kas Diterima (Lunas &amp; DP)</span><span class="val mono" style="color:#15803d;">${escapeHtml(formatRupiah(totalPaid))}</span></td>
      <td><span class="label">Piutang / Menunggu Pembayaran</span><span class="val mono" style="color:#b45309;">${escapeHtml(formatRupiah(totalPending))}</span></td>
    </tr>
  </table>

  <table class="data-table">
    <thead>
      <tr>
        <th>No. Faktur / SPK</th>
        <th>Pelanggan / Pabrik</th>
        <th>Unit Motor</th>
        <th class="right">Jasa</th>
        <th class="right">Parts &amp; Kawat</th>
        <th class="right">Total (Incl. PPN)</th>
        <th class="center">Status</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows || '<tr><td colspan="7" class="center">Tidak ada data faktur pada filter ini.</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;
}

/**
 * Generates printable A4 Report for whichever main tab is active when clicking the global Header print button
 */
export function generateActiveViewReportHtml(
  currentTab: string,
  data: {
    jobs: JobOrder[];
    inventory: InventoryItem[];
    customers: Customer[];
    technicians: Technician[];
  }
): string {
  const printDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const year = new Date().getFullYear();

  if (currentTab === 'invoices') {
    return generateFinancialRecapHtml(data.jobs, data.jobs, 'all');
  }

  if (currentTab === 'inventory') {
    const lowStock = data.inventory.filter((i) => i.stock <= i.minStockAlert);
    const totalValuation = data.inventory.reduce((sum, i) => sum + i.stock * i.unitPrice, 0);
    const rows = data.inventory
      .map(
        (item) => `<tr>
        <td class="mono"><strong>${escapeHtml(item.code)}</strong></td>
        <td><strong>${escapeHtml(item.name)}</strong><br><span style="font-size:7.5pt;color:#64748b;">Rak: ${escapeHtml(item.location)}</span></td>
        <td>${escapeHtml(item.category)}</td>
        <td class="right mono">${item.stock} ${escapeHtml(item.unit)}</td>
        <td class="right mono">${item.minStockAlert} ${escapeHtml(item.unit)}</td>
        <td class="right mono">${escapeHtml(formatRupiah(item.unitPrice))}</td>
        <td class="right mono"><strong>${escapeHtml(formatRupiah(item.stock * item.unitPrice))}</strong></td>
      </tr>`
      )
      .join('\n');

    return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><title>Laporan Stok Gudang Material</title><style>${SHARED_PRINT_CSS}</style></head>
<body>
  ${renderLetterhead('LAPORAN STOK GUDANG MATERIAL', `INV/${year}/STK`, [
    `Tanggal Cetak: <strong>${escapeHtml(printDate)}</strong>`,
    `Total SKU: <strong>${data.inventory.length} Item</strong>`,
  ])}
  <div class="doc-banner">INVENTORI KAWAT EMAIL, BEARING &amp; BAHAN ISOLASI</div>
  <table class="summary-strip">
    <tr>
      <td><span class="label">Total SKU Material</span><span class="val mono">${data.inventory.length} SKU</span></td>
      <td><span class="label">Total Valuasi Stok</span><span class="val mono">${escapeHtml(formatRupiah(totalValuation))}</span></td>
      <td><span class="label">Stok Menipis (&le; Min)</span><span class="val mono" style="color:#b91c1c;">${lowStock.length} Item</span></td>
    </tr>
  </table>
  <table class="data-table">
    <thead>
      <tr>
        <th>Kode SKU</th>
        <th>Nama Material &amp; Lokasi</th>
        <th>Kategori</th>
        <th class="right">Stok</th>
        <th class="right">Min. Alert</th>
        <th class="right">Harga Satuan</th>
        <th class="right">Nilai Stok</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
  }

  if (currentTab === 'customers') {
    const customerRows = data.customers
      .map(
        (c) => `<tr>
        <td class="mono">${escapeHtml(c.id)}</td>
        <td><strong>${escapeHtml(c.company)}</strong><br><span style="font-size:7.5pt;color:#64748b;">${escapeHtml(c.industryType)}</span></td>
        <td>${escapeHtml(c.name)}</td>
        <td class="mono">${escapeHtml(c.phone)}</td>
        <td>${escapeHtml(c.address)}</td>
        <td class="center mono"><strong>${c.totalJobs} SPK</strong></td>
      </tr>`
      )
      .join('\n');

    return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><title>Database Pelanggan Industri</title><style>${SHARED_PRINT_CSS}</style></head>
<body>
  ${renderLetterhead('DATABASE PELANGGAN & TEKNISI', `CRM/${year}/LIST`, [
    `Tanggal Cetak: <strong>${escapeHtml(printDate)}</strong>`,
    `Total Pelanggan: <strong>${data.customers.length} Perusahaan</strong>`,
  ])}
  <div class="doc-banner">DAFTAR PELANGGAN PABRIK &amp; TIM TEKNISI BENGKEL</div>
  <table class="data-table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Perusahaan / Industri</th>
        <th>PIC</th>
        <th>Telepon</th>
        <th>Alamat</th>
        <th class="center">Riwayat</th>
      </tr>
    </thead>
    <tbody>${customerRows}</tbody>
  </table>
</body>
</html>`;
  }

  const activeCount = data.jobs.filter(
    (j) => j.status !== 'siap_kirim' && j.status !== 'diserahkan'
  ).length;
  const completedCount = data.jobs.length - activeCount;

  const jobRows = data.jobs
    .map((job) => {
      const c = job.costs;
      const parts =
        c.copperWireKg * c.copperPricePerKg +
        c.bearingFrontCost +
        c.bearingRearCost +
        c.insulationAndVarnishCost +
        c.machiningCost +
        c.transportCost;
      const subtotal = parts + c.laborCost;
      const grand = subtotal + (subtotal * c.taxPercent) / 100;
      return `<tr>
        <td class="mono"><strong>${escapeHtml(job.id)}</strong><br><span style="font-size:7.5pt;color:#64748b;">${escapeHtml(job.orderDate)}</span></td>
        <td><strong>${escapeHtml(job.customerCompany)}</strong><br><span style="font-size:7.5pt;color:#64748b;">${escapeHtml(job.customerUnitTag)}</span></td>
        <td>${escapeHtml(job.motorBrand)} · ${job.powerHp} HP (${job.powerKw} kW)<br><span style="font-size:7.5pt;color:#64748b;">${job.rpm} RPM · ${escapeHtml(job.voltage)}</span></td>
        <td>${escapeHtml(job.status)}</td>
        <td>${escapeHtml(job.priority)}</td>
        <td class="right mono"><strong>${escapeHtml(formatRupiah(grand))}</strong></td>
      </tr>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><title>Laporan Operasional Bengkel Rewinding</title><style>${SHARED_PRINT_CSS}</style></head>
<body>
  ${renderLetterhead('LAPORAN OPERASIONAL BENGKEL', `OPS/${year}/${currentTab.toUpperCase()}`, [
    `Tanggal Cetak: <strong>${escapeHtml(printDate)}</strong>`,
    `Total SPK Tercatat: <strong>${data.jobs.length} Unit</strong>`,
  ])}
  <div class="doc-banner">RINGKASAN OPERASIONAL &amp; DAFTAR SPK MOTOR LISTRIK</div>
  <table class="summary-strip">
    <tr>
      <td><span class="label">Total SPK Bengkel</span><span class="val mono">${data.jobs.length} Unit</span></td>
      <td><span class="label">Unit Sedang Digarap</span><span class="val mono">${activeCount} Motor</span></td>
      <td><span class="label">Lolos QC &amp; Diserahkan</span><span class="val mono" style="color:#15803d;">${completedCount} Unit</span></td>
    </tr>
  </table>
  <table class="data-table">
    <thead>
      <tr>
        <th>No. SPK &amp; Tgl</th>
        <th>Pelanggan &amp; Tag</th>
        <th>Spesifikasi Motor</th>
        <th>Status</th>
        <th>Prioritas</th>
        <th class="right">Nilai Tagihan</th>
      </tr>
    </thead>
    <tbody>${jobRows}</tbody>
  </table>
</body>
</html>`;
}
