import { Router, Request, Response } from 'express';
import AuditLog from '../models/AuditLog';
import PDFDocument from 'pdfkit';

const router = Router();

const requirePin = (req: Request, res: Response, next: any) => {
  const masterPin = process.env.MASTER_PIN;
  if (!masterPin || req.query.pin !== masterPin) {
    return res.status(401).json({ error: 'Unauthorized: Invalid PIN or PIN not configured' });
  }
  next();
};

router.get('/', requirePin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    
    let query: any = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query = {
        $or: [
          { action: regex },
          { entity: regex },
          { details: regex }
        ]
      };
    }
    
    const totalCount = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    res.json({ logs, totalPages: Math.ceil(totalCount / limit) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export/pdf', requirePin, async (req: Request, res: Response) => {
  try {
    const range = req.query.range as string;
    let query: any = {};
    let dateStr = 'Seluruh Waktu';
    
    if (range && range !== 'all') {
      const days = parseInt(range);
      if (!isNaN(days)) {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        query.timestamp = { $gte: fromDate };
        dateStr = `${days} Hari Terakhir`;
      }
    }
    
    const logs = await AuditLog.find(query).sort({ timestamp: -1 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="Audit_Log.pdf"');

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('Sistem Manajemen Kosan Fio', { align: 'center' });
    doc.fontSize(14).text('Laporan Audit & Aktivitas Sistem', { align: 'center' });
    doc.fontSize(10).fillColor('gray').text(`Rentang Waktu: ${dateStr}`, { align: 'center' });
    doc.fillColor('black').moveDown(2);

    if (logs.length === 0) {
      doc.text('Tidak ada aktivitas terekam pada rentang waktu ini.', { align: 'center' });
    } else {
      logs.forEach(log => {
        doc.fontSize(10).font('Helvetica-Bold').text(`[${new Date(log.timestamp).toLocaleString('id-ID')}] ${log.action} ${log.entity}`);
        doc.font('Helvetica').text(log.details);
        doc.moveDown(0.5);
      });
    }

    doc.end();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
