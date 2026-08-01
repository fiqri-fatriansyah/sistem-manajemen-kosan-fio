import { Router, Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import RentalTransaction from '../models/RentalTransaction';
import { calculateRentalFinancials } from './rentals';

const router = Router();

router.get('/:type/:transactionId', async (req: Request, res: Response) => {
  try {
    const { type, transactionId } = req.params;
    const rawRental = await RentalTransaction.findOne({ transactionId })
      .populate('customerIds')
      .populate({ path: 'roomId', populate: { path: 'roomTypeId' } });
    
    if (!rawRental) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const rental = calculateRentalFinancials(rawRental);

    const customers: any = rental.customerIds || [];
    const customerNames = customers.map((c: any) => c.name).join(', ') || 'Unknown';
    const customerPhones = customers.map((c: any) => c.telephone).join(', ') || 'Unknown';
    const room: any = rental.roomId;
    const roomType: any = room?.roomTypeId;

    const doc = new PDFDocument({ size: 'A5', layout: 'landscape', margin: 30 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${type}_${transactionId}.pdf`);
    
    doc.pipe(res);
    
    // Header
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#2980b9').text('Sistem Manajemen Kosan Fio', { align: 'center' });
    doc.fontSize(14).font('Helvetica').fillColor('#333333').text(`Kwitansi ${type}`, { align: 'center' });
    doc.moveDown();
    
    // Line
    doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor('#dddddd').stroke();
    doc.moveDown();

    // Details Left
    const startY = doc.y;
    doc.fontSize(12).font('Helvetica-Bold').text('Detail Transaksi:', 30, startY);
    doc.font('Helvetica').text(`ID Transaksi  : ${transactionId}`, 30, startY + 20);
    doc.text(`Tanggal Cetak : ${new Date().toLocaleString('id-ID')}`, 30, startY + 40);
    doc.text(`Pelanggan     : ${customerNames}`, 30, startY + 60, { width: 250 });
    doc.text(`Telepon       : ${customerPhones}`, 30, startY + 90, { width: 250 });

    // Details Right
    doc.font('Helvetica-Bold').text('Detail Sewa:', 300, startY);
    doc.font('Helvetica').text(`Room        : ${room?.roomNumber} (${roomType?.name})`, 300, startY + 20);
    
    let totalTagihanSaatIni = 0;
    
    if (rental.rentalType === 'Long-Stay') {
      doc.text(`Terbayar S/D  : ${new Date(rental.paidUntil || rental.rentalStartTime).toLocaleDateString('id-ID')}`, 300, startY + 40);
      doc.text(`Harga Sewa    : Rp ${roomType?.price}/Bulan`, 300, startY + 60);
      totalTagihanSaatIni = rental.totalPaid + rental.tunggakanAmount;
    } else {
      doc.text(`C/O atau Tenggat : ${new Date(rental.expectedReturnDate || rental.rentalStartTime).toLocaleDateString('id-ID')}`, 300, startY + 40);
      const harian = roomType?.priceDaily || Math.ceil((roomType?.price || 0) / 30);
      doc.text(`Harga Sewa    : Rp ${harian}/Hari`, 300, startY + 60);
      
      const start = new Date(rental.rentalStartTime);
      const end = new Date(rental.expectedReturnDate || rental.rentalStartTime);
      let days = Math.ceil((end.getTime() - start.getTime()) / 86400000);
      if (days < 1) days = 1;
      totalTagihanSaatIni = days * harian;
    }
    
    if (type === 'Deposit' || type === 'Payment') {
      doc.text(`Total Tagihan : Rp ${totalTagihanSaatIni}`, 300, startY + 80);
      doc.text(`Total Dibayar : Rp ${rental.totalPaid}`, 300, startY + 100);
      if (rental.tunggakanAmount > 0) {
        doc.fillColor('red').text(`Kekurangan    : Rp ${rental.tunggakanAmount}`, 300, startY + 120);
      } else if (rental.saldoMengendap > 0) {
        doc.fillColor('green').text(`Saldo (Kredit): Rp ${rental.saldoMengendap}`, 300, startY + 120);
      }
    } else {
      doc.text(`Total Dibayar Akhir: Rp ${rental.amountToPay || 0}`, 300, startY + 80);
    }

    doc.moveDown();
    const finalY = doc.y + 110;
    doc.moveTo(30, finalY).lineTo(565, finalY).strokeColor('#dddddd').stroke();
    
    doc.text('', 30, finalY + 10);
    doc.fontSize(10).font('Helvetica-Oblique').fillColor('#666666').text('Terima kasih telah menyewa di Kosan Fio!', { align: 'center' });
    
    doc.end();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
