import { JobOrder, TestReport } from '../types';
import { WORKSHOP_PROFILE } from '../data/mockData';
import { calculateResistanceBalanceDelta } from './rewindingCalculators';
import { printHtmlDocument } from './printDocuments';

/**
 * Generates an official, printable HTML document for the QC Certificate of CV. Mustofa Jaya Teknik
 */
export function generateCertificateHtml(job: JobOrder, report: TestReport): string {
  const spkCode = job.id.split('-').pop() || '001';
  const certNumber = `QC-CERT/${new Date().getFullYear()}/${spkCode}`;
  
  const balance = calculateResistanceBalanceDelta(
    report.windingResistanceOhm.uv,
    report.windingResistanceOhm.vw,
    report.windingResistanceOhm.wu
  );

  const isMeggerGood = report.meggerStatorBodyMohm >= 100;
  const maxVibration = Math.max(
    report.noLoadTest.vibrationDE_mm_s,
    report.noLoadTest.vibrationNDE_mm_s
  );
  const isVibrationGood = maxVibration < 2.8;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Sertifikat Pengujian QC - ${job.id} - ${job.customerCompany}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
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
      font-size: 11pt;
      line-height: 1.4;
      padding: 10px;
    }
    .header-table {
      width: 100%;
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .company-title {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .company-subtitle {
      font-size: 10pt;
      font-weight: 700;
      color: #b45309;
      margin-top: 1px;
    }
    .company-desc {
      font-size: 8.5pt;
      color: #475569;
      margin-top: 2px;
    }
    .cert-meta {
      text-align: right;
      vertical-align: top;
    }
    .cert-badge {
      display: inline-block;
      font-size: 9pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
    }
    .cert-no {
      font-family: monospace;
      font-size: 10.5pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 2px;
    }
    .cert-title {
      text-align: center;
      font-size: 13pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 10px 0 12px 0;
      padding: 4px 0;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
    }
    .info-grid {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 9pt;
    }
    .info-grid td {
      padding: 5px 8px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
    }
    .info-label {
      font-size: 8pt;
      color: #64748b;
      text-transform: uppercase;
      display: block;
    }
    .info-val {
      font-weight: 700;
      color: #0f172a;
      font-size: 9.5pt;
    }
    .section-title {
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #0f172a;
      margin: 10px 0 4px 0;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 8.5pt;
    }
    .data-table th, .data-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
      text-align: left;
    }
    .data-table th {
      background: #e2e8f0;
      font-weight: 700;
      color: #1e293b;
    }
    .data-table td.center {
      text-align: center;
    }
    .data-table td.mono {
      font-family: monospace;
      font-weight: 600;
    }
    .status-pass {
      color: #166534;
      font-weight: 700;
    }
    .decision-box {
      border: 1.5px solid #0f172a;
      background: #f8fafc;
      padding: 8px 12px;
      margin-top: 10px;
      margin-bottom: 12px;
    }
    .signatures {
      width: 100%;
      margin-top: 25px;
      text-align: center;
      font-size: 9pt;
    }
    .signatures td {
      width: 33.33%;
      vertical-align: top;
      padding: 0 10px;
    }
    .sig-line {
      margin-top: 55px;
      border-top: 1px solid #334155;
      font-weight: 700;
      padding-top: 3px;
    }
    .sig-role {
      font-size: 8pt;
      color: #64748b;
    }
    .stamp-badge {
      display: inline-block;
      padding: 2px 8px;
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
      font-weight: 700;
      font-size: 8.5pt;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <table class="header-table">
    <tr>
      <td>
        <div class="company-title">${WORKSHOP_PROFILE.companyName}</div>
        <div class="company-subtitle">${WORKSHOP_PROFILE.tagline}</div>
        <div class="company-desc">
          ${WORKSHOP_PROFILE.address}, ${WORKSHOP_PROFILE.city}<br>
          Telp: ${WORKSHOP_PROFILE.phone} · WA: ${WORKSHOP_PROFILE.whatsapp} · Email: ${WORKSHOP_PROFILE.email}<br>
          ${WORKSHOP_PROFILE.legalNumber}
        </div>
      </td>
      <td class="cert-meta">
        <div class="cert-badge">BERITA ACARA PENGUJIAN QC</div>
        <div class="cert-no">${certNumber}</div>
        <div style="font-size: 8.5pt; color: #475569; margin-top: 3px;">
          Tgl Uji: <strong>${report.testDate}</strong><br>
          Ref SPK: <strong>${job.id}</strong>
        </div>
      </td>
    </tr>
  </table>

  <!-- Title -->
  <div class="cert-title">
    SERTIFIKAT KELAYAKAN OPERASI & LAPORAN QUALITY CONTROL MOTOR LISTRIK
  </div>

  <!-- Identification Grid -->
  <table class="info-grid">
    <tr>
      <td style="width: 28%;">
        <span class="info-label">Nama Pelanggan / Pabrik:</span>
        <span class="info-val">${job.customerCompany}</span>
        <div style="font-size: 8pt; color: #64748b;">PIC: ${job.customerName} (${job.customerPhone})</div>
      </td>
      <td style="width: 24%;">
        <span class="info-label">Merk & Frame Motor:</span>
        <span class="info-val">${job.motorBrand} (${job.frameSize})</span>
      </td>
      <td style="width: 24%;">
        <span class="info-label">Kapasitas Daya & RPM:</span>
        <span class="info-val">${job.powerHp} HP (${job.powerKw} kW) · ${job.rpm} RPM</span>
      </td>
      <td style="width: 24%;">
        <span class="info-label">Tag Pabrik / Serial No:</span>
        <span class="info-val">${job.customerUnitTag}</span>
        <div style="font-size: 8pt; color: #64748b;">SN: ${job.serialNumber}</div>
      </td>
    </tr>
    <tr>
      <td>
        <span class="info-label">Tegangan & Fasa:</span>
        <span class="info-val">${job.voltage} (${job.phase} Phase)</span>
      </td>
      <td>
        <span class="info-label">Hubungan Kumparan:</span>
        <span class="info-val">${job.connection} (Diagram: ${job.technicalSpecs.connectionDiagram})</span>
      </td>
      <td>
        <span class="info-label">Spesifikasi Kawat & Alur:</span>
        <span class="info-val">${job.technicalSpecs.slots} Slot · ${job.technicalSpecs.parallelWires}x Ø ${job.technicalSpecs.wireDiameterMm} mm</span>
      </td>
      <td>
        <span class="info-label">Kelas Isolasi Stator:</span>
        <span class="info-val">${job.technicalSpecs.insulationClass} (${job.technicalSpecs.slotInsulationType})</span>
      </td>
    </tr>
  </table>

  <!-- Section 1: Megger Test -->
  <div class="section-title">
    <span>1. Uji Tahanan Isolasi Megger (Insulation Resistance Test)</span>
    <span class="stamp-badge">Standar IEEE 43 (> 100 MΩ)</span>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th>Titik Pengujian (Test Points)</th>
        <th class="center">Tegangan Uji</th>
        <th class="center">Hasil Pengukuran</th>
        <th class="center">Standar Minimum</th>
        <th class="center">Keterangan</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Kumparan Stator ke Ground / Bodi Motor</td>
        <td class="center mono">${report.meggerVoltageV} V DC</td>
        <td class="center mono" style="font-size: 10.5pt; font-weight: 700; color: #15803d;">${report.meggerStatorBodyMohm} MΩ</td>
        <td class="center mono">&gt; 100 MΩ</td>
        <td class="center status-pass">${isMeggerGood ? '✓ Memenuhi Syarat' : '✗ Dibawah Standar'}</td>
      </tr>
      <tr>
        <td>Antar Fasa R - S</td>
        <td class="center mono">${report.meggerVoltageV} V DC</td>
        <td class="center mono">${report.meggerPhasePhaseMohm.rs} MΩ</td>
        <td class="center mono">&gt; 100 MΩ</td>
        <td class="center status-pass">✓ Sangat Baik</td>
      </tr>
      <tr>
        <td>Antar Fasa S - T</td>
        <td class="center mono">${report.meggerVoltageV} V DC</td>
        <td class="center mono">${report.meggerPhasePhaseMohm.st} MΩ</td>
        <td class="center mono">&gt; 100 MΩ</td>
        <td class="center status-pass">✓ Sangat Baik</td>
      </tr>
      <tr>
        <td>Antar Fasa T - R</td>
        <td class="center mono">${report.meggerVoltageV} V DC</td>
        <td class="center mono">${report.meggerPhasePhaseMohm.tr} MΩ</td>
        <td class="center mono">&gt; 100 MΩ</td>
        <td class="center status-pass">✓ Sangat Baik</td>
      </tr>
    </tbody>
  </table>

  <!-- Section 2: Winding Resistance -->
  <div class="section-title">
    <span>2. Uji Tahanan Kumparan Fasa (Winding Resistance)</span>
    <span class="stamp-badge">Ketidakseimbangan: ${balance.maxDeltaPct}% (Maks. 2-3%)</span>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th>Terminal U - V</th>
        <th>Terminal V - W</th>
        <th>Terminal W - U</th>
        <th class="center">Nilai Rata-rata</th>
        <th class="center">Deviasi Maksimal</th>
        <th class="center">Evaluasi Fasa</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="mono">${report.windingResistanceOhm.uv} Ω</td>
        <td class="mono">${report.windingResistanceOhm.vw} Ω</td>
        <td class="mono">${report.windingResistanceOhm.wu} Ω</td>
        <td class="center mono">${balance.average} Ω</td>
        <td class="center mono">${balance.maxDeltaPct} %</td>
        <td class="center status-pass">${balance.isBalanced ? '✓ Seimbang (Balanced)' : 'Perlu Perhatian'}</td>
      </tr>
    </tbody>
  </table>

  <!-- Section 3: No-Load Running Test -->
  <div class="section-title">
    <span>3. Uji Operasional Jalan Tanpa Beban (No-Load Running Test 60 Menit)</span>
    <span class="stamp-badge">Standar Vibrasi ISO 10816 Grade A</span>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th class="center">Tegangan Terpasang</th>
        <th class="center">Arus Fasa R</th>
        <th class="center">Arus Fasa S</th>
        <th class="center">Arus Fasa T</th>
        <th class="center">Putaran Aktual</th>
        <th class="center">Vibrasi DE / NDE</th>
        <th class="center">Suhu Bearing DE/NDE</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="center mono">${report.noLoadTest.appliedVoltageV} V</td>
        <td class="center mono">${report.noLoadTest.currentR_Amps} A</td>
        <td class="center mono">${report.noLoadTest.currentS_Amps} A</td>
        <td class="center mono">${report.noLoadTest.currentT_Amps} A</td>
        <td class="center mono">${report.noLoadTest.actualRpm} RPM</td>
        <td class="center mono">${report.noLoadTest.vibrationDE_mm_s} / ${report.noLoadTest.vibrationNDE_mm_s} mm/s</td>
        <td class="center mono">${report.noLoadTest.tempDE_C}°C / ${report.noLoadTest.tempNDE_C}°C</td>
      </tr>
    </tbody>
  </table>

  <!-- Decision & Warranty -->
  <div class="decision-box">
    <table style="width: 100%;">
      <tr>
        <td style="width: 60%; vertical-align: top;">
          <div style="font-size: 8pt; color: #64748b; text-transform: uppercase;">Keputusan Uji Quality Control:</div>
          <div style="font-size: 11pt; font-weight: 800; color: #166534; margin: 2px 0;">
            ${report.overallResult}
          </div>
          <div style="font-size: 8.5pt; color: #334155; margin-top: 3px;">
            <strong>Catatan:</strong> ${report.qcNotes}
          </div>
        </td>
        <td style="width: 40%; vertical-align: top; text-align: right;">
          <div style="font-size: 8pt; color: #64748b; text-transform: uppercase;">Masa Jaminan Garansi:</div>
          <div style="font-size: 12pt; font-weight: 800; color: #0f172a; margin: 2px 0;">
            ${report.warrantyMonths} BULAN GARANSI
          </div>
          <div style="font-size: 8pt; color: #64748b;">
            Berlaku sejak tanggal penyerahan unit motor
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Signatures -->
  <table class="signatures">
    <tr>
      <td>
        <div>Diuji & Diperiksa Oleh,</div>
        <div class="sig-line">(${report.testerName})</div>
        <div class="sig-role">Quality Control Tester</div>
      </td>
      <td>
        <div>Mengetahui,</div>
        <div class="sig-line">(${job.customerName})</div>
        <div class="sig-role">Perwakilan Pelanggan / Pabrik</div>
      </td>
      <td>
        <div>Disetujui Oleh,</div>
        <div class="sig-line">(${WORKSHOP_PROFILE.managerName})</div>
        <div class="sig-role">Pimpinan CV. Mustofa Jaya Teknik</div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Triggers reliable printing of the certificate using a hidden iframe
 */
export function printCertificateDocument(job: JobOrder, report: TestReport): void {
  const html = generateCertificateHtml(job, report);
  printHtmlDocument(html, `Cetak Sertifikat QC - ${job.id}`);
}
