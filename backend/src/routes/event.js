"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Event_1 = __importDefault(require("../models/Event"));
const router = (0, express_1.Router)();
router.post('/', async (req, res) => {
    try {
        const event = new Event_1.default(req.body);
        await event.save();
        res.status(201).json(event);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.get('/', async (req, res) => {
    try {
        const events = await Event_1.default.find().lean();
        const targetYear = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
        const expanded = [];
        events.forEach(e => {
            const originalDate = new Date(e.date);
            if (e.recurring === 'none') {
                if (originalDate.getFullYear() === targetYear) {
                    expanded.push({ ...e, originalDate });
                }
            }
            else if (e.recurring === 'yearly') {
                const occ = new Date(originalDate);
                occ.setFullYear(targetYear);
                expanded.push({ ...e, date: occ, originalDate });
            }
            else if (e.recurring === 'monthly') {
                for (let m = 0; m < 12; m++) {
                    const occ = new Date(originalDate);
                    occ.setFullYear(targetYear);
                    occ.setMonth(m);
                    if (occ.getMonth() === m) {
                        expanded.push({ ...e, date: occ, originalDate });
                    }
                }
            }
            else if (e.recurring === 'weekly') {
                let current = new Date(originalDate);
                if (current.getFullYear() < targetYear) {
                    while (current.getFullYear() < targetYear)
                        current.setDate(current.getDate() + 7);
                }
                else if (current.getFullYear() > targetYear) {
                    while (current.getFullYear() > targetYear)
                        current.setDate(current.getDate() - 7);
                }
                while (current.getFullYear() < targetYear)
                    current.setDate(current.getDate() + 7);
                while (current.getFullYear() > targetYear)
                    current.setDate(current.getDate() - 7);
                // Correct approach to align:
                const startDay = originalDate.getDay();
                let loopDate = new Date(targetYear, 0, 1);
                while (loopDate.getDay() !== startDay) {
                    loopDate.setDate(loopDate.getDate() + 1);
                }
                // Now loopDate is the first matching day of the week in targetYear
                // But it must be >= originalDate
                while (loopDate < originalDate) {
                    loopDate.setDate(loopDate.getDate() + 7);
                }
                while (loopDate.getFullYear() === targetYear) {
                    expanded.push({ ...e, date: new Date(loopDate), originalDate });
                    loopDate.setDate(loopDate.getDate() + 7);
                }
            }
        });
        expanded.sort((a, b) => a.date.getTime() - b.date.getTime());
        res.json(expanded);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        await Event_1.default.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=event.js.map