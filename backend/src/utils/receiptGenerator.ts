import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generateReceipt = (rental: any, type: 'Deposit' | 'Lunas' | 'Parsial', paymentInfo?: any): string => {
  const dir = path.join(__dirname, '../../../public/receipts');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let fileName = `${type}_${rental.transactionId}.pdf`;
  if (type === 'Parsial' && paymentInfo) {
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

  doc.text(`Nama Pelanggan: ${rental.customerId.name}`);
  doc.text(`No. Telp: ${rental.customerId.telephone}`);
  doc.moveDown();

  doc.text(`Room Disewa: ${rental.kebayaId.tipeKamar} (${rental.kebayaId.fasilitas})`);
  doc.text(`Tanggal Sewa: ${new Date(rental.rentalStartTime).toLocaleDateString('id-ID')}`);
  doc.text(`Ekspektasi Kembali: ${new Date(rental.expectedReturnDate).toLocaleDateString('id-ID')}`);
  doc.moveDown();

  if (type === 'Deposit') {
    doc.text(`Status Deposit: ${rental.depositPaid ? 'DIBAYAR' : 'BELUM DIBAYAR'}`);
    doc.text(`Jumlah Deposit: Rp ${rental.depositAmount}`);
  } else if (type === 'Parsial') {
    doc.text(`Tipe Pembayaran: Cicilan Deposit`);
    if (paymentInfo) {
      doc.text(`ID Kwitansi: ${paymentInfo.receiptId}`);
      doc.text(`Jumlah Dibayar Sekarang: Rp ${paymentInfo.amount}`);
    }
    const totalPaid = rental.payments ? rental.payments.reduce((acc: number, curr: any) => acc + curr.amount, 0) : 0;
    doc.text(`Total Terbayar (termasuk ini): Rp ${totalPaid}`);
    doc.text(`Total Deposit Disyaratkan: Rp ${rental.depositAmount}`);
    doc.text(`Status Deposit: ${rental.depositPaid ? 'DIBAYAR' : 'BELUM LUNAS'}`);
  } else {
    // Lunas
    doc.text(`Waktu Pengembalian: ${new Date(rental.rentalEndTime).toLocaleDateString('id-ID')}`);
    doc.text(`Total Tagihan Akhir (sudah dipotong deposit): Rp ${rental.amountToPay}`);
  }

  doc.moveDown(2);
  doc.fontSize(10).text('Terima kasih telah menyewa di Kosan Fio!', { align: 'center', italic: true });

  doc.end();
  return `/receipts/${fileName}`;
};
