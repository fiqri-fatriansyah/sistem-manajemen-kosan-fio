import { Router, Request, Response } from 'express';
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
    const { penaltyType, penaltyCost, enableWhatsAppBot, waLinkType, waKwitansiType } = req.body;
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

    config.penaltyType = penaltyType;
    config.penaltyCost = penaltyCost;
    config.enableWhatsAppBot = enableWhatsAppBot;
    if (waLinkType) config.waLinkType = waLinkType;
    if (waKwitansiType) config.waKwitansiType = waKwitansiType;
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
    await mongoose.connection.collection('customers').deleteMany({});
    await mongoose.connection.collection('rentaltransactions').deleteMany({});
    
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
