"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const Room_1 = __importDefault(require("../models/Room"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const router = (0, express_1.Router)();
// Multer storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => cb(null, path_1.default.join(__dirname, '../../public/uploads')),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = (0, multer_1.default)({ storage });
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file)
            data.imageUrl = '/uploads/' + req.file.filename;
        const room = new Room_1.default(data);
        await room.save();
        await AuditLog_1.default.create({
            action: 'CREATE',
            entity: 'Room',
            details: `Added new room: ${room.tipeKamar} (${room.fasilitas})`
        });
        res.status(201).json(room);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.get('/', async (req, res) => {
    try {
        const rooms = await Room_1.default.find();
        res.json(rooms);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file)
            data.imageUrl = '/uploads/' + req.file.filename;
        const room = await Room_1.default.findByIdAndUpdate(req.params.id, data, { new: true });
        if (!room)
            return res.status(404).json({ error: 'Room not found' });
        await AuditLog_1.default.create({
            action: 'UPDATE',
            entity: 'Room',
            details: `Updated room: ${room.tipeKamar} (${room.fasilitas})`
        });
        res.json(room);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const room = await Room_1.default.findByIdAndDelete(req.params.id);
        if (!room)
            return res.status(404).json({ error: 'Room not found' });
        await AuditLog_1.default.create({
            action: 'DELETE',
            entity: 'Room',
            details: `Deleted room: ${room.tipeKamar} (${room.fasilitas})`
        });
        res.json({ message: 'Room deleted' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Transfer Stock
router.post('/:id/transfer-stock', async (req, res) => {
    try {
        const { from, to, amount } = req.body;
        const qty = parseInt(amount, 10);
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        const room = await Room_1.default.findById(req.params.id);
        if (!room)
            return res.status(404).json({ error: 'Room not found' });
        // Validate from stock
        if (from === 'available' && room.availableStock < qty)
            return res.status(400).json({ error: 'Not enough available stock' });
        if (from === 'laundry' && room.cleaningStock < qty)
            return res.status(400).json({ error: 'Not enough laundry stock' });
        if (from === 'maintenance' && room.maintenanceStock < qty)
            return res.status(400).json({ error: 'Not enough maintenance stock' });
        // Subtract from source
        if (from === 'available')
            room.availableStock -= qty;
        if (from === 'laundry')
            room.cleaningStock -= qty;
        if (from === 'maintenance')
            room.maintenanceStock -= qty;
        // Add to destination
        if (to === 'available')
            room.availableStock += qty;
        if (to === 'laundry')
            room.cleaningStock += qty;
        if (to === 'maintenance')
            room.maintenanceStock += qty;
        await room.save();
        await AuditLog_1.default.create({
            action: 'UPDATE',
            entity: 'Room',
            details: `Transferred ${qty} stock from ${from} to ${to} for room ${room.tipeKamar} (${room.fasilitas})`
        });
        res.json(room);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=room.js.map