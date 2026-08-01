import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import RoomType from '../models/RoomType';
import Room from '../models/Room';
import FeatureTag from '../models/FeatureTag';
import AuditLog from '../models/AuditLog';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../public/uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ================= FEATURE TAGS =================
router.get('/features', async (req: Request, res: Response) => {
  try {
    const features = await FeatureTag.find().sort({ name: 1 });
    res.json(features);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/features', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    let feature = await FeatureTag.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (!feature) {
      feature = new FeatureTag({ name });
      await feature.save();
    }
    res.status(201).json(feature);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/features/:id', async (req: Request, res: Response) => {
  try {
    await FeatureTag.findByIdAndDelete(req.params.id);
    res.json({ message: 'Feature tag deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ================= ROOM TYPES =================
router.get('/types', async (req: Request, res: Response) => {
  try {
    const types = await RoomType.find();
    res.json(types);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/types', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    if (typeof data.features === 'string') data.features = JSON.parse(data.features);
    if (req.file) data.imageUrl = '/uploads/' + req.file.filename;

    const rt = new RoomType(data);
    await rt.save();
    await AuditLog.create({ action: 'CREATE', entity: 'RoomType', details: `Added RoomType: ${rt.name}` });
    res.status(201).json(rt);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/types/:id', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    if (typeof data.features === 'string') data.features = JSON.parse(data.features);
    if (req.file) data.imageUrl = '/uploads/' + req.file.filename;

    const rt = await RoomType.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!rt) return res.status(404).json({ error: 'Room Type not found' });
    await AuditLog.create({ action: 'UPDATE', entity: 'RoomType', details: `Updated RoomType: ${rt.name}` });
    res.json(rt);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/types/:id', async (req: Request, res: Response) => {
  try {
    const rt = await RoomType.findByIdAndDelete(req.params.id);
    if (!rt) return res.status(404).json({ error: 'Room Type not found' });
    await AuditLog.create({ action: 'DELETE', entity: 'RoomType', details: `Deleted RoomType: ${rt.name}` });
    res.json({ message: 'Room Type deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

import RentalTransaction from '../models/RentalTransaction';
import { calculateRentalFinancials } from './rentals';
import Config from '../models/Config';

// ================= INDIVIDUAL ROOMS =================
router.get('/', async (req: Request, res: Response) => {
  try {
    let config = await Config.findOne();
    const gracePeriodDays = config?.overdueGracePeriodDays !== undefined ? config.overdueGracePeriodDays : 3;
    const now = new Date();

    const rooms = await Room.find().populate('roomTypeId');
    const activeRentals = await RentalTransaction.find({ status: { $in: ['Active', 'Booked', 'Perlu Pengusiran'] } }).populate({ path: 'roomId', populate: { path: 'roomTypeId' } });
    
    // Compute live status for today
    const computedRooms = rooms.map(roomDoc => {
      const room = roomDoc.toObject();
      const activeRental = activeRentals.find(r => {
        if (r.roomId && (r.roomId as any)._id.toString() !== room._id.toString()) return false;
        
        const exStart = new Date(r.rentalStartTime);
        const exEnd = r.expectedReturnDate ? new Date(r.expectedReturnDate) : new Date('2099-12-31T23:59:59Z');
        
        // Check if 'now' falls within the rental period
        return now >= exStart && now <= exEnd;
      });

      if (activeRental) {
        const calc = calculateRentalFinancials(activeRental);
        // Overdue evictions bypass live occupancy
        if (calc.currentStatusText === 'Tunggakan' || calc.currentStatusText === 'Overstay' || calc.currentStatusText === 'Tunggakan DP') {
          let overdueDate = new Date();
          if (activeRental.rentalType === 'Long-Stay') {
             overdueDate = new Date(calc.paidUntil || activeRental.rentalStartTime);
          } else {
             overdueDate = new Date(activeRental.expectedReturnDate || activeRental.rentalStartTime);
          }
          const diffTime = now.getTime() - overdueDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
          
          if (diffTime > 0 && diffDays >= gracePeriodDays) {
             room.status = 'Available';
          } else {
             room.status = calc.uiStatus;
          }
        } else {
          room.status = calc.uiStatus;
        }
      } else {
        room.status = 'Available';
      }
      return room;
    });

    res.json(computedRooms);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    if (typeof data.features === 'string') data.features = JSON.parse(data.features);
    if (req.file) data.imageUrl = '/uploads/' + req.file.filename;
    
    if (data.priceMonthly === '') delete data.priceMonthly;
    if (data.priceDaily === '') delete data.priceDaily;

    const room = new Room(data);
    await room.save();
    await room.populate('roomTypeId');
    await AuditLog.create({ action: 'CREATE', entity: 'Room', details: `Added Room: ${room.roomNumber}` });
    res.status(201).json(room);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Gagal menambah Room. Nomor/ID Room tersebut sudah terdaftar di sistem. Harap gunakan Nomor/ID yang berbeda.' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    if (typeof data.features === 'string') data.features = JSON.parse(data.features);
    if (req.file) data.imageUrl = '/uploads/' + req.file.filename;
    
    if (data.priceMonthly === '') data.priceMonthly = undefined;
    if (data.priceDaily === '') data.priceDaily = undefined;

    // Use $set and $unset to clear fields if empty
    const updateData: any = { $set: { ...data } };
    const unsetData: any = {};
    if (data.priceMonthly === undefined) {
      unsetData.priceMonthly = 1;
      delete updateData.$set.priceMonthly;
    }
    if (data.priceDaily === undefined) {
      unsetData.priceDaily = 1;
      delete updateData.$set.priceDaily;
    }
    if (Object.keys(unsetData).length > 0) updateData.$unset = unsetData;

    const room = await Room.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('roomTypeId');
    if (!room) return res.status(404).json({ error: 'Room not found' });
    await AuditLog.create({ action: 'UPDATE', entity: 'Room', details: `Updated Room: ${room.roomNumber}` });
    res.json(room);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Gagal mengubah Room. Nomor/ID Room tersebut sudah digunakan oleh room lain. Harap gunakan Nomor/ID yang berbeda.' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    await AuditLog.create({ action: 'DELETE', entity: 'Room', details: `Deleted Room: ${room.roomNumber}` });
    res.json({ message: 'Room deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Status (Available, Cleaning, Maintenance)
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['Available', 'Occupied', 'Cleaning', 'Maintenance'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const room = await Room.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('roomTypeId');
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    await AuditLog.create({ action: 'UPDATE', entity: 'Room', details: `Changed status of Room ${room.roomNumber} to ${status}` });
    res.json(room);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
