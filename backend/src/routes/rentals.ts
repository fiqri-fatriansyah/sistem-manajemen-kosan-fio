import { Router, Request, Response } from 'express';
import RentalTransaction from '../models/RentalTransaction';
import Room from '../models/Room';
import Config from '../models/Config';
import AuditLog from '../models/AuditLog';
import { generateReceipt } from '../utils/receiptGenerator';

const router = Router();

// Financial Calculation Helper
export const calculateRentalFinancials = (rentalDoc: any) => {
  const rental = rentalDoc.toObject ? rentalDoc.toObject() : rentalDoc;
  const rt = rental.roomId?.roomTypeId;
  if (!rt) return rental;

  const now = new Date();
  const start = new Date(rental.rentalStartTime);
  let totalPaid = 0;
  
  if (rental.payments && rental.payments.length > 0) {
    totalPaid = rental.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
  }

  let tunggakanAmount = 0;
  let saldoMengendap = 0;
  let currentStatusText = rental.status;
  let uiStatus = rental.status;
  let calculatedPaidUntil = rental.paidUntil;

  if (rental.rentalType === 'Long-Stay') {
    const monthlyPrice = rental.roomId.priceMonthly || rt.price;
    const monthsPaidFull = Math.floor(totalPaid / monthlyPrice);
    saldoMengendap = 0; // Will be calculated if there's overpayment

    calculatedPaidUntil = new Date(start.getFullYear(), start.getMonth() + monthsPaidFull, start.getDate());
    
    if (rental.status !== 'Completed' && rental.status !== 'Cancelled') {
      if (rental.status === 'Active') {
        uiStatus = 'Active';
        rental.depositPaid = totalPaid > 0;
        
        // Calculate expected months up to today
        let expectedMonths = 1;
        let tempDate = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
        while (now > tempDate) {
          expectedMonths++;
          tempDate.setMonth(tempDate.getMonth() + 1);
        }
        
        const expectedTotal = expectedMonths * monthlyPrice;
        if (expectedTotal > totalPaid) {
          tunggakanAmount = expectedTotal - totalPaid;
          saldoMengendap = 0;
          currentStatusText = 'Tunggakan';
        } else {
          tunggakanAmount = 0;
          saldoMengendap = totalPaid - expectedTotal;
          currentStatusText = 'Terbayar';
        }
      } else {
        // Booked
        if (totalPaid === 0) {
          currentStatusText = 'Belum Bayar (Booked)';
          tunggakanAmount = monthlyPrice;
          uiStatus = 'Booked';
          rental.depositPaid = false;
        } else if (totalPaid < monthlyPrice) {
          currentStatusText = 'DP Parsial (Booked)';
          tunggakanAmount = monthlyPrice - totalPaid;
          uiStatus = 'Booked';
          rental.depositPaid = false;
          saldoMengendap = 0;
        } else {
          currentStatusText = 'Lunas (Booked)';
          tunggakanAmount = 0;
          uiStatus = 'Booked';
          rental.depositPaid = true;
          saldoMengendap = totalPaid - monthlyPrice;
        }
      }
    }
  } else {
    // One-Time
    const dailyPrice = rental.roomId.priceDaily || rt.priceDaily || Math.ceil(rt.price / 30);
    const end = new Date(rental.expectedReturnDate || start);
    let days = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    if (days < 1) days = 1;
    const expectedTotal = days * dailyPrice;
    
    if (rental.status !== 'Completed' && rental.status !== 'Cancelled') {
      if (rental.status === 'Active') {
        uiStatus = 'Active';
        rental.depositPaid = totalPaid > 0;
        saldoMengendap = totalPaid > expectedTotal ? totalPaid - expectedTotal : 0;
        tunggakanAmount = expectedTotal > totalPaid ? expectedTotal - totalPaid : 0;
        if (now > end && tunggakanAmount > 0) {
           currentStatusText = 'Tunggakan & Overstay';
        } else if (now > end) {
           currentStatusText = 'Overstay';
        } else if (tunggakanAmount > 0) {
           currentStatusText = 'Tunggakan';
        } else {
           currentStatusText = 'Terbayar';
        }
      } else {
        // Booked
        if (totalPaid === 0) {
          currentStatusText = 'Belum DP (Booked)';
          tunggakanAmount = expectedTotal;
          uiStatus = 'Booked';
          rental.depositPaid = false;
        } else if (totalPaid < expectedTotal) {
          currentStatusText = 'DP Parsial (Booked)';
          tunggakanAmount = expectedTotal - totalPaid;
          if (now > start) currentStatusText = 'Tunggakan DP';
          uiStatus = 'Booked';
          rental.depositPaid = false;
          saldoMengendap = 0;
        } else {
          currentStatusText = 'Lunas (Booked)';
          tunggakanAmount = 0;
          uiStatus = 'Booked';
          rental.depositPaid = true;
          saldoMengendap = totalPaid - expectedTotal;
        }
      }
    } else if (rental.status === 'Completed') {
        tunggakanAmount = Math.max(0, (rental.amountToPay || expectedTotal) - totalPaid);
    }
  }

  // Optional: keep rental.status synced with uiStatus automatically in DB when fetched?
  // We won't mutate DB in GET, just return for UI.

  return {
    ...rental,
    totalPaid,
    tunggakanAmount,
    saldoMengendap,
    currentStatusText,
    uiStatus,
    paidUntil: calculatedPaidUntil
  };
};

// Create rental
router.post('/', async (req: Request, res: Response) => {
  try {
    const { customerIds, roomId, rentalType, rentalStartTime, expectedReturnDate, paymentReminderDate, initialPayment } = req.body;
    
    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ error: 'Customer(s) required' });
    }

    const room = await Room.findById(roomId).populate('roomTypeId');
    if (!room || room.status !== 'Available') {
      return res.status(400).json({ error: 'Room is not available' });
    }

    const transactionId = 'TRX-' + Date.now().toString().slice(-6);
    const paid = Number(initialPayment) || 0;
    
    if (rentalType === 'One-Time') {
      const start = new Date(rentalStartTime || new Date());
      const end = new Date(expectedReturnDate || start);
      let days = Math.ceil((end.getTime() - start.getTime()) / 86400000);
      if (days < 1) days = 1;
      const rt = room.roomTypeId as any;
      const dailyPrice = room.priceDaily || rt.priceDaily || Math.ceil(rt.price / 30);
      const expectedTotal = days * dailyPrice;
      if (paid > expectedTotal) {
        return res.status(400).json({ error: 'Pembayaran Harian tidak boleh melebihi total tagihan (overpay tidak diizinkan).' });
      }
    }

    // Define requested timeline
    const reqStart = new Date(rentalStartTime || new Date());
    let reqEnd = new Date('2099-12-31T23:59:59Z'); // Indefinite for long-stay
    if (rentalType === 'One-Time' && expectedReturnDate) {
      reqEnd = new Date(expectedReturnDate);
    }
    
    // Perform Timeline Overlap Check
    const existingRentals = await RentalTransaction.find({ 
      roomId, 
      status: { $in: ['Active', 'Booked', 'Perlu Pengusiran'] } 
    });
    
    const needsToCancelUnpaid = [];
    
    for (const cr of existingRentals) {
      const exStart = new Date(cr.rentalStartTime);
      const exEnd = cr.expectedReturnDate ? new Date(cr.expectedReturnDate) : new Date('2099-12-31T23:59:59Z');
      
      // If the new booking overlaps with an existing one
      if (reqStart < exEnd && reqEnd > exStart) {
        const totalPaidEx = (cr.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
        
        // If existing has any payment, or if the NEW booking has NO payment, it's forbidden
        if (totalPaidEx > 0 || paid === 0) {
          return res.status(400).json({ error: `Ruangan tidak tersedia pada tanggal yang dipilih. Bentrok dengan reservasi lain dari ${exStart.toLocaleDateString('id-ID')} hingga ${cr.expectedReturnDate ? exEnd.toLocaleDateString('id-ID') : 'Seterusnya'}` });
        } else {
          // The existing booking has NO payments, and WE have a payment. Overwrite!
          needsToCancelUnpaid.push(cr);
        }
      }
    }
    
    // Cancel the unpaid overlapping bookings
    for (const cr of needsToCancelUnpaid) {
      cr.status = 'Cancelled';
      await cr.save();
    }
    
    const payments = [];
    if (paid > 0) {
      payments.push({
        amount: paid,
        date: new Date(),
        receiptId: 'PAY-' + Date.now().toString().slice(-6)
      });
    }

    const rStart = rentalStartTime ? new Date(rentalStartTime) : new Date();
    const today = new Date();
    const isToday = rStart.getDate() === today.getDate() && rStart.getMonth() === today.getMonth() && rStart.getFullYear() === today.getFullYear();
    const initialStatus = (isToday && paid > 0) ? 'Active' : 'Booked';

    const rental = new RentalTransaction({
      transactionId,
      customerIds,
      roomId,
      rentalType,
      rentalStartTime: rStart,
      expectedReturnDate: rentalType === 'One-Time' ? expectedReturnDate : undefined,
      paymentReminderDate: rentalType === 'Long-Stay' ? paymentReminderDate : undefined,
      payments: payments,
      status: initialStatus
    });

    await rental.save();

    const populatedRental = await RentalTransaction.findById(rental._id).populate('customerIds').populate({ path: 'roomId', populate: { path: 'roomTypeId' } });
    
    // Calculate exact status based on the new logic
    const calc = calculateRentalFinancials(populatedRental);
    rental.status = calc.uiStatus;
    rental.depositPaid = calc.uiStatus === 'Active' || calc.uiStatus === 'Completed'; 
    rental.paidUntil = calc.paidUntil;
    rental.depositAmount = calc.tunggakanAmount + calc.totalPaid;
    await rental.save();

    const finalRental = await RentalTransaction.findById(rental._id).populate('customerIds').populate({ path: 'roomId', populate: { path: 'roomTypeId' } });
    
    // Dynamic availability check handles room availability now.

    if (paid > 0) {
      generateReceipt(finalRental, 'Payment', { amount: paid, date: new Date(), receiptId: 'PAY-' + Date.now().toString().slice(-6) });
    }

    await AuditLog.create({
      action: 'RENT',
      entity: 'Rental',
      details: `Created ${rentalType} rental ${transactionId} for Room ${room.roomNumber}`
    });

    res.status(201).json(calculateRentalFinancials(finalRental));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Manual Check-In
router.post('/:id/check-in', async (req: Request, res: Response) => {
  try {
    const rental = await RentalTransaction.findById(req.params.id);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    
    if (rental.status !== 'Booked') {
      return res.status(400).json({ error: 'Only booked rentals can be checked in.' });
    }
    
    rental.status = 'Active';
    await rental.save();
    
    await AuditLog.create({
      action: 'UPDATE',
      entity: 'Rental',
      details: `Checked in rental ${rental.transactionId}`
    });
    
    const populated = await RentalTransaction.findById(rental._id).populate('customerIds').populate({ path: 'roomId', populate: { path: 'roomTypeId' } });
    res.json(calculateRentalFinancials(populated));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all rentals
router.get('/', async (req: Request, res: Response) => {
  try {
    const rentals = await RentalTransaction.find()
      .populate('customerIds')
      .populate({ path: 'roomId', populate: { path: 'roomTypeId' } })
      .sort({ rentalStartTime: -1 });
      
    const computedRentals = rentals.map(calculateRentalFinancials);
    res.json(computedRentals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get unavailable dates for a room
router.get('/unavailable-dates/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const existingRentals = await RentalTransaction.find({ 
      roomId, 
      status: { $in: ['Active', 'Booked', 'Perlu Pengusiran'] } 
    });
    
    const unavailableRanges = existingRentals.map(r => ({
      start: r.rentalStartTime,
      end: r.expectedReturnDate || '2099-12-31T23:59:59Z',
      type: r.rentalType
    }));
    
    res.json(unavailableRanges);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get active rentals
router.get('/active', async (req: Request, res: Response) => {
  try {
    const rentals = await RentalTransaction.find({ status: { $in: ['Active', 'Booked'] } })
      .populate('customerIds')
      .populate({ path: 'roomId', populate: { path: 'roomTypeId' } });
      
    const computedRentals = rentals.map(calculateRentalFinancials);
    res.json(computedRentals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Pay Deposit / Advance Rent
router.post('/:id/pay', async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    let rental = await RentalTransaction.findById(req.params.id)
      .populate('customerIds')
      .populate({ path: 'roomId', populate: { path: 'roomTypeId' } });

    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    if (rental.status === 'Completed' || rental.status === 'Cancelled') {
       return res.status(400).json({ error: 'Rental is no longer active' });
    }

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const paymentReceiptId = 'PAY-' + Date.now().toString().slice(-6);
    const paymentInfo = { amount: payAmount, date: new Date(), receiptId: paymentReceiptId };
    
    // Fetch unpopulated to safely save array
    const docToSave = await RentalTransaction.findById(req.params.id);
    if (!docToSave) return res.status(404).json({ error: 'Not found' });
    
    docToSave.payments.push(paymentInfo);
    
    // Create a mock populated for calculation
    const mockPopulated = docToSave.toObject();
    mockPopulated.roomId = rental.roomId;
    
    let calc = calculateRentalFinancials(mockPopulated);
    
    docToSave.paidUntil = calc.paidUntil;
    docToSave.status = calc.uiStatus;
    docToSave.depositPaid = calc.uiStatus === 'Active';
    
    await docToSave.save();

    // Dynamic availability check handles room availability now.

    const finalRental = await RentalTransaction.findById(req.params.id).populate('customerIds').populate({ path: 'roomId', populate: { path: 'roomTypeId' } });
    generateReceipt(finalRental, 'Payment', paymentInfo);

    await AuditLog.create({
      action: 'UPDATE',
      entity: 'Rental',
      details: `Payment of Rp ${payAmount} received for rental ${rental.transactionId}.`
    });

    res.json(calculateRentalFinancials(finalRental));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// End Stay (Return Room)
router.post('/:id/end-stay', async (req: Request, res: Response) => {
  try {
    const rental = await RentalTransaction.findById(req.params.id)
      .populate('customerIds')
      .populate({ path: 'roomId', populate: { path: 'roomTypeId' } });
      
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    if (rental.status === 'Completed' || rental.status === 'Cancelled') return res.status(400).json({ error: 'Rental already ended' });

    rental.rentalEndTime = new Date();

    const room = rental.roomId as any;
    const rt = room.roomTypeId;
    
    // We will calculate final penalty here
    let penaltyPay = 0;
    if (rental.rentalType === 'One-Time') {
      const config = await Config.findOne();
      if (rental.rentalEndTime > rental.expectedReturnDate!) {
        const msLate = rental.rentalEndTime.getTime() - rental.expectedReturnDate!.getTime();
        const daysLate = Math.ceil(msLate / (1000 * 60 * 60 * 24));
        if (config && config.penaltyType === 'Daily') penaltyPay = config.penaltyCost * daysLate;
        else if (config && config.penaltyType === 'One-time') penaltyPay = config.penaltyCost;
      }
      
      const msRented = rental.rentalEndTime.getTime() - rental.rentalStartTime.getTime();
      let daysRented = Math.ceil(msRented / (1000 * 60 * 60 * 24));
      if (daysRented < 1) daysRented = 1;

      const basePay = (rt.priceDaily || Math.ceil(rt.price / 30)) * daysRented;
      const totalPaid = rental.payments.reduce((a, b) => a + b.amount, 0);
      rental.amountToPay = Math.max(0, basePay + penaltyPay - totalPaid);
    } else {
      rental.amountToPay = 0;
    }

    rental.status = 'Completed';
    await rental.save();

    await Room.findByIdAndUpdate(rental.roomId, { status: 'Available' });
    
    const finalRental = await RentalTransaction.findById(rental._id).populate('customerIds').populate({ path: 'roomId', populate: { path: 'roomTypeId' } });
    generateReceipt(finalRental, 'Lunas');

    await AuditLog.create({
      action: 'RETURN',
      entity: 'Rental',
      details: `Ended rental ${rental.transactionId} for Room ${room.roomNumber}`
    });

    res.json(calculateRentalFinancials(rental));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel Rental
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const rental = await RentalTransaction.findById(req.params.id);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    if (rental.status === 'Completed' || rental.status === 'Cancelled') {
      return res.status(400).json({ error: 'Cannot cancel an already completed or cancelled rental' });
    }

    rental.status = 'Cancelled';
    await rental.save();
    await Room.findByIdAndUpdate(rental.roomId, { status: 'Available' });

    await AuditLog.create({
      action: 'CANCEL',
      entity: 'Rental',
      details: `Cancelled rental ${rental.transactionId}`
    });

    res.json(rental);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Resolve Eviction
router.post('/:id/resolve-eviction', async (req: Request, res: Response) => {
  try {
    const rental = await RentalTransaction.findById(req.params.id);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    rental.status = 'Completed';
    await rental.save();
    res.json(rental);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Email Eviction
router.post('/:id/email-eviction', async (req: Request, res: Response) => {
  try {
    const rental = await RentalTransaction.findById(req.params.id).populate('customerIds');
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    const cust = (rental.customerIds && rental.customerIds[0]) ? (rental.customerIds[0] as any) : null;
    if (!cust || !cust.email) return res.status(400).json({ error: 'Email tidak tersedia untuk penyewa ini' });
    
    // Simulasikan link preview untuk demo
    res.json({ message: 'Email pengusiran terkirim', previewUrl: 'http://localhost:3001/api/reports/demo-email-receipt' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
