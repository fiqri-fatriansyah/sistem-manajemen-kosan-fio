import { Router, Request, Response } from 'express';
import RentalTransaction from '../models/RentalTransaction';
import Room from '../models/Room';
import RoomType from '../models/RoomType';
import Customer from '../models/Customer';
import Event from '../models/Event';
import { calculateRentalFinancials } from './rentals';
import Expense from '../models/Expense';
import { generateRecurringExpenses } from '../services/expenseGenerator';

const router = Router();

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { filterType = 'current', month, year } = req.query;
    let targetMonth = new Date().getMonth();
    let targetYear = new Date().getFullYear();
    const filterMonth = parseInt(month as string, 10);
    const filterYear = parseInt(year as string, 10);
    if (filterType === 'historical' && !isNaN(filterMonth) && !isNaN(filterYear)) {
      targetMonth = filterMonth;
      targetYear = filterYear;
    }

    await generateRecurringExpenses();
    const allRentals = await RentalTransaction.find().populate({ path: 'roomId', populate: { path: 'roomTypeId' } });
    
    // Create a filtered rentals array for the selected month/year
    const targetStart = new Date(targetYear, targetMonth, 1);
    const targetEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    
    const filteredRentals = filterType === 'all' ? allRentals : allRentals.filter(r => {
      const start = new Date(r.rentalStartTime);
      let end = new Date();
      if (r.status === 'Completed' && r.rentalEndTime) {
        end = new Date(r.rentalEndTime);
      } else if (r.status === 'Cancelled' && r.rentalEndTime) {
        end = new Date(r.rentalEndTime);
      } else if (r.paidUntil && new Date(r.paidUntil) > end) {
        end = new Date(r.paidUntil);
      }
      return start <= targetEnd && end >= targetStart;
    });

    const roomTypeCounts: Record<string, number> = {};
    for (const r of filteredRentals) {
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

    const customerCounts: Record<string, number> = {};
    const customerRevenue: Record<string, number> = {};
    for (const r of filteredRentals) {
      const cIds = r.customerIds || [];
      const start = new Date(r.rentalStartTime).getTime();
      let end = new Date().getTime();
      if (r.status === 'Completed' && r.rentalEndTime) {
        end = new Date(r.rentalEndTime).getTime();
      } else if (r.status === 'Cancelled' && r.rentalEndTime) {
        end = new Date(r.rentalEndTime).getTime();
      } else if (r.paidUntil && new Date(r.paidUntil).getTime() > end) {
        end = new Date(r.paidUntil).getTime();
      }
      const months = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30)));

      for (const cId of cIds) {
          const idStr = cId.toString();
          customerCounts[idStr] = (customerCounts[idStr] || 0) + months;
          
          if (r.status === 'Completed' || r.status === 'Active') {
            const paymentsTotal = r.payments ? r.payments.reduce((a, b) => a + b.amount, 0) : 0;
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

    const segmentCounts: Record<number, number> = {};
    for (const count of Object.values(customerCounts)) {
      segmentCounts[count] = (segmentCounts[count] || 0) + 1;
    }
    const sortedSegments = Object.entries(segmentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const customerLoyalty = sortedSegments.map(([months, customers]) => ({
      label: `Sewa ${months} Bulan`,
      count: customers
    }));

    let depositPaid = 0; let depositUnpaid = 0;
    for (const r of filteredRentals) {
      if (['Active', 'Booked'].includes(r.status)) {
        if (r.depositPaid) depositPaid++;
        else depositUnpaid++;
      }
    }
    const depositStatus = [
      { label: 'Deposit Lunas', count: depositPaid },
      { label: 'Belum Lunas/Belum DP', count: depositUnpaid }
    ];

    const upcomingEvents = await Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(5);
    
    let totalPendapatan = 0;
    let totalPendapatanBulanIni = 0; 
    
    const revenuePerMonth = new Array(12).fill(0);
    // Use ALL rentals for 12-month graph, but restrict to targetYear
    for (const r of allRentals) {
        if (r.payments) {
            for (const p of r.payments) {
                const d = new Date(p.date);
                const pMonth = d.getMonth();
                const pYear = d.getFullYear();
                
                if (pYear === targetYear) {
                  revenuePerMonth[pMonth] += p.amount;
                }
                totalPendapatan += p.amount;
                
                if (filterType === 'all') {
                  totalPendapatanBulanIni += p.amount;
                } else if (pMonth === targetMonth && pYear === targetYear) {
                  totalPendapatanBulanIni += p.amount;
                }
            }
        }
    }

    const expenses = await Expense.find();
    for (const e of expenses) {
      const d = new Date(e.date);
      const eMonth = d.getMonth();
      const eYear = d.getFullYear();
      
      if (eYear === targetYear) {
        revenuePerMonth[eMonth] -= e.amount;
      }
      totalPendapatan -= e.amount;
      if (filterType === 'all') {
        totalPendapatanBulanIni -= e.amount;
      } else if (eMonth === targetMonth && eYear === targetYear) {
        totalPendapatanBulanIni -= e.amount;
      }
    }

    const kebayaPopularity = topRooms.map(t => ({ label: `${t.roomType.name}`, count: t.count }));

    const rentalsPerMonth = new Array(12).fill(0);
    for (const r of allRentals) {
      const d = new Date(r.rentalStartTime);
      if (d.getFullYear() === targetYear) {
        rentalsPerMonth[d.getMonth()]++;
      }
    }

    const computedRentals = filteredRentals.map(calculateRentalFinancials);
    let totalTunggakan = 0;
    const customerIssues: Record<string, number> = {};
    
    for (const r of computedRentals) {
      totalTunggakan += r.tunggakanAmount || 0;
      for (const cId of r.customerIds || []) {
          const idStr = cId.toString();
          if (!customerIssues[idStr]) customerIssues[idStr] = 0;
          if (r.status === 'Cancelled') customerIssues[idStr] += 0; // We don't add days for simply cancelled anymore unless we want to track it
          if (r.tunggakanAmount && r.tunggakanAmount > 0) {
            let daysOverdue = 0;
            const targetDate = r.paidUntil || r.expectedReturnDate;
            if (targetDate && new Date(targetDate) < new Date()) {
              daysOverdue = Math.floor((new Date().getTime() - new Date(targetDate).getTime()) / (1000 * 3600 * 24));
            }
            customerIssues[idStr] += daysOverdue;
          }
      }
    }
    const sortedIssues = Object.entries(customerIssues).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
    const problematicCustomers = [];
    for (const [id, score] of sortedIssues.slice(0, 5)) {
      const c = await Customer.findById(id);
      if (c) problematicCustomers.push({ label: c.name, count: Math.floor(score) });
    }
    const jumlahPenghuniBermasalah = sortedIssues.length;

    const rooms = await Room.find({ status: { $ne: 'Maintenance' }});
    const totalRooms = rooms.length;
    // Occupancy based on targetEnd
    const occupancyDate = filterType === 'all' ? new Date() : targetEnd;
    const activeRentals = computedRentals.filter(r => 
      ['Active', 'Booked'].includes(r.uiStatus) && 
      (new Date(r.rentalStartTime) <= occupancyDate) &&
      (!r.expectedReturnDate || new Date(r.expectedReturnDate) >= occupancyDate)
    );
    const occupiedRoomsCount = new Set(activeRentals.map(r => r.roomId ? (r.roomId as any)._id.toString() : '')).size;
    const tingkatHunian = totalRooms > 0 ? Math.round((occupiedRoomsCount / totalRooms) * 100) : 0;
    const kamarKosong = Math.max(0, totalRooms - occupiedRoomsCount);

    res.json({
      metrics: { totalPendapatan, totalPendapatanBulanIni, tingkatHunian, kamarKosong, totalTunggakan, jumlahPenghuniBermasalah },
      topRooms, topCustomers, upcomingEvents,
      charts: { revenuePerMonth, kebayaPopularity, rentalsPerMonth, topValueCustomers, customerLoyalty, depositStatus, problematicCustomers }
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
