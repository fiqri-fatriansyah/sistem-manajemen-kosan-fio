"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pdfkit_1 = __importDefault(require("pdfkit"));
const RentalTransaction_1 = __importDefault(require("../models/RentalTransaction"));
const router = (0, express_1.Router)();
router.get('/:type/:transactionId', async (req, res) => {
    try {
        const { type, transactionId } = req.params;
        const rental = await RentalTransaction_1.default.findOne({ transactionId }).populate('customerId kebayaId');
        if (!rental) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        const customer = rental.customerId;
        const room = rental.kebayaId;
        const doc = new pdfkit_1.default({ size: 'A5', layout: 'landscape', margin: 30 });
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
        doc.text(`Pelanggan     : ${customer?.name}`, 30, startY + 60);
        doc.text(`Telepon       : ${customer?.telephone}`, 30, startY + 80);
        // Details Right
        doc.font('Helvetica-Bold').text('Detail Sewa:', 300, startY);
        doc.font('Helvetica').text(`Room        : ${room?.tipeKamar} - ${room?.fasilitas}`, 300, startY + 20);
        doc.text(`Jatuh Tempo   : ${new Date(rental.expectedReturnDate).toLocaleDateString('id-ID')}`, 300, startY + 40);
        if (type === 'Deposit') {
            doc.text(`Harga Sewa    : Rp ${room?.price}`, 300, startY + 60);
            doc.text(`Deposit Dibayar : Rp ${rental.depositAmount} ${rental.depositPaid ? '(LUNAS)' : '(BELUM LUNAS)'}`, 300, startY + 80);
        }
        else {
            doc.text(`Total Denda   : Rp ${rental.penaltyAmount || 0}`, 300, startY + 60);
            doc.text(`Total Dibayar : Rp ${rental.amountToPay || 0}`, 300, startY + 80);
        }
        doc.moveDown();
        const finalY = doc.y + 40;
        doc.moveTo(30, finalY).lineTo(565, finalY).strokeColor('#dddddd').stroke();
        doc.text('', 30, finalY + 10);
        doc.fontSize(10).font('Helvetica-Oblique').fillColor('#666666').text('Terima kasih telah menyewa di Kosan Fio!', { align: 'center' });
        doc.end();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=receipts.js.map