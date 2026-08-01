import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import Room from '../models/Room';
import AuditLog from '../models/AuditLog';

const router = Router();

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../public/uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    if (req.file) data.imageUrl = '/uploads/' + req.file.filename;
    
    const room = new Room(data);
    await room.save();

    await AuditLog.create({
      action: 'CREATE',
      entity: 'Room',
      details: `Added new room: ${room.tipeKamar} (${room.fasilitas})`
    });

    res.status(201).json(room);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    if (req.file) data.imageUrl = '/uploads/' + req.file.filename;

    const room = await Room.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    await AuditLog.create({
      action: 'UPDATE',
      entity: 'Room',
      details: `Updated room: ${room.tipeKamar} (${room.fasilitas})`
    });

    res.json(room);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    await AuditLog.create({
      action: 'DELETE',
      entity: 'Room',
      details: `Deleted room: ${room.tipeKamar} (${room.fasilitas})`
    });
    res.json({ message: 'Room deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Transfer Stock
router.post('/:id/transfer-stock', async (req: Request, res: Response) => {
  try {
    const { from, to, amount } = req.body;
    const qty = parseInt(amount, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Validate from stock
    if (from === 'available' && room.availableStock < qty) return res.status(400).json({ error: 'Not enough available stock' });
    if (from === 'laundry' && room.cleaningStock < qty) return res.status(400).json({ error: 'Not enough laundry stock' });
    if (from === 'maintenance' && room.maintenanceStock < qty) return res.status(400).json({ error: 'Not enough maintenance stock' });

    // Subtract from source
    if (from === 'available') room.availableStock -= qty;
    if (from === 'laundry') room.cleaningStock -= qty;
    if (from === 'maintenance') room.maintenanceStock -= qty;

    // Add to destination
    if (to === 'available') room.availableStock += qty;
    if (to === 'laundry') room.cleaningStock += qty;
    if (to === 'maintenance') room.maintenanceStock += qty;

    await room.save();

    await AuditLog.create({
      action: 'UPDATE',
      entity: 'Room',
      details: `Transferred ${qty} stock from ${from} to ${to} for room ${room.tipeKamar} (${room.fasilitas})`
    });

    res.json(room);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
