"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const node_1 = __importDefault(require("write-excel-file/node"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const docx_1 = require("docx");
const chartjs_node_canvas_1 = require("chartjs-node-canvas");
const chartjs_plugin_datalabels_1 = __importDefault(require("chartjs-plugin-datalabels"));
const RentalTransaction_1 = __importDefault(require("../models/RentalTransaction"));
const router = (0, express_1.Router)();
const generatePdf = (res, title, data, columns, filename, charts, conclusion) => {
    const doc = new pdfkit_1.default();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    doc.pipe(res);
    doc.fontSize(20).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown();
    if (data && data.length > 0) {
        const tableTop = doc.y;
        const itemHeight = 25;
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const columnWidth = pageWidth / columns.length;
        let currentY = tableTop;
        // Draw Headers
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
        // Draw Rows
        doc.font('Helvetica');
        data.forEach(row => {
            if (currentY > doc.page.height - doc.page.margins.bottom - 30) {
                doc.addPage();
                currentY = doc.page.margins.top;
            }
            columns.forEach((col, i) => {
                doc.text(String(row[col] || '-'), doc.page.margins.left + (i * columnWidth), currentY, { width: columnWidth - 5, align: 'left' });
            });
            currentY += 15;
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
            const imgHeight = imgWidth * (400 / 800); // canvas is 800x400, ratio = 0.5
            const spaceNeeded = imgHeight + 60; // Approximate space for image + description
            if (doc.y + spaceNeeded > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
            }
            else if (idx > 0) {
                doc.moveDown(3); // Gap between previous description and next chart
            }
            const startY = doc.y;
            doc.image(chart.image, doc.page.margins.left, startY, { width: imgWidth });
            doc.y = startY + imgHeight + 8;
            doc.fontSize(11).text(chart.description, { align: 'justify' });
        });
    }
    doc.end();
};
const generateDocx = async (res, title, data, columns, filename, charts, conclusion) => {
    const children = [
        new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: title, bold: true, size: 32 })] })
    ];
    if (data && data.length > 0) {
        const tableRows = [
            new docx_1.TableRow({ children: columns.map(c => new docx_1.TableCell({ children: [new docx_1.Paragraph(c)] })) })
        ];
        data.forEach(row => {
            tableRows.push(new docx_1.TableRow({
                children: columns.map(c => new docx_1.TableCell({ children: [new docx_1.Paragraph(String(row[c] || '-'))] }))
            }));
        });
        children.push(new docx_1.Table({ rows: tableRows }));
    }
    if (conclusion) {
        children.push(new docx_1.Paragraph({ text: '' })); // spacer
        children.push(new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: 'Kesimpulan:', bold: true, size: 24 })] }));
        children.push(new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: conclusion, size: 24 })] }));
    }
    if (charts) {
        charts.forEach(chart => {
            children.push(new docx_1.Paragraph({
                children: [
                    new docx_1.ImageRun({
                        type: 'png',
                        data: chart.image,
                        transformation: { width: 500, height: 300 }
                    })
                ]
            }));
            children.push(new docx_1.Paragraph({ text: chart.description }));
        });
    }
    const doc = new docx_1.Document({
        sections: [{
                properties: {},
                children
            }]
    });
    const buffer = await docx_1.Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);
};
const generateExcel = async (res, data, columns, filename) => {
    const HEADER_ROW = columns.map(c => ({ value: c, fontWeight: 'bold' }));
    const dataRows = data.map(row => columns.map(c => ({ type: String, value: row[c] ? String(row[c]) : '-' })));
    const buffer = await (0, node_1.default)([HEADER_ROW, ...dataRows], {}).toBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);
};
router.get('/renting', async (req, res) => {
    try {
        const { format } = req.query; // excel, pdf, word
        const rentals = await RentalTransaction_1.default.find().populate('customerId kebayaId');
        const columns = ['ID', 'Pelanggan', 'Room', 'Waktu Sewa', 'Status'];
        const data = rentals.map(r => ({
            'ID': r._id.toString(),
            'Pelanggan': r.customerId?.name || 'Unknown',
            'Room': r.kebayaId?.tipeKamar || 'Unknown',
            'Waktu Sewa': new Date(r.rentalStartTime).toLocaleDateString('id-ID'),
            'Status': r.status
        }));
        const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '').split('.')[0];
        const baseFilename = `Laporan_Penyewaan_${timestamp}`;
        const totalTransactions = data.length;
        const conclusion = `Berdasarkan data di atas, total penyewaan yang tercatat adalah sebanyak ${totalTransactions} transaksi. Laporan ini memberikan gambaran umum mengenai aktivitas penyewaan room.`;
        if (format === 'pdf')
            return generatePdf(res, 'Laporan Penyewaan', data, columns, `${baseFilename}.pdf`, undefined, conclusion);
        if (format === 'word')
            return await generateDocx(res, 'Laporan Penyewaan', data, columns, `${baseFilename}.docx`, undefined, conclusion);
        // default excel
        await generateExcel(res, data, columns, `${baseFilename}.xlsx`);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/financial', async (req, res) => {
    try {
        const { format, range } = req.query; // excel, pdf, word, range
        let dateFilter = {};
        const now = new Date();
        if (range === 'daily') {
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateFilter = { $gte: start };
        }
        else if (range === 'weekly') {
            const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateFilter = { $gte: start };
        }
        else if (range === 'monthly') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { $gte: start };
        }
        else if (range === 'quarterly') {
            const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            dateFilter = { $gte: start };
        }
        else if (range === 'yearly') {
            const start = new Date(now.getFullYear(), 0, 1);
            dateFilter = { $gte: start };
        }
        const query = { status: 'Completed' };
        if (Object.keys(dateFilter).length > 0) {
            query.rentalEndTime = dateFilter;
        }
        const rentals = await RentalTransaction_1.default.find(query).populate('customerId kebayaId');
        const columns = ['ID', 'Pelanggan', 'Room', 'Waktu Sewa', 'Pendapatan (Rp)'];
        let total = 0;
        const data = rentals.map(r => {
            total += r.amountToPay || 0;
            return {
                'ID': r._id.toString(),
                'Pelanggan': r.customerId?.name || 'Unknown',
                'Room': r.kebayaId?.tipeKamar || 'Unknown',
                'Waktu Sewa': new Date(r.rentalStartTime).toLocaleDateString('id-ID'),
                'Pendapatan (Rp)': String(r.amountToPay || 0)
            };
        });
        data.push({ 'ID': 'TOTAL', 'Pelanggan': '', 'Room': '', 'Waktu Sewa': '', 'Pendapatan (Rp)': String(total) });
        const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '').split('.')[0];
        const baseFilename = `Laporan_Keuangan_${range || 'Semua'}_${timestamp}`;
        const conclusion = `Berdasarkan laporan keuangan di atas, total pendapatan yang diperoleh untuk periode yang dipilih adalah sebesar Rp ${total.toLocaleString('id-ID')}. Total ini diperoleh dari ${data.length - 1} transaksi penyewaan yang telah berstatus "Completed".`;
        if (format === 'pdf')
            return generatePdf(res, `Laporan Keuangan (${range || 'Semua'})`, data, columns, `${baseFilename}.pdf`, undefined, conclusion);
        if (format === 'word')
            return await generateDocx(res, `Laporan Keuangan (${range || 'Semua'})`, data, columns, `${baseFilename}.docx`, undefined, conclusion);
        await generateExcel(res, data, columns, `${baseFilename}.xlsx`);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/dashboard', async (req, res) => {
    try {
        const { format } = req.query;
        const rentals = await RentalTransaction_1.default.find().populate('kebayaId customerId');
        const completedRentals = rentals.filter(r => r.status === 'Completed' && r.rentalEndTime);
        // Calculate revenue
        const revenuePerMonth = new Array(12).fill(0);
        for (const r of completedRentals) {
            const month = new Date(r.rentalEndTime).getMonth();
            revenuePerMonth[month] += r.amountToPay || 0;
        }
        let totalRevenue = revenuePerMonth.reduce((a, b) => a + b, 0);
        // Calculate Popularity and Top Value Customers
        const kebayaCounts = {};
        const customerCounts = {};
        const customerRevenue = {};
        for (const r of rentals) {
            if (r.kebayaId) {
                const k = r.kebayaId;
                const key = `${k.tipeKamar} (${k.fasilitas})`;
                kebayaCounts[key] = (kebayaCounts[key] || 0) + 1;
            }
            const cId = r.customerId;
            const cKey = cId?.name || 'Unknown';
            customerCounts[cKey] = (customerCounts[cKey] || 0) + 1;
            if (r.status === 'Completed' || r.status === 'Active') {
                customerRevenue[cKey] = (customerRevenue[cKey] || 0) + (r.amountToPay || r.depositAmount || 0);
            }
        }
        let popSorted = Object.entries(kebayaCounts).sort((a, b) => b[1] - a[1]);
        if (popSorted.length > 4) {
            const top4 = popSorted.slice(0, 4);
            const others = popSorted.slice(4).reduce((sum, curr) => sum + curr[1], 0);
            popSorted = [...top4, ['Lainnya', others]];
        }
        const revSortedC = Object.entries(customerRevenue).sort((a, b) => b[1] - a[1]).slice(0, 5);
        // Loyalty Segmentation
        let segment1x = 0;
        let segment2x = 0;
        let segment3plus = 0;
        for (const count of Object.values(customerCounts)) {
            if (count === 1)
                segment1x++;
            else if (count === 2)
                segment2x++;
            else if (count >= 3)
                segment3plus++;
        }
        // Deposit Status Segmentation for Active/Booked/Ready
        let depositPaid = 0;
        let depositUnpaid = 0;
        for (const r of rentals) {
            if (['Active', 'Booked', 'Ready'].includes(r.status)) {
                if (r.depositPaid)
                    depositPaid++;
                else
                    depositUnpaid++;
            }
        }
        // Calculate Volume
        const rentalsPerMonth = new Array(12).fill(0);
        for (const r of rentals) {
            const month = new Date(r.rentalStartTime).getMonth();
            rentalsPerMonth[month]++;
        }
        // Problematic Customers
        const customerIssues = {};
        for (const r of rentals) {
            const cId = r.customerId;
            const cKey = cId?.name || 'Unknown';
            if (!customerIssues[cKey])
                customerIssues[cKey] = 0;
            if (r.status === 'Cancelled')
                customerIssues[cKey] += 1;
            if (r.penaltyAmount && r.penaltyAmount > 0)
                customerIssues[cKey] += (r.penaltyAmount / 10000);
        }
        const probSorted = Object.entries(customerIssues).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
        if (format === 'excel') {
            const columns = ['ID', 'Pelanggan', 'Room', 'Waktu Sewa', 'Status', 'Pendapatan'];
            const data = rentals.map(r => ({
                'ID': r._id.toString(),
                'Pelanggan': r.customerId?.name || 'Unknown',
                'Room': r.kebayaId?.tipeKamar || 'Unknown',
                'Waktu Sewa': new Date(r.rentalStartTime).toLocaleDateString('id-ID'),
                'Status': r.status,
                'Pendapatan': String(r.amountToPay || 0)
            }));
            // Append general conclusion
            data.push({ 'ID': '', 'Pelanggan': '', 'Room': '', 'Waktu Sewa': '', 'Status': '', 'Pendapatan': '' });
            data.push({ 'ID': 'KESIMPULAN UMUM', 'Pelanggan': '', 'Room': '', 'Waktu Sewa': '', 'Status': '', 'Pendapatan': '' });
            data.push({ 'ID': 'Total Penyewaan', 'Pelanggan': String(rentals.length), 'Room': '', 'Waktu Sewa': '', 'Status': '', 'Pendapatan': '' });
            data.push({ 'ID': 'Total Pendapatan', 'Pelanggan': `Rp ${totalRevenue}`, 'Room': '', 'Waktu Sewa': '', 'Status': '', 'Pendapatan': '' });
            if (popSorted.length > 0) {
                data.push({ 'ID': 'Room Terpopuler', 'Pelanggan': `${popSorted[0][0]} (${popSorted[0][1]}x)`, 'Room': '', 'Waktu Sewa': '', 'Status': '', 'Pendapatan': '' });
            }
            const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '').split('.')[0];
            return await generateExcel(res, data, columns, `Dashboard_Export_${timestamp}.xlsx`);
        }
        // PDF and Word: Generate Charts
        const width = 800;
        const height = 400;
        const chartJSNodeCanvas = new chartjs_node_canvas_1.ChartJSNodeCanvas({ width, height });
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const numberFormatter = (value) => {
            if (value >= 1000000)
                return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'jt';
            if (value >= 1000)
                return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'rb';
            return value;
        };
        const barOptions = {
            layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } },
            plugins: {
                legend: { labels: { padding: 20 } },
                datalabels: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grace: '15%',
                    ticks: { callback: numberFormatter }
                }
            }
        };
        const lineOptions = {
            layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } },
            plugins: {
                legend: { labels: { padding: 20 } },
                datalabels: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grace: '15%',
                    ticks: { stepSize: 1 }
                }
            }
        };
        const pieOptions = {
            layout: { padding: 20 },
            plugins: {
                legend: { labels: { padding: 20 } },
                datalabels: { display: false }
            }
        };
        const revBuffer = await chartJSNodeCanvas.renderToBuffer({
            type: 'bar',
            data: { labels: months, datasets: [{ label: 'Pendapatan (Rp)', data: revenuePerMonth, backgroundColor: 'rgba(54, 162, 235, 0.5)' }] },
            options: barOptions
        });
        const totalRev = revenuePerMonth.reduce((a, b) => a + b, 0);
        const maxRev = Math.max(...revenuePerMonth);
        const maxRevMonth = months[revenuePerMonth.indexOf(maxRev)] || 'N/A';
        const revDesc = `Total pendapatan selama periode ini adalah Rp ${totalRev.toLocaleString('id-ID')}. Pendapatan tertinggi terjadi pada bulan ${maxRevMonth} sebesar Rp ${maxRev.toLocaleString('id-ID')}. Rata-rata pendapatan per bulan adalah Rp ${Math.round(totalRev / 12).toLocaleString('id-ID')}.`;
        const popLabels = popSorted.map(p => p[0]);
        const popData = popSorted.map(p => p[1]);
        const popBuffer = await chartJSNodeCanvas.renderToBuffer({
            type: 'pie',
            data: { labels: popLabels, datasets: [{ label: 'Penyewaan', data: popData, backgroundColor: ['#ff9999', '#66b3ff', '#99ff99', '#ffcc99', '#95a5a6'] }] },
            options: pieOptions
        });
        const totalPop = popData.reduce((a, b) => a + b, 0);
        const popDesc = popSorted.length > 0 ? `Dari total ${totalPop} penyewaan room, model yang paling banyak disewa adalah ${popLabels[0]} (sebanyak ${popData[0]} kali), diikuti oleh ${popLabels[1] || '-'} (${popData[1] || 0} kali) dan ${popLabels[2] || '-'} (${popData[2] || 0} kali).` : 'Belum ada data penyewaan.';
        const volBuffer = await chartJSNodeCanvas.renderToBuffer({
            type: 'line',
            data: { labels: months, datasets: [{ label: 'Volume Sewa', data: rentalsPerMonth, borderColor: 'rgba(75, 192, 192, 1)', fill: false }] },
            options: lineOptions
        });
        const totalVol = rentalsPerMonth.reduce((a, b) => a + b, 0);
        const maxVol = Math.max(...rentalsPerMonth);
        const maxVolMonth = months[rentalsPerMonth.indexOf(maxVol)] || 'N/A';
        const volDesc = `Total volume penyewaan mencapai ${totalVol} transaksi. Puncak aktivitas penyewaan tercatat pada bulan ${maxVolMonth} dengan total ${maxVol} transaksi.`;
        // High Value Customers Chart
        const valLabels = revSortedC.map(p => p[0]);
        const valData = revSortedC.map(p => p[1]);
        const valBuffer = await chartJSNodeCanvas.renderToBuffer({
            type: 'bar',
            data: { labels: valLabels, datasets: [{ label: 'Total Pendapatan', data: valData, backgroundColor: '#f39c12' }] },
            options: barOptions
        });
        const totalVal = valData.reduce((a, b) => a + b, 0);
        const valDesc = `Top 5 pelanggan menyumbang total pendapatan sebesar Rp ${totalVal.toLocaleString('id-ID')}. Pelanggan teratas adalah ${valLabels[0] || 'N/A'} (Rp ${(valData[0] || 0).toLocaleString('id-ID')}), disusul oleh ${valLabels[1] || '-'} (Rp ${(valData[1] || 0).toLocaleString('id-ID')}).`;
        // Loyalty Chart
        const loyBuffer = await chartJSNodeCanvas.renderToBuffer({
            type: 'pie',
            data: { labels: ['Sewa 1x', 'Sewa 2x', 'Sewa 3x+'], datasets: [{ data: [segment1x, segment2x, segment3plus], backgroundColor: ['#e74c3c', '#f1c40f', '#2ecc71'] }] },
            options: pieOptions
        });
        const loyDesc = `Berdasarkan frekuensi sewa, sebanyak ${segment1x} pelanggan baru melakukan 1 kali transaksi. Terdapat ${segment2x} pelanggan yang menyewa 2 kali, dan ${segment3plus} pelanggan setia yang telah menyewa 3 kali atau lebih.`;
        // Deposit Chart
        const depBuffer = await chartJSNodeCanvas.renderToBuffer({
            type: 'pie',
            data: { labels: ['Deposit Lunas', 'Belum Lunas/Belum DP'], datasets: [{ data: [depositPaid, depositUnpaid], backgroundColor: ['#27ae60', '#c0392b'] }] },
            options: pieOptions
        });
        const depDesc = `Terdapat ${depositPaid + depositUnpaid} penyewaan yang sedang berjalan. Dari jumlah tersebut, ${depositPaid} penyewaan telah melunasi deposit, sedangkan ${depositUnpaid} penyewaan belum lunas/belum memberikan DP.`;
        // Problematic Customers Chart
        const probLabels = probSorted.map(p => p[0]);
        const probData = probSorted.map(p => p[1]);
        const probBuffer = await chartJSNodeCanvas.renderToBuffer({
            type: 'bar',
            data: { labels: probLabels, datasets: [{ label: 'Poin Masalah', data: probData, backgroundColor: '#c0392b' }] },
            options: barOptions
        });
        const probDesc = `Tercatat ${probSorted.length} pelanggan yang memiliki riwayat poin masalah (denda keterlambatan/pembatalan). Pelanggan dengan akumulasi poin tertinggi adalah ${probLabels[0] || 'N/A'} dengan total ${probData[0] || 0} poin, diikuti oleh ${probLabels[1] || '-'} (${probData[1] || 0} poin).`;
        const charts = [
            { image: revBuffer, description: revDesc },
            { image: popBuffer, description: popDesc },
            { image: volBuffer, description: volDesc },
            { image: valBuffer, description: valDesc },
            { image: loyBuffer, description: loyDesc },
            { image: depBuffer, description: depDesc },
            { image: probBuffer, description: probDesc }
        ];
        const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '').split('.')[0];
        const baseFilename = `Dashboard_Report_${timestamp}`;
        if (format === 'pdf')
            return generatePdf(res, 'Dashboard Report', [], [], `${baseFilename}.pdf`, charts);
        if (format === 'word')
            return await generateDocx(res, 'Dashboard Report', [], [], `${baseFilename}.docx`, charts);
        res.status(400).json({ error: 'Invalid format' });
    }
    catch (err) {
        console.error('[DASHBOARD EXPORT ERROR]', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});
exports.default = router;
//# sourceMappingURL=reports.js.map