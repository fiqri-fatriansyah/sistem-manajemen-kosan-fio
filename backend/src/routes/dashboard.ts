import { Router, Request, Response } from 'express';
import RentalTransaction from '../models/RentalTransaction';
import Room from '../models/Room';
import RoomType from '../models/RoomType';
import Customer from '../models/Customer';
import Event from '../models/Event';

const router = Router();

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const rentals = await RentalTransaction.find().populate({ path: 'roomId', populate: { path: 'roomTypeId' } });
    
    // Top 5 rented room types
    const roomTypeCounts: Record<string, number> = {};
    for (const r of rentals) {
      if (r.roomId) {
        const room = r.roomId as any;
        if (room.roomTypeId) {
            const rtId = room.roomTypeId._id ? room.roomTypeId._id.toString() : room.roomTypeId.toString();
            roomTypeCounts[rtId] = (roomTypeCounts[rtId] || 0) + 1;
        }
      }
    }
    const popSortedRT = Object.entries(roomTypeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topRooms = [];
    for (const [id, count] of popSortedRT) {
      const rt = await RoomType.findById(id);
      if (rt) topRooms.push({ roomType: rt, count });
    }

    // Top customers (by volume and revenue)
    const customerCounts: Record<string, number> = {};
    const customerRevenue: Record<string, number> = {};
    for (const r of rentals) {
      const cIds = r.customerIds || [];
      for (const cId of cIds) {
          const idStr = cId.toString();
          customerCounts[idStr] = (customerCounts[idStr] || 0) + 1;
          
          if (r.status === 'Completed' || r.status === 'Active') {
            const paymentsTotal = r.payments ? r.payments.reduce((a, b) => a + b.amount, 0) : 0;
            // Revenue is distributed equally among tenants just for stats purposes, or just apply full to all
            customerRevenue[idStr] = (customerRevenue[idStr] || 0) + (paymentsTotal / cIds.length);
          }
      }
    }
    
    const popSortedC = Object.entries(customerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topCustomers = [];
    for (const [id, count] of popSortedC) {
      const c = await Customer.findById(id);
      if (c) topCustomers.push({ customer: c, count });
    }

    const revSortedC = Object.entries(customerRevenue).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topValueCustomers = [];
    for (const [id, rev] of revSortedC) {
      const c = await Customer.findById(id);
      if (c) topValueCustomers.push({ label: c.name, revenue: rev });
    }

    // Loyalty Segmentation
    let segment1x = 0;
    let segment2x = 0;
    let segment3plus = 0;
    for (const count of Object.values(customerCounts)) {
      if (count === 1) segment1x++;
      else if (count === 2) segment2x++;
      else if (count >= 3) segment3plus++;
    }
    const customerLoyalty = [
      { label: 'Sewa 1x', count: segment1x },
      { label: 'Sewa 2x', count: segment2x },
      { label: 'Sewa 3x+', count: segment3plus },
    ];

    // Deposit Status
    let depositPaid = 0;
    let depositUnpaid = 0;
    for (const r of rentals) {
      if (['Active', 'Booked'].includes(r.status)) {
        if (r.depositPaid) depositPaid++;
        else depositUnpaid++;
      }
    }
    const depositStatus = [
      { label: 'Deposit Lunas', count: depositPaid },
      { label: 'Belum Lunas/Belum DP', count: depositUnpaid }
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEvents = await Event.find({ date: { $gte: today } }).sort({ date: 1 }).limit(5);

    const revenuePerMonth = new Array(12).fill(0);
    for (const r of rentals) {
        if (r.payments) {
            for (const p of r.payments) {
                const month = new Date(p.date).getMonth();
                revenuePerMonth[month] += p.amount;
            }
        }
    }

    const kebayaPopularity = topRooms.map(t => ({ label: `${t.roomType.name}`, count: t.count }));

    const rentalsPerMonth = new Array(12).fill(0);
    for (const r of rentals) {
      const month = new Date(r.rentalStartTime).getMonth();
      rentalsPerMonth[month]++;
    }

    const customerIssues: Record<string, number> = {};
    for (const r of rentals) {
      for (const cId of r.customerIds || []) {
          const idStr = cId.toString();
          if (!customerIssues[idStr]) customerIssues[idStr] = 0;
          if (r.status === 'Cancelled') customerIssues[idStr] += 1;
      }
    }
    const sortedIssues = Object.entries(customerIssues).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const problematicCustomers = [];
    for (const [id, score] of sortedIssues) {
      const c = await Customer.findById(id);
      if (c) problematicCustomers.push({ label: c.name, count: Math.floor(score) });
    }

    res.json({
      topRooms,
      topCustomers,
      upcomingEvents,
      charts: {
        revenuePerMonth,
        kebayaPopularity,
        rentalsPerMonth,
        topValueCustomers,
        customerLoyalty,
        depositStatus,
        problematicCustomers
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/due', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 2);

    const dueRentals = await RentalTransaction.find({ 
      status: 'Active',
      $or: [
        { rentalType: 'One-Time', expectedReturnDate: { $lt: tomorrow } },
        { rentalType: 'Long-Stay', paidUntil: { $lt: tomorrow } }
      ]
    }).populate('customerIds').populate({ path: 'roomId', populate: { path: 'roomTypeId' } });

    res.json(dueRentals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
