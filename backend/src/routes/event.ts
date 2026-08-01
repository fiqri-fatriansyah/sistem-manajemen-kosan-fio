import { Router, Request, Response } from 'express';
import Event from '../models/Event';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const events = await Event.find().lean();
    const targetYear = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    
    const expanded: any[] = [];
    
    events.forEach(e => {
      const originalDate = new Date(e.date);
      
      if (e.recurring === 'none') {
        if (originalDate.getFullYear() === targetYear) {
          expanded.push({ ...e, originalDate });
        }
      } else if (e.recurring === 'yearly') {
        const occ = new Date(originalDate);
        occ.setFullYear(targetYear);
        expanded.push({ ...e, date: occ, originalDate });
      } else if (e.recurring === 'monthly') {
        for (let m = 0; m < 12; m++) {
          const occ = new Date(originalDate);
          occ.setFullYear(targetYear);
          occ.setMonth(m);
          if (occ.getMonth() === m) {
            expanded.push({ ...e, date: occ, originalDate });
          }
        }
      } else if (e.recurring === 'weekly') {
        let current = new Date(originalDate);
        
        if (current.getFullYear() < targetYear) {
          while (current.getFullYear() < targetYear) current.setDate(current.getDate() + 7);
        } else if (current.getFullYear() > targetYear) {
          while (current.getFullYear() > targetYear) current.setDate(current.getDate() - 7);
        }
        
        while (current.getFullYear() < targetYear) current.setDate(current.getDate() + 7);
        while (current.getFullYear() > targetYear) current.setDate(current.getDate() - 7);
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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
