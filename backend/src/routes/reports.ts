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

const generatePdf = (res: Response, title: string, data: any[], columns: string[], filename: string, charts?: { image: Buffer, description: string }[], conclusion?: string) => {
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
    charts.forEach((chart, idx) => {
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const imgWidth = Math.min(pageWidth, 500);
      const imgHeight = imgWidth * (400 / 800); 
      
      const spaceNeeded = imgHeight + 60;
      if (doc.y + spaceNeeded > doc.page.height - doc.page.margins.bottom) {
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
  doc.end();
};

const generateDocx = async (res: Response, title: string, data: any[], columns: string[], filename: string, charts?: { image: Buffer, description: string }[], conclusion?: string) => {
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
    const { format } = req.query; 
    let rawRentals = await RentalTransaction.find().populate('customerIds').populate({ path: 'roomId', populate: { path: 'roomTypeId' } });
    const rentals = rawRentals.map(calculateRentalFinancials);
    
    const revenuePerMonth = new Array(12).fill(0);
    const rentalsPerMonth = new Array(12).fill(0);

    for (const r of rentals) {
      if (r.payments) {
        for (const p of r.payments) {
           const month = new Date(p.date).getMonth();
           revenuePerMonth[month] += p.amount;
        }
      }
      const startMonth = new Date(r.rentalStartTime).getMonth();
      rentalsPerMonth[startMonth]++;
    }
    let totalRevenue = revenuePerMonth.reduce((a,b)=>a+b, 0);

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
      
      for (const cId of cIds) {
          const cKey = cId?.name || 'Unknown';
          customerCounts[cKey] = (customerCounts[cKey] || 0) + 1;
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

    let depositPaid = 0; let depositUnpaid = 0;
    for (const r of rentals) {
      if (['Active', 'Booked'].includes(r.uiStatus)) {
        if (r.depositPaid) depositPaid++;
        else depositUnpaid++;
      }
    }

    const customerIssues: Record<string, number> = {};
    for (const r of rentals) {
      for (const cId of r.customerIds || []) {
          const cKey = cId?.name || 'Unknown';
          if (!customerIssues[cKey]) customerIssues[cKey] = 0;
          if (r.status === 'Cancelled') customerIssues[cKey] += 1;
          if (r.tunggakanAmount && r.tunggakanAmount > 0) customerIssues[cKey] += (r.tunggakanAmount / 100000); // 1 point per 100k overdue
      }
    }
    const probSorted = Object.entries(customerIssues).filter(x => x[1] > 0).sort((a,b)=>b[1]-a[1]).slice(0,5);

    const computedRentals = rentals; // already mapped in line 259
    let totalTunggakan = 0;
    for (const r of computedRentals) {
      totalTunggakan += r.tunggakanAmount || 0;
    }

    const rooms = await Room.find({ status: { $ne: 'Maintenance' }});
    const totalRooms = rooms.length;
    const now = new Date();
    const activeRentals = computedRentals.filter(r => 
      ['Active', 'Booked'].includes(r.uiStatus) && 
      (new Date(r.rentalStartTime) <= now) &&
      (!r.expectedReturnDate || new Date(r.expectedReturnDate) >= now)
    );
    const occupiedRoomsCount = new Set(activeRentals.map(r => r.roomId ? (r.roomId as any)._id.toString() : '')).size;
    const tingkatHunian = totalRooms > 0 ? Math.round((occupiedRoomsCount / totalRooms) * 100) : 0;
    const kamarKosong = Math.max(0, totalRooms - occupiedRoomsCount);
    const jumlahBermasalah = probSorted.length; // From probSorted logic
    
    if (format === 'excel') {
      const columns = ['ID', 'Pelanggan', 'Room', 'Waktu Sewa', 'Status Real', 'Pendapatan (Total Terbayar)'];
      const data = rentals.map(r => ({
        'ID': r._id.toString(),
        'Pelanggan': r.customerIds ? r.customerIds.map((c: any) => c.name).join(', ') : 'Unknown',
        'Room': r.roomId && (r.roomId as any).roomTypeId ? `${(r.roomId as any).roomTypeId.name} (${(r.roomId as any).roomNumber})` : 'Unknown',
        'Waktu Sewa': new Date(r.rentalStartTime).toLocaleDateString('id-ID'),
        'Status Real': r.currentStatusText,
        'Pendapatan (Total Terbayar)': String(r.totalPaid || 0)
      }));

      data.push({ 'ID': '', 'Pelanggan': '', 'Room': '', 'Waktu Sewa': '', 'Status Real': '', 'Pendapatan (Total Terbayar)': '' });
      data.push({ 'ID': 'KESIMPULAN UMUM', 'Pelanggan': '', 'Room': '', 'Waktu Sewa': '', 'Status Real': '', 'Pendapatan (Total Terbayar)': '' });
      data.push({ 'ID': 'Tingkat Hunian', 'Pelanggan': `${tingkatHunian}%`, 'Room': '', 'Waktu Sewa': '', 'Status Real': '', 'Pendapatan (Total Terbayar)': '' });
      data.push({ 'ID': 'Kamar Kosong', 'Pelanggan': `${kamarKosong}`, 'Room': '', 'Waktu Sewa': '', 'Status Real': '', 'Pendapatan (Total Terbayar)': '' });
      data.push({ 'ID': 'Total Tunggakan', 'Pelanggan': `Rp ${totalTunggakan}`, 'Room': '', 'Waktu Sewa': '', 'Status Real': '', 'Pendapatan (Total Terbayar)': '' });
      data.push({ 'ID': 'Penghuni Bermasalah', 'Pelanggan': `${jumlahBermasalah} orang`, 'Room': '', 'Waktu Sewa': '', 'Status Real': '', 'Pendapatan (Total Terbayar)': '' });
      data.push({ 'ID': 'Total Pendapatan', 'Pelanggan': `Rp ${totalRevenue}`, 'Room': '', 'Waktu Sewa': '', 'Status Real': '', 'Pendapatan (Total Terbayar)': '' });

      const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '').split('.')[0];
      return await generateExcel(res, data, columns, `Dashboard_Export_${timestamp}.xlsx`);
    }

    // PDF and Word: Generate Charts
    const width = 800;
    const height = 400;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, plugins: { modern: [ChartDataLabels as any] } });
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

    const numberFormatter = (value: number) => {
      if (value >= 1000000) return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'jt';
      if (value >= 1000) return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'rb';
      return value;
    };

    const getBarOptions = () => ({
      layout: { padding: { top: 20, bottom: 10, left: 10, right: 10 } },
      plugins: { legend: { labels: { padding: 20 } }, datalabels: { display: true, color: '#000', anchor: 'end', align: 'top', formatter: numberFormatter } },
      scales: { y: { beginAtZero: true, grace: '15%', ticks: { callback: numberFormatter } } }
    });

    const getLineOptions = () => ({
      layout: { padding: { top: 20, bottom: 10, left: 10, right: 10 } },
      plugins: { legend: { labels: { padding: 20 } }, datalabels: { display: true, color: '#000', anchor: 'end', align: 'top', formatter: numberFormatter } },
      scales: { y: { beginAtZero: true, grace: '15%', ticks: { stepSize: 1 } } }
    });

    const getPieOptions = (totalData: number) => ({
      layout: { padding: 20 },
      plugins: { legend: { labels: { padding: 20 } }, datalabels: { display: totalData > 0, color: '#fff', font: { weight: 'bold' as const }, formatter: (val: number) => val > 0 ? val : '' } }
    });

    const revBuffer = await chartJSNodeCanvas.renderToBuffer({ type: 'bar', data: { labels: months, datasets: [{ label: 'Pendapatan (Rp)', data: revenuePerMonth, backgroundColor: 'rgba(54, 162, 235, 0.5)' }] }, options: getBarOptions() as any });
    const totalRev = revenuePerMonth.reduce((a, b) => a + b, 0);
    const maxRev = Math.max(...revenuePerMonth);
    const maxRevMonth = months[revenuePerMonth.indexOf(maxRev)] || 'N/A';
    const revDesc = `Total pendapatan selama periode ini adalah Rp ${totalRev.toLocaleString('id-ID')}.`;

    const popLabels = popSorted.map(p => p[0]);
    const popData = popSorted.map(p => p[1]);
    const totalPop = popData.reduce((a, b) => a + b, 0);
    const popBuffer = await chartJSNodeCanvas.renderToBuffer({ type: 'pie', data: { labels: popLabels, datasets: [{ label: 'Penyewaan', data: popData, backgroundColor: ['#ff9999','#66b3ff','#99ff99','#ffcc99','#95a5a6'] }] }, options: getPieOptions(totalPop) as any });
    const popDesc = `Total ${totalPop} penyewaan.`;

    const volBuffer = await chartJSNodeCanvas.renderToBuffer({ type: 'line', data: { labels: months, datasets: [{ label: 'Volume Sewa', data: rentalsPerMonth, borderColor: 'rgba(75, 192, 192, 1)', fill: false }] }, options: getLineOptions() as any });
    const totalVol = rentalsPerMonth.reduce((a, b) => a + b, 0);
    const volDesc = `Total volume penyewaan mencapai ${totalVol} transaksi.`;

    const valLabels = revSortedC.map(p => p[0]);
    const valData = revSortedC.map(p => p[1]);
    const valBuffer = await chartJSNodeCanvas.renderToBuffer({ type: 'bar', data: { labels: valLabels, datasets: [{ label: 'Total Pendapatan', data: valData, backgroundColor: '#f39c12' }] }, options: getBarOptions() as any });
    const valDesc = `Top 5 pelanggan menyumbang total pendapatan terbesar.`;

    const loyTotal = segment1x + segment2x + segment3plus;
    const loyBuffer = await chartJSNodeCanvas.renderToBuffer({ type: 'pie', data: { labels: ['Sewa 1x', 'Sewa 2x', 'Sewa 3x+'], datasets: [{ data: [segment1x, segment2x, segment3plus], backgroundColor: ['#e74c3c', '#f1c40f', '#2ecc71'] }] }, options: getPieOptions(loyTotal) as any });
    const loyDesc = `Statistik loyalitas pelanggan.`;

    const depTotal = depositPaid + depositUnpaid;
    const depBuffer = await chartJSNodeCanvas.renderToBuffer({ type: 'pie', data: { labels: ['Lunas', 'Belum Lunas/Tunggakan'], datasets: [{ data: [depositPaid, depositUnpaid], backgroundColor: ['#3498db', '#e74c3c'] }] }, options: getPieOptions(depTotal) as any });
    const depDesc = `Terdapat ${depositPaid} penyewaan lunas dan ${depositUnpaid} menunggak.`;

    const probLabels = probSorted.map(p => p[0]);
    const probData = probSorted.map(p => p[1]);
    const probBuffer = await chartJSNodeCanvas.renderToBuffer({ type: 'bar', data: { labels: probLabels, datasets: [{ label: 'Poin Masalah (Tunggakan/Batal)', data: probData, backgroundColor: '#c0392b' }] }, options: getBarOptions() as any });
    const probDesc = `Pelanggan dengan riwayat tunggakan atau pembatalan.`;

    const charts = [
      { image: revBuffer, description: revDesc }, { image: popBuffer, description: popDesc },
      { image: volBuffer, description: volDesc }, { image: valBuffer, description: valDesc },
      { image: loyBuffer, description: loyDesc }, { image: depBuffer, description: depDesc },
      { image: probBuffer, description: probDesc }
    ];

    const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '').split('.')[0];
    const baseFilename = `Dashboard_Report_${timestamp}`;

    if (format === 'pdf') return generatePdf(res, 'Dashboard Report', [], [], `${baseFilename}.pdf`, charts);
    if (format === 'word') return await generateDocx(res, 'Dashboard Report', [], [], `${baseFilename}.docx`, charts);
    
    res.status(400).json({ error: 'Invalid format' });
  } catch (err: any) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

export default router;
