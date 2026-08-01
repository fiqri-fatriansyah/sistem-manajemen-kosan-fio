"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const RentalTransaction_1 = __importDefault(require("../models/RentalTransaction"));
const Room_1 = __importDefault(require("../models/Room"));
const Customer_1 = __importDefault(require("../models/Customer"));
const Event_1 = __importDefault(require("../models/Event"));
const router = (0, express_1.Router)();
router.get('/stats', async (req, res) => {
    try {
        const rentals = await RentalTransaction_1.default.find().populate('roomId');
        // Top 5 rented room
        const kebayaCounts = {};
        for (const r of rentals) {
            if (r.roomId) {
                const kId = r.roomId._id.toString();
                kebayaCounts[kId] = (kebayaCounts[kId] || 0) + 1;
            }
        }
        const popSortedK = Object.entries(kebayaCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topRooms = [];
        for (const [id, count] of popSortedK) {
            const k = await Room_1.default.findById(id);
            if (k)
                topRooms.push({ room: k, count });
        }
        // Top 5 active customers (by volume)
        const customerCounts = {};
        const customerRevenue = {};
        for (const r of rentals) {
            const cId = r.customerId;
            customerCounts[cId] = (customerCounts[cId] || 0) + 1;
            if (r.status === 'Completed' || r.status === 'Active') {
                customerRevenue[cId] = (customerRevenue[cId] || 0) + (r.amountToPay || r.depositAmount || 0);
            }
        }
        // Process top customers by volume
        const popSortedC = Object.entries(customerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topCustomers = [];
        for (const [id, count] of popSortedC) {
            const c = await Customer_1.default.findById(id);
            if (c)
                topCustomers.push({ customer: c, count });
        }
        // Process top customers by revenue (High Value)
        const revSortedC = Object.entries(customerRevenue).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topValueCustomers = [];
        for (const [id, rev] of revSortedC) {
            const c = await Customer_1.default.findById(id);
            if (c)
                topValueCustomers.push({ label: c.name, revenue: rev });
        }
        // Loyalty Segmentation
        let segment1x = 0;
        let segment2x = 0;
        let segment3plus = 0;
        for (const count of Object.values(customerCounts)) {
            if (count === 1)
                segment1x++;
            else if (count === 2)
                segment2x++;
            else if (count >= 3)
                segment3plus++;
        }
        const customerLoyalty = [
            { label: 'Sewa 1x', count: segment1x },
            { label: 'Sewa 2x', count: segment2x },
            { label: 'Sewa 3x+', count: segment3plus },
        ];
        // Deposit Status Segmentation for Active/Booked/Ready
        let depositPaid = 0;
        let depositUnpaid = 0;
        for (const r of rentals) {
            if (['Active', 'Booked', 'Ready'].includes(r.status)) {
                if (r.depositPaid)
                    depositPaid++;
                else
                    depositUnpaid++;
            }
        }
        const depositStatus = [
            { label: 'Deposit Lunas', count: depositPaid },
            { label: 'Belum Lunas/Belum DP', count: depositUnpaid }
        ];
        // Upcoming events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingEvents = await Event_1.default.find({ date: { $gte: today } }).sort({ date: 1 }).limit(5);
        // TIME SERIES DATA (For Charts)
        const revenuePerMonth = new Array(12).fill(0);
        const completedRentals = rentals.filter(r => r.status === 'Completed' && r.rentalEndTime);
        for (const r of completedRentals) {
            const month = new Date(r.rentalEndTime).getMonth();
            revenuePerMonth[month] += r.amountToPay || 0;
        }
        const kebayaPopularity = topRooms.map(t => ({ label: `${t.room.tipeKamar} (${t.room.fasilitas})`, count: t.count }));
        const rentalsPerMonth = new Array(12).fill(0);
        for (const r of rentals) {
            const month = new Date(r.rentalStartTime).getMonth();
            rentalsPerMonth[month]++;
        }
        // Problematic Customers
        const customerIssues = {};
        for (const r of rentals) {
            const cId = r.customerId;
            if (!customerIssues[cId])
                customerIssues[cId] = 0;
            if (r.status === 'Cancelled')
                customerIssues[cId] += 1;
            if (r.penaltyAmount && r.penaltyAmount > 0)
                customerIssues[cId] += (r.penaltyAmount / 10000); // 1 point per 10k penalty
        }
        const sortedIssues = Object.entries(customerIssues).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const problematicCustomers = [];
        for (const [id, score] of sortedIssues) {
            const c = await Customer_1.default.findById(id);
            if (c)
                problematicCustomers.push({ label: c.name, count: Math.floor(score) });
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
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Endpoint to get late and soon-to-be-due rentals
router.get('/due', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 2); // Up to end of tomorrow
        const dueRentals = await RentalTransaction_1.default.find({
            status: 'Active',
            expectedReturnDate: { $lt: tomorrow }
        }).populate('customerId roomId').sort({ expectedReturnDate: 1 });
        res.json(dueRentals);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map