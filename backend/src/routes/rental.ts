import { Router, Request, Response } from 'express';
import RentalTransaction from '../models/RentalTransaction';
import Room from '../models/Room';

const router = Router();

// Create a rental (rent out a room)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { customerId, kebayaId, expectedReturnDate, depositAmount, depositPaid } = req.body;
    
    // Check stock
    const room = await Room.findById(kebayaId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.availableStock <= 0) return res.status(400).json({ error: 'Out of stock' });

    // Decrement stock
    room.availableStock -= 1;
    await room.save();

    const transactionId = 'TRX-' + Date.now();
    // Create transaction
    const rental = new RentalTransaction({ 
      transactionId,
      customerId, 
      kebayaId,
      expectedReturnDate,
      depositAmount,
      depositPaid
    });
    await rental.save();
    
    res.status(201).json(rental);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Complete a rental (return room)
router.post('/:id/return', async (req: Request, res: Response) => {
  try {
    const { penaltyCost, returnStatus } = req.body;
    const rental = await RentalTransaction.findById(req.params.id);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });

    const room = await Room.findById(rental.kebayaId);
    if (room) {
      if (returnStatus === 'Laundry') {
        room.cleaningStock = (room.cleaningStock || 0) + 1;
      } else if (returnStatus === 'Maintenance') {
        room.maintenanceStock = (room.maintenanceStock || 0) + 1;
      } else {
        room.availableStock += 1;
      }
      await room.save();
    }

    const basePrice = room ? room.price : 0;
    const finalPenalty = Number(penaltyCost) || 0;
    const amountToPay = basePrice + finalPenalty;
    
    rental.status = 'Completed';
    rental.rentalEndTime = new Date();
    rental.amountToPay = amountToPay;
    await rental.save();

    res.json({
      rental,
      basePay: basePrice,
      penaltyPay: finalPenalty,
      depositAmount: rental.depositAmount,
      total: amountToPay - rental.depositAmount
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get active rentals
router.get('/active', async (req: Request, res: Response) => {
  try {
    const rentals = await RentalTransaction.find({ status: 'Active' }).populate('customerId').populate('kebayaId');
    res.json(rentals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all rentals
router.get('/', async (req: Request, res: Response) => {
  try {
    const rentals = await RentalTransaction.find().populate('customerId').populate('kebayaId').sort({ createdAt: -1 });
    res.json(rentals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
