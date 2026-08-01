import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import Config from '../models/Config';
import AuditLog from '../models/AuditLog';
import { connectDB, baseMongoURI, demoMongoURI } from '../index';
import { getDemoState, setDemoState } from '../utils/demoState';
import { generateAdvancedSeed } from '../utils/demoSeeder';
import mongoose from 'mongoose';
import Customer from '../models/Customer';
import Room from '../models/Room';
import RentalTransaction from '../models/RentalTransaction';
import Event from '../models/Event';
import { fetchPublicHolidays } from '../cron';
import { initWhatsApp, destroyWhatsApp, getWhatsAppStatus } from '../whatsapp';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../public/uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-config-' + file.originalname)
});
const upload = multer({ storage });

router.post('/upload-image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { type } = req.body; // 'logo' or 'favicon'
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    
    let config = await Config.findOne();
    if (!config) config = new Config();
    
    const imageUrl = '/uploads/' + req.file.filename;
    if (type === 'logo') {
      config.appLogoUrl = imageUrl;
    } else if (type === 'favicon') {
      config.appFaviconUrl = imageUrl;
    }
    
    await config.save();
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  let config = await Config.findOne();
  if (!config) {
    config = new Config();
    await config.save();
  }
  res.json(config);
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { penaltyType, penaltyCost, enableWhatsAppBot, waLinkType, waKwitansiType, appName, appDescription, baseFontSize, overdueGracePeriodDays, msgTemplateBooked, msgTemplateOverdue, msgTemplateOverstay, msgTemplateReminder, msgTemplateEviction, msgTemplateCheckIn } = req.body;
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
    }
    
    // Check if toggle changed
    if (enableWhatsAppBot && !config.enableWhatsAppBot) {
      initWhatsApp();
    } else if (!enableWhatsAppBot && config.enableWhatsAppBot) {
      await destroyWhatsApp();
    }

    config.penaltyType = penaltyType || config.penaltyType;
    if (penaltyCost !== undefined) config.penaltyCost = penaltyCost;
    if (enableWhatsAppBot !== undefined) config.enableWhatsAppBot = enableWhatsAppBot;
    if (waLinkType) config.waLinkType = waLinkType;
    if (waKwitansiType) config.waKwitansiType = waKwitansiType;
    if (appName !== undefined) config.appName = appName;
    if (appDescription !== undefined) config.appDescription = appDescription;
    if (baseFontSize !== undefined) config.baseFontSize = baseFontSize;
    if (overdueGracePeriodDays !== undefined) config.overdueGracePeriodDays = overdueGracePeriodDays;
    if (msgTemplateBooked !== undefined) config.msgTemplateBooked = msgTemplateBooked;
    if (msgTemplateOverdue !== undefined) config.msgTemplateOverdue = msgTemplateOverdue;
    if (msgTemplateOverstay !== undefined) config.msgTemplateOverstay = msgTemplateOverstay;
    if (msgTemplateReminder !== undefined) config.msgTemplateReminder = msgTemplateReminder;
    if (msgTemplateEviction !== undefined) config.msgTemplateEviction = msgTemplateEviction;
    if (msgTemplateCheckIn !== undefined) config.msgTemplateCheckIn = msgTemplateCheckIn;

    await config.save();

    await AuditLog.create({
      action: 'UPDATE',
      entity: 'Config',
      details: `Global penalties updated to ${config.penaltyType} (Rp ${config.penaltyCost})`
    });

    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET WhatsApp Status
router.get('/whatsapp-status', async (req: Request, res: Response) => {
  res.json(getWhatsAppStatus());
});

router.post('/wipe', async (req: Request, res: Response) => {
  try {
    const { pin, wipeAudit } = req.body;
    const resetPin = process.env.RESET_PIN;
    
    if (!pin || pin !== resetPin) {
      return res.status(401).json({ error: 'Master PIN salah atau belum dikonfigurasi' });
    }

    if (getDemoState()) {
      return res.status(403).json({ error: 'Factory Reset tidak dapat dilakukan saat Mode Contoh (Demo) sedang aktif. Matikan Mode Contoh terlebih dahulu.' });
    }

    await mongoose.connection.collection('rooms').deleteMany({});
    await mongoose.connection.collection('roomtypes').deleteMany({});
    await mongoose.connection.collection('customers').deleteMany({});
    await mongoose.connection.collection('rentaltransactions').deleteMany({});
    await mongoose.connection.collection('featuretags').deleteMany({});
    
    if (wipeAudit) {
      await mongoose.connection.collection('auditlogs').deleteMany({});
    } else {
      await AuditLog.create({
        action: 'DELETE',
        entity: 'System',
        details: 'Factory Reset dilakukan (Semua data dihapus kecuali Audit)'
      });
    }

    res.json({ message: 'Semua data telah dihapus.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/demo-status', (req: Request, res: Response) => {
  res.json({ isDemoMode: getDemoState() });
});

router.post('/toggle-demo', async (req: Request, res: Response) => {
  try {
    const { pin } = req.body;
    const resetPin = process.env.RESET_PIN;
    
    if (!resetPin || pin !== resetPin) {
      return res.status(401).json({ error: 'Reset PIN salah atau belum dikonfigurasi' });
    }

    const currentIsDemo = getDemoState();
    const newIsDemo = !currentIsDemo;
    
    if (!newIsDemo) {
      // Currently in DEMO. Drop the demo DB entirely to clean up space before switching to real
      await mongoose.connection.db?.dropDatabase();
    }

    setDemoState(newIsDemo);
    await connectDB();

    if (newIsDemo) {
      // Switched to DEMO. Generate the advanced mock data.
      await generateAdvancedSeed();
    }

    res.json({ success: true, isDemoMode: newIsDemo });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
