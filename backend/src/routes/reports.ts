import { Router, Request, Response } from 'express';
import writeXlsxFile from 'write-excel-file/node';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun } from 'docx';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import RentalTransaction from '../models/RentalTransaction';
import Room from '../models/Room';
import { calculateRentalFinancials } from './rentals';

const router = Router();

const generatePdf = (res: Response, title: string, data: any[], columns: string[], filename: string, charts?: { image: Buffer, description: string }[], conclusion?: string, annexData?: any[], annexColumns?: string[]) => {
  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  doc.pipe(res);
  doc.fontSize(20).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.moveDown();
  
  if (data && data.length > 0) {
    const tableTop = doc.y;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const columnWidth = pageWidth / columns.length;
    let currentY = tableTop;

    doc.fontSize(10).font('Helvetica-Bold');
    columns.forEach((col, i) => {
      doc.text(col, doc.page.margins.left + (i * columnWidth), currentY, { width: columnWidth, align: 'left' });
    });
    
    currentY += 15;
    doc.moveTo(doc.page.margins.left, currentY)
       .lineTo(doc.page.width - doc.page.margins.right, currentY)
       .lineWidth(1)
       .strokeColor('#000000')
       .stroke();
    currentY += 10;

    doc.font('Helvetica');
    data.forEach(row => {
      let maxRowHeight = 15;
      columns.forEach((col) => {
        const textStr = String(row[col] || '-');
        const h = doc.heightOfString(textStr, { width: columnWidth - 5 });
        if (h > maxRowHeight) maxRowHeight = h;
      });

      if (currentY + maxRowHeight > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      
      columns.forEach((col, i) => {
        doc.text(String(row[col] || '-'), doc.page.margins.left + (i * columnWidth), currentY, { width: columnWidth - 5, align: 'left' });
      });
      currentY += maxRowHeight + 5;
      
      doc.moveTo(doc.page.margins.left, currentY)
         .lineTo(doc.page.width - doc.page.margins.right, currentY)
         .lineWidth(0.5)
         .strokeColor('#cccccc')
         .stroke();
      currentY += 10;
    });
    doc.y = currentY + 10;
  }

  if (conclusion) {
    doc.x = doc.page.margins.left;
    doc.moveDown();
    doc.font('Helvetica-Bold').fontSize(12).text('Kesimpulan:');
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(11).text(conclusion, { align: 'justify' });
    doc.moveDown();
  }


  if (charts) {
    // We render charts on new pages
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('Visualisasi Data', { align: 'center' });
    doc.moveDown(2);

    charts.forEach((chart, idx) => {
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const imgWidth = Math.min(pageWidth, 500);
      const imgHeight = imgWidth * (400 / 800); 
      
      const spaceNeeded = imgHeight + 60;
      if (idx > 0 && doc.y + spaceNeeded > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      } else if (idx > 0) {
        doc.moveDown(3);
      }

      const startY = doc.y;
      doc.image(chart.image, doc.page.margins.left, startY, { width: imgWidth });
      doc.y = startY + imgHeight + 8;
      doc.fontSize(11).text(chart.description, { align: 'justify' });
    });
  }

  if (annexData && annexColumns && annexData.length > 0) {
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('Lampiran: Data Transaksi (Annex)', { align: 'center' });
    doc.moveDown(2);
    
    const tableTop = doc.y;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const columnWidth = pageWidth / annexColumns.length;
    let currentY = tableTop;

    doc.fontSize(8).font('Helvetica-Bold');
    annexColumns.forEach((col, i) => {
      doc.text(col, doc.page.margins.left + (i * columnWidth), currentY, { width: columnWidth, align: 'left' });
    });
    
    currentY += 15;
    doc.moveTo(doc.page.margins.left, currentY).lineTo(doc.page.width - doc.page.margins.right, currentY).lineWidth(1).strokeColor('#000000').stroke();
    currentY += 10;

    doc.font('Helvetica');
    annexData.forEach(row => {
      let maxRowHeight = 15;
      annexColumns.forEach((col) => {
        const textStr = String(row[col] || '-');
        const h = doc.heightOfString(textStr, { width: columnWidth - 5 });
        if (h > maxRowHeight) maxRowHeight = h;
      });

      if (currentY + maxRowHeight > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
      
      annexColumns.forEach((col, i) => {
        doc.text(String(row[col] || '-'), doc.page.margins.left + (i * columnWidth), currentY, { width: columnWidth - 5, align: 'left' });
      });
      currentY += maxRowHeight + 5;
      
      doc.moveTo(doc.page.margins.left, currentY).lineTo(doc.page.width - doc.page.margins.right, currentY).lineWidth(0.5).strokeColor('#cccccc').stroke();
      currentY += 10;
    });
  }

  doc.end();
};

const generateDocx = async (res: Response, title: string, data: any[], columns: string[], filename: string, charts?: { image: Buffer, description: string }[], conclusion?: string, annexData?: any[], annexColumns?: string[]) => {
  const children: any[] = [
    new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 32 })] })
  ];

  if (data && data.length > 0) {
    const tableRows = [
      new TableRow({ children: columns.map(c => new TableCell({ children: [new Paragraph(c)] })) })
    ];
    data.forEach(row => {
      tableRows.push(new TableRow({
        children: columns.map(c => new TableCell({ children: [new Paragraph(String(row[c] || '-'))] }))
      }));
    });
    children.push(new Table({ rows: tableRows }));
  }

  if (conclusion) {
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({ children: [new TextRun({ text: 'Kesimpulan:', bold: true, size: 24 })] }));
    children.push(new Paragraph({ children: [new TextRun({ text: conclusion, size: 24 })] }));
  }

  if (charts) {
    charts.forEach(chart => {
      children.push(new Paragraph({
        children: [
          new ImageRun({
            type: 'png',
            data: chart.image,
            transformation: { width: 500, height: 300 }
          })
        ]
      }));
      children.push(new Paragraph({ text: chart.description }));
    });
  }


  if (annexData && annexColumns && annexData.length > 0) {
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({ children: [new TextRun({ text: 'Lampiran: Data Transaksi (Annex)', bold: true, size: 28 })] }));
    const annexTableRows = [
      new TableRow({ children: annexColumns.map(c => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, bold: true })] })] })) })
    ];
    annexData.forEach(row => {
      annexTableRows.push(new TableRow({
        children: annexColumns.map(c => new TableCell({ children: [new Paragraph(String(row[c] || '-'))] }))
      }));
    });
    children.push(new Table({ rows: annexTableRows }));
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(buffer);
};

const generateExcel = async (res: Response, data: any[], columns: string[], filename: string) => {
  const HEADER_ROW = columns.map(c => ({ value: c, fontWeight: 'bold' }));
  const dataRows = data.map(row => columns.map(c => ({ type: String, value: row[c] ? String(row[c]) : '-' })));
  
  const buffer = await writeXlsxFile([HEADER_ROW, ...dataRows], {}).toBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(buffer);
};

router.get('/renting', async (req: Request, res: Response) => {
  try {
    const { format } = req.query; 
    let rentals = await RentalTransaction.find().populate('customerIds').populate({ path: 'roomId', populate: { path: 'roomTypeId' } });
    const computedRentals = rentals.map(calculateRentalFinancials);
    
    const columns = ['ID', 'Pelanggan', 'Room', 'Waktu Sewa', 'Status Real'];
    const data = computedRentals.map(r => ({
      'ID': r._id.toString(),
      'Pelanggan': r.customerIds ? r.customerIds.map((c: any) => c.name).join(', ') : 'Unknown',
      'Room': r.roomId && (r.roomId as any).roomTypeId ? `${(r.roomId as any).roomTypeId.name} (${(r.roomId as any).roomNumber})` : 'Unknown',
      'Waktu Sewa': new Date(r.rentalStartTime).toLocaleDateString('id-ID'),
      'Status Real': r.currentStatusText
    }));

    const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '').split('.')[0];
    const baseFilename = `Laporan_Penyewaan_${timestamp}`;
    const conclusion = `Berdasarkan data di atas, total penyewaan yang tercatat adalah sebanyak ${data.length} transaksi.`;

    if (format === 'pdf') return generatePdf(res, 'Laporan Penyewaan', data, columns, `${baseFilename}.pdf`, undefined, conclusion);
    if (format === 'word') return await generateDocx(res, 'Laporan Penyewaan', data, columns, `${baseFilename}.docx`, undefined, conclusion);
    
    await generateExcel(res, data, columns, `${baseFilename}.xlsx`);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/financial', async (req: Request, res: Response) => {
  try {
    const { format, range } = req.query;

    let dateFilter = {};
    const now = new Date();
    if (range === 'daily') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { $gte: start };
    } else if (range === 'weekly') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { $gte: start };
    } else if (range === 'monthly') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { $gte: start };
    } else if (range === 'quarterly') {
      const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      dateFilter = { $gte: start };
    } else if (range === 'yearly') {
      const start = new Date(now.getFullYear(), 0, 1);
      dateFilter = { $gte: start };
    }

    const query: any = {}; // Include both active and completed to see current revenues
    if (Object.keys(dateFilter).length > 0) {
      query.createdAt = dateFilter;
    }

    let rentals = await RentalTransaction.find(query).populate('customerIds').populate({ path: 'roomId', populate: { path: 'roomTypeId' } });
    const computedRentals = rentals.map(calculateRentalFinancials);
    
    const columns = ['ID', 'Pelanggan', 'Room', 'Waktu Sewa', 'Total Terbayar (Rp)', 'Tunggakan (Rp)', 'Saldo Mengendap (Rp)'];
    let totalTerbayar = 0;
    let totalTunggakan = 0;
    let totalSaldo = 0;

    const data = computedRentals.map(r => {
      totalTerbayar += r.totalPaid || 0;
      totalTunggakan += r.tunggakanAmount || 0;
      totalSaldo += r.saldoMengendap || 0;

      return {
        'ID': r._id.toString(),
        'Pelanggan': r.customerIds ? r.customerIds.map((c: any) => c.name).join(', ') : 'Unknown',
        'Room': r.roomId && (r.roomId as any).roomTypeId ? `${(r.roomId as any).roomTypeId.name} (${(r.roomId as any).roomNumber})` : 'Unknown',
        'Waktu Sewa': new Date(r.rentalStartTime).toLocaleDateString('id-ID'),
        'Total Terbayar (Rp)': String(r.totalPaid || 0),
        'Tunggakan (Rp)': String(r.tunggakanAmount || 0),
        'Saldo Mengendap (Rp)': String(r.saldoMengendap || 0)
      };
    });
    data.push({ 'ID': 'TOTAL', 'Pelanggan': '', 'Room': '', 'Waktu Sewa': '', 'Total Terbayar (Rp)': String(totalTerbayar), 'Tunggakan (Rp)': String(totalTunggakan), 'Saldo Mengendap (Rp)': String(totalSaldo) });

    const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '').split('.')[0];
    const baseFilename = `Laporan_Keuangan_${range || 'Semua'}_${timestamp}`;
    const conclusion = `Total uang tunai/transfer yang diterima (Total Terbayar) adalah Rp ${totalTerbayar.toLocaleString('id-ID')}. Terdapat piutang/tunggakan sebesar Rp ${totalTunggakan.toLocaleString('id-ID')} dan total saldo mengendap/kredit klien sebesar Rp ${totalSaldo.toLocaleString('id-ID')}.`;

    if (format === 'pdf') return generatePdf(res, `Laporan Keuangan (${range || 'Semua'})`, data, columns, `${baseFilename}.pdf`, undefined, conclusion);
    if (format === 'word') return await generateDocx(res, `Laporan Keuangan (${range || 'Semua'})`, data, columns, `${baseFilename}.docx`, undefined, conclusion);
    
    await generateExcel(res, data, columns, `${baseFilename}.xlsx`);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// For Dashboard logic we can keep it largely the same but ensure we use totalPaid for charts
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { format, filterType, month, year } = req.query; 
    let allRentals = await RentalTransaction.find().populate('customerIds').populate({ path: 'roomId', populate: { path: 'roomTypeId' } });
    
    const targetMonth = month ? parseInt(month as string, 10) : new Date().getMonth();
    const targetYear = year ? parseInt(year as string, 10) : new Date().getFullYear();
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    
    const targetStart = new Date(targetYear, targetMonth, 1);
    const targetEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    
    const rawFiltered = (!filterType || filterType === 'all') ? allRentals : allRentals.filter(r => {
      const start = new Date(r.rentalStartTime);
      let end = new Date();
      if (r.status === 'Completed' && r.rentalEndTime) end = new Date(r.rentalEndTime);
      else if (r.status === 'Cancelled' && r.rentalEndTime) end = new Date(r.rentalEndTime);
      else if (r.paidUntil && new Date(r.paidUntil) > end) end = new Date(r.paidUntil);
      return start <= targetEnd && end >= targetStart;
    });

    const rentals = rawFiltered.map(calculateRentalFinancials);
    
    let totalPendapatanBulanIni = 0;
    const revenuePerMonth = new Array(12).fill(0);
    const rentalsPerMonth = new Array(12).fill(0);

    for (const r of allRentals.map(calculateRentalFinancials)) {
      if (r.payments) {
        for (const p of r.payments) {
           const d = new Date(p.date);
           const pMonth = d.getMonth();
           const pYear = d.getFullYear();
           if (pYear === targetYear) {
             revenuePerMonth[pMonth] += p.amount;
           }
           if (filterType === 'all') {
             totalPendapatanBulanIni += p.amount;
           } else if (pMonth === targetMonth && pYear === targetYear) {
             totalPendapatanBulanIni += p.amount;
           }
        }
      }
      const dStart = new Date(r.rentalStartTime);
      if (dStart.getFullYear() === targetYear) {
        rentalsPerMonth[dStart.getMonth()]++;
      }
    }

    const kebayaCounts: Record<string, any> = {};
    const customerCounts: Record<string, number> = {};
    const customerRevenue: Record<string, number> = {};

    for (const r of rentals) {
      if (r.roomId && (r.roomId as any).roomTypeId) {
        const k: any = r.roomId;
        const key = k.roomTypeId.name;
        kebayaCounts[key] = (kebayaCounts[key] || 0) + 1;
      }
      
      const cIds = r.customerIds || [];
      const paymentsTotal = r.totalPaid || 0;
      
      const start = new Date(r.rentalStartTime).getTime();
      let end = new Date().getTime();
      if (r.status === 'Completed' && r.rentalEndTime) end = new Date(r.rentalEndTime).getTime();
      else if (r.status === 'Cancelled' && r.rentalEndTime) end = new Date(r.rentalEndTime).getTime();
      else if (r.paidUntil && new Date(r.paidUntil).getTime() > end) end = new Date(r.paidUntil).getTime();
      
      const monthsDuration = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30)));

      for (const cId of cIds) {
          const cKey = cId?.name || 'Unknown';
          customerCounts[cKey] = (customerCounts[cKey] || 0) + monthsDuration;
          customerRevenue[cKey] = (customerRevenue[cKey] || 0) + (paymentsTotal / cIds.length);
      }
    }
    let popSorted = Object.entries(kebayaCounts).sort((a,b)=>b[1]-a[1]);
    if (popSorted.length > 4) {
      const top4 = popSorted.slice(0, 4);
      const others = popSorted.slice(4).reduce((sum, curr) => sum + (curr[1] as number), 0);
      popSorted = [...top4, ['Lainnya', others]];
    }
    const revSortedC = Object.entries(customerRevenue).sort((a,b)=>b[1]-a[1]).slice(0,5);

    let segment1x = 0; let segment2x = 0; let segment3plus = 0;
    for (const count of Object.values(customerCounts)) {
      if (count === 1) segment1x++;
      else if (count === 2) segment2x++;
      else if (count >= 3) segment3plus++;
    }

    let bsLunas = 0; let bsTunggakan = 0; let bsOverstay = 0; let bsBatal = 0;
    for (const r of rentals) {
      if (r.status === 'Cancelled') bsBatal++;
      else if (r.currentStatusText === 'Overstay' || r.uiStatus === 'Overstay') bsOverstay++;
      else if (r.tunggakanAmount && r.tunggakanAmount > 0) bsTunggakan++;
      else bsLunas++;
    }

    const customerIssues: Record<string, number> = {};
    for (const r of rentals) {
      for (const cId of r.customerIds || []) {
          const cKey = cId?.name || 'Unknown';
          if (!customerIssues[cKey]) customerIssues[cKey] = 0;
          if (r.status === 'Cancelled') customerIssues[cKey] += 1;
          if (r.tunggakanAmount && r.tunggakanAmount > 0) customerIssues[cKey] += (r.tunggakanAmount / 100000);
      }
    }
    const probSorted = Object.entries(customerIssues).filter(x => x[1] > 0).sort((a,b)=>b[1]-a[1]).slice(0,5);

    let totalTunggakan = 0;
    for (const r of rentals) {
      totalTunggakan += r.tunggakanAmount || 0;
    }

    const rooms = await Room.find({ status: { $ne: 'Maintenance' }});
    const totalRooms = rooms.length;
    const occupancyDate = (!filterType || filterType === 'all') ? new Date() : targetEnd;
    const activeRentals = rentals.filter(r => 
      ['Active', 'Booked'].includes(r.uiStatus) && 
      (new Date(r.rentalStartTime) <= occupancyDate) &&
      (!r.expectedReturnDate || new Date(r.expectedReturnDate) >= occupancyDate)
    );
    const occupiedRoomsCount = new Set(activeRentals.map(r => r.roomId ? (r.roomId as any)._id.toString() : '')).size;
    const tingkatHunian = totalRooms > 0 ? Math.round((occupiedRoomsCount / totalRooms) * 100) : 0;
    const kamarKosong = Math.max(0, totalRooms - occupiedRoomsCount);
    const jumlahBermasalah = probSorted.length;

    const periodLabel = (!filterType || filterType === 'all') ? 'Semua Waktu' : `${months[targetMonth]} ${targetYear}`;
    const execSummary = `Ringkasan Eksekutif: Laporan performa kosan untuk periode "${periodLabel}". Saat ini tingkat hunian berada pada angka ${tingkatHunian}%. Keuntungan bersih dari pembayaran tercatat sebesar Rp ${totalPendapatanBulanIni.toLocaleString('id-ID')}. Terdapat akumulasi total tunggakan sebesar Rp ${totalTunggakan.toLocaleString('id-ID')} dengan jumlah pelanggan bermasalah sebanyak ${jumlahBermasalah} orang.`;

    const summaryTableColumns = ['Metrik Utama', 'Nilai'];
    const summaryTableData = [
      { 'Metrik Utama': 'Tingkat Hunian', 'Nilai': `${tingkatHunian}%` },
      { 'Metrik Utama': 'Keuntungan Bersih', 'Nilai': `Rp ${totalPendapatanBulanIni.toLocaleString('id-ID')}` },
      { 'Metrik Utama': 'Total Tunggakan', 'Nilai': `Rp ${totalTunggakan.toLocaleString('id-ID')}` },
      { 'Metrik Utama': 'Penghuni Bermasalah', 'Nilai': `${jumlahBermasalah} orang` },
      { 'Metrik Utama': 'Kamar Kosong', 'Nilai': `${kamarKosong} kamar` }
    ];

    const annexColumns = ['ID', 'Pelanggan', 'Room', 'Waktu Sewa', 'Status Real', 'Pendapatan'];
    const dataAnnex = rentals.map(r => ({
      'ID': r._id.toString(),
      'Pelanggan': r.customerIds ? r.customerIds.map((c: any) => c.name).join(', ') : 'Unknown',
      'Room': r.roomId && (r.roomId as any).roomTypeId ? `${(r.roomId as any).roomTypeId.name} (${(r.roomId as any).roomNumber})` : 'Unknown',
      'Waktu Sewa': new Date(r.rentalStartTime).toLocaleDateString('id-ID'),
      'Status Real': r.currentStatusText,
      'Pendapatan': `Rp ${r.totalPaid || 0}`
    }));

    if (format === 'excel') {
      const excelData = [...dataAnnex,
        { 'ID': '', 'Pelanggan': '', 'Room': '', 'Waktu Sewa': '', 'Status Real': '', 'Pendapatan': '' },
        { 'ID': 'KESIMPULAN UMUM', 'Pelanggan': '', 'Room': '', 'Waktu Sewa': '', 'Status Real': '', 'Pendapatan': '' },
        ...summaryTableData.map(s => ({ 'ID': s['Metrik Utama'], 'Pelanggan': s['Nilai'], 'Room': '', 'Waktu Sewa': '', 'Status Real': '', 'Pendapatan': '' }))
      ];
      const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '').split('.')[0];
      return await generateExcel(res, excelData, annexColumns, `Dashboard_Export_${timestamp}.xlsx`);
    }

    const width = 800;
    const height = 400;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, plugins: { modern: [ChartDataLabels as any] } });
    
    const safeDisplay = (ctx: any) => { const v = ctx.dataset.data[ctx.dataIndex]; return v != null && Number(v) > 0; };
    const numberFormatter = (value: number) => {
      if (value >= 1000000) return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'jt';
      if (value >= 1000) return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'rb';
      return value;
    };
    const getBarOptions = () => ({ layout: { padding: { top: 30, bottom: 10, left: 10, right: 10 } }, plugins: { legend: { labels: { padding: 20 } }, datalabels: { display: safeDisplay, color: '#000', anchor: 'end' as const, align: 'top' as const, formatter: numberFormatter } }, scales: { y: { beginAtZero: true, grace: '15%', ticks: { callback: numberFormatter } } } });
    const getLineOptions = () => ({ layout: { padding: { top: 30, bottom: 10, left: 10, right: 10 } }, plugins: { legend: { labels: { padding: 20 } }, datalabels: { display: safeDisplay, color: '#000', anchor: 'end' as const, align: 'top' as const, formatter: (v: number) => v > 0 ? v : '' } }, scales: { y: { beginAtZero: true, grace: '15%', ticks: { stepSize: 1 } } } });
    const getPieOptions = (hasRealData: boolean) => ({ layout: { padding: 20 }, plugins: { legend: { labels: { padding: 20 } }, datalabels: hasRealData ? { display: safeDisplay, color: '#fff', font: { weight: 'bold' as const }, formatter: (v: number) => v > 0 ? v : '' } : { display: false } } });

    const revBuffer = await chartJSNodeCanvas.renderToBuffer({ type: 'bar', data: { labels: months, datasets: [{ label: 'Pendapatan (Rp)', data: revenuePerMonth, backgroundColor: 'rgba(54, 162, 235, 0.5)' }] }, options: getBarOptions() as any });
    const revDesc = `Bagan di atas menunjukkan total pendapatan per bulan selama tahun ${targetYear}.`;

    const popLabels = popSorted.map(p => p[0]);
    const popData = popSorted.map(p => p[1]);
    const totalPop = popData.reduce((a, b) => a + b, 0);
    const popBuffer = await chartJSNodeCanvas.renderToBuffer({ type: 'pie', data: { labels: totalPop > 0 ? popLabels : ['Kosong'], datasets: [{ label: 'Penyewaan', data: totalPop > 0 ? popData : [1], backgroundColor: totalPop > 0 ? ['#ff9999','#66b3ff','#99ff99','#ffcc99','#95a5a6'] : ['#e0e0e0'] }] }, options: getPieOptions(totalPop > 0) as any });
    const popDesc = `Proporsi sewa berdasarkan tipe kamar.`;

    const volBuffer = await chartJSNodeCanvas.renderToBuffer({ type: 'line', data: { labels: months, datasets: [{ label: 'Volume Sewa', data: rentalsPerMonth, borderColor: 'rgba(75, 192, 192, 1)', fill: false }] }, options: getLineOptions() as any });
    const totalVol = rentalsPerMonth.reduce((a, b) => a + b, 0);
    const volDesc = `Tren volume penyewaan per bulan selama tahun ${targetYear}.`;

    const valLabels = revSortedC.map(p => p[0]);
    const valData = revSortedC.map(p => p[1]);
    const valBuffer = await chartJSNodeCanvas.renderToBuffer({ type: 'bar', data: { labels: valLabels.length ? valLabels : ['Kosong'], datasets: [{ label: 'Total Pendapatan', data: valData.length ? valData : [0], backgroundColor: '#f39c12' }] }, options: getBarOptions() as any });
    const valDesc = `Daftar 5 pelanggan dengan sumbangan pendapatan kumulatif tertinggi.`;

    const loyTotal = segment1x + segment2x + segment3plus;
    const loyBuffer = await chartJSNodeCanvas.renderToBuffer({ type: 'pie', data: { labels: ['Sewa 1 Bulan', 'Sewa 2 Bulan', 'Sewa 3 Bulan+'], datasets: [{ data: loyTotal > 0 ? [segment1x, segment2x, segment3plus] : [1], backgroundColor: loyTotal > 0 ? ['#e74c3c', '#f1c40f', '#2ecc71'] : ['#e0e0e0'] }] }, options: getPieOptions(loyTotal > 0) as any });
    const loyDesc = `Segmentasi loyalitas.`;

    const bsTotal = bsLunas + bsTunggakan + bsOverstay + bsBatal;
    const bsBuffer = await chartJSNodeCanvas.renderToBuffer({ type: 'pie', data: { labels: ['Lancar / Lunas', 'Tunggakan', 'Overstay', 'Batal'], datasets: [{ data: bsTotal > 0 ? [bsLunas, bsTunggakan, bsOverstay, bsBatal] : [1], backgroundColor: bsTotal > 0 ? ['#2ecc71', '#f1c40f', '#e67e22', '#e74c3c'] : ['#e0e0e0'] }] }, options: getPieOptions(bsTotal > 0) as any });
    const bsDesc = `Status pemesanan.`;

    const probLabels = probSorted.map(p => p[0]);
    const probData = probSorted.map(p => p[1]);
    const probBuffer = await chartJSNodeCanvas.renderToBuffer({ type: 'bar', data: { labels: probLabels.length ? probLabels : ['Kosong'], datasets: [{ label: 'Poin Masalah (Tunggakan/Batal)', data: probData.length ? probData : [0], backgroundColor: '#c0392b' }] }, options: getBarOptions() as any });
    const probDesc = `Daftar 5 pelanggan bermasalah.`;

    const charts = [
      { image: revBuffer, description: revDesc }, { image: popBuffer, description: popDesc },
      { image: volBuffer, description: volDesc }, { image: valBuffer, description: valDesc },
      { image: loyBuffer, description: loyDesc }, { image: bsBuffer, description: bsDesc },
      { image: probBuffer, description: probDesc }
    ];

    const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '').split('.')[0];
    const baseFilename = `Dashboard_Report_${periodLabel}_${timestamp}`;

    if (format === 'pdf') return generatePdf(res, `Laporan Performa Kosan - ${periodLabel}`, summaryTableData, summaryTableColumns, `${baseFilename}.pdf`, charts, execSummary, dataAnnex, annexColumns);
    if (format === 'word') return await generateDocx(res, `Laporan Performa Kosan - ${periodLabel}`, summaryTableData, summaryTableColumns, `${baseFilename}.docx`, charts, execSummary, dataAnnex, annexColumns);
    
    res.status(400).json({ error: 'Invalid format' });
  } catch (err: any) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

export default router;
