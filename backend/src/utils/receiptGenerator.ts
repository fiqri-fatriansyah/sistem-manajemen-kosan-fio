import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generateReceipt = (rental: any, type: 'Deposit' | 'Payment' | 'Lunas', paymentInfo?: any): string => {
  const dir = path.join(__dirname, '../../../public/receipts');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let fileName = `${type}_${rental.transactionId}.pdf`;
  if (type === 'Payment' && paymentInfo) {
    fileName = `${type}_${rental.transactionId}_${paymentInfo.receiptId}.pdf`;
  }
  
  const filePath = path.join(dir, fileName);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text('Sistem Manajemen Kosan Fio', { align: 'center' });
  doc.fontSize(14).text(`Kwitansi ${type}`, { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Transaction ID: ${rental.transactionId}`);
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`);
  doc.moveDown();

  const names = rental.customerIds ? rental.customerIds.map((c: any) => c.name).join(', ') : 'Unknown';
  const phones = rental.customerIds ? rental.customerIds.map((c: any) => c.telephone).join(', ') : 'Unknown';

  doc.text(`Nama Pelanggan: ${names}`);
  doc.text(`No. Telp: ${phones}`);
  doc.moveDown();

  const roomName = rental.roomId && rental.roomId.roomTypeId ? rental.roomId.roomTypeId.name : 'Unknown';
  const roomNumber = rental.roomId ? rental.roomId.roomNumber : 'Unknown';

  doc.text(`Room Disewa: ${roomName} (No: ${roomNumber})`);
  doc.text(`Tipe Sewa: ${rental.rentalType}`);
  doc.text(`Tanggal Sewa: ${new Date(rental.rentalStartTime).toLocaleDateString('id-ID')}`);
  
  if (rental.rentalType === 'One-Time' && rental.expectedReturnDate) {
    doc.text(`Ekspektasi Selesai: ${new Date(rental.expectedReturnDate).toLocaleDateString('id-ID')}`);
  } else if (rental.rentalType === 'Long-Stay' && rental.paidUntil) {
    doc.text(`Terbayar Hingga: ${new Date(rental.paidUntil).toLocaleDateString('id-ID')}`);
  }
  
  doc.moveDown();

  if (type === 'Deposit') {
    doc.text(`Status Deposit: ${rental.depositPaid ? 'DIBAYAR' : 'BELUM DIBAYAR'}`);
    doc.text(`Jumlah Pembayaran Awal: Rp ${rental.depositAmount}`);
  } else if (type === 'Payment') {
    doc.text(`Tipe Pembayaran: Pembayaran Sewa/Deposit`);
    if (paymentInfo) {
      doc.text(`ID Kwitansi: ${paymentInfo.receiptId}`);
      doc.text(`Jumlah Dibayar Sekarang: Rp ${paymentInfo.amount}`);
    }
  } else {
    // Lunas
    if (rental.rentalEndTime) {
      doc.text(`Waktu Pengembalian: ${new Date(rental.rentalEndTime).toLocaleDateString('id-ID')}`);
    }
    doc.text(`Total Tagihan Akhir (sudah dipotong deposit): Rp ${rental.amountToPay || 0}`);
  }

  doc.moveDown(2);
  doc.fontSize(10).text('Terima kasih telah menyewa di Kosan Fio!', { align: 'center', italic: true });

  doc.end();
  return `/receipts/${fileName}`;
};
