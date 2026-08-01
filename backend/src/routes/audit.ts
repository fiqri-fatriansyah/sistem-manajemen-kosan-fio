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
    const logs = await AuditLog.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export/pdf', requirePin, async (req: Request, res: Response) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="Audit_Log.pdf"');

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('Sistem Manajemen Kosan Fio', { align: 'center' });
    doc.fontSize(14).text('Laporan Audit & Aktivitas Sistem', { align: 'center' });
    doc.moveDown(2);

    logs.forEach(log => {
      doc.fontSize(10).font('Helvetica-Bold').text(`[${new Date(log.timestamp).toLocaleString('id-ID')}] ${log.action} ${log.entity}`);
      doc.font('Helvetica').text(log.details);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
