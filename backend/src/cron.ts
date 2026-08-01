import cron from 'node-cron';
import nodemailer from 'nodemailer';
import RentalTransaction from './models/RentalTransaction';
import Room from './models/Room';
import Customer from './models/Customer';
import Event from './models/Event';
import Config from './models/Config';
import { sendWhatsAppMessage, getWhatsAppStatus } from './whatsapp';

// Setup Ethereal Testing Email
let transporter: nodemailer.Transporter;

nodemailer.createTestAccount((err, account) => {
  if (err) {
    console.error('Failed to create a testing account. ' + err.message);
    return;
  }
  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass
    }
  });
  console.log(`[Cron] Ethereal Email Ready. User: ${account.user}`);
});

export const startCronJobs = () => {
  // Run every day at 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Running daily late rental check...');
    try {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const lateRentals = await RentalTransaction.find({
        status: 'Active',
        expectedReturnDate: { $lt: today }
      }).populate('customerIds roomId');

      const rentalsDueTomorrow = await RentalTransaction.find({
        status: 'Active',
        expectedReturnDate: { $gte: new Date(tomorrow.setHours(0,0,0,0)), $lt: new Date(tomorrow.setHours(23,59,59,999)) }
      }).populate('customerIds roomId');

      if (lateRentals.length === 0 && rentalsDueTomorrow.length === 0) {
        console.log('[Cron] No late or upcoming rentals found today.');
        return;
      }

      let emailText = `Warning! There are ${lateRentals.length} late room rentals today:\n\n`;
      lateRentals.forEach(r => {
        const c = r.customerIds as any[];
        const k = r.roomId as any;
        const customerNames = c ? c.map(user => user.name).join(', ') : 'Unknown';
        emailText += `- Customers: ${customerNames}\n  Room: ${k?.tipeKamar} (${k?.fasilitas})\n  Expected Return: ${new Date(r.expectedReturnDate).toLocaleDateString()}\n\n`;
      });

      const info = await transporter.sendMail({
        from: '"Sistem Kosan Fio" <system@kebayalinda.local>',
        to: 'owner@kebayalinda.local',
        subject: '⚠️ Daily Report: Late Room Rentals',
        text: emailText
      });

      console.log('[Cron] Email sent successfully! Preview URL: %s', nodemailer.getTestMessageUrl(info));

      const config = await Config.findOne();
      if (config?.enableWhatsAppBot && getWhatsAppStatus().isReady) {
        for (const rental of rentalsDueTomorrow) {
          const customers = rental.customerIds as any[];
          if (customers && customers.length > 0) {
            for (const c of customers) {
              if (c && c.telephone) {
                const msg = `Halo Kak ${c.name}, mengingatkan bahwa penyewaan room Anda jatuh tempo besok (${tomorrow.toLocaleDateString('id-ID', {day:'numeric', month:'long'})}). Mohon dikembalikan tepat waktu ya! Terima kasih, Kosan Fio.`;
                await sendWhatsAppMessage(c.telephone, msg);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('[Cron] Error running daily check:', err);
    }
  });

  // Run every day at Midnight (00:01) for No-Show Auto-Cancellation
  cron.schedule('1 0 * * *', async () => {
    console.log('[Cron] Running daily no-show cancellation check...');
    try {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const noShows = await RentalTransaction.find({
        status: 'Booked',
        rentalStartTime: { $lt: today }
      }).populate({ path: 'roomId', populate: { path: 'roomTypeId' } });

      for (const rental of noShows) {
        let totalPaid = 0;
        if (rental.payments && rental.payments.length > 0) {
          totalPaid = rental.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
        }
        
        let expectedTotal = 0;
        if (rental.rentalType === 'Long-Stay') {
          const rt = (rental.roomId as any)?.roomTypeId;
          expectedTotal = (rental.roomId as any)?.priceMonthly || rt?.price || 0;
        } else {
          const rStart = new Date(rental.rentalStartTime);
          const end = new Date(rental.expectedReturnDate || rental.rentalStartTime);
          let days = Math.ceil((end.getTime() - rStart.getTime()) / 86400000);
          if (days < 1) days = 1;
          const rt = (rental.roomId as any)?.roomTypeId;
          const dailyPrice = (rental.roomId as any)?.priceDaily || rt?.priceDaily || Math.ceil((rt?.price || 0) / 30);
          expectedTotal = days * dailyPrice;
        }

        if (totalPaid >= expectedTotal && expectedTotal > 0) {
          rental.status = 'Completed';
          console.log(`[Cron] Auto-Completed full-paid no-show: ${rental.transactionId}`);
        } else {
          rental.status = 'Cancelled';
          console.log(`[Cron] Auto-Cancelled unpaid/partial no-show: ${rental.transactionId}`);
        }
        await rental.save();
      }
    } catch (err) {
      console.error('[Cron] Error running no-show check:', err);
    }
  });

  // Run on January 1st every year
  cron.schedule('0 0 1 1 *', () => {
    fetchPublicHolidays(new Date().getFullYear());
  });
  
  console.log('[Cron] Cron jobs initialized (0 8 * * *), (1 0 * * *), (0 0 1 1 *).');

  // Fetch holidays on boot
  fetchPublicHolidays(new Date().getFullYear());
};

export const fetchPublicHolidays = async (year: number) => {
  console.log(`[Cron] Fetching public holidays for ${year}...`);
  try {
    let holidays: any[] = [];
    try {
      // Use AbortController for fetch timeout so it doesn't hang forever
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://api-harilibur.vercel.app/api?year=${year}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('API Error');
      holidays = await res.json();
    } catch (fetchErr) {
      console.log(`[Cron] External API failed or timed out. Using reliable offline fallback for ${year}.`);
      holidays = [
        { holiday_date: `${year}-01-01`, holiday_name: 'Tahun Baru Masehi', is_national_holiday: true },
        { holiday_date: `${year}-03-20`, holiday_name: 'Idul Fitri (Estimasi)', is_national_holiday: true },
        { holiday_date: `${year}-05-01`, holiday_name: 'Hari Buruh Internasional', is_national_holiday: true },
        { holiday_date: `${year}-05-27`, holiday_name: 'Idul Adha (Estimasi)', is_national_holiday: true },
        { holiday_date: `${year}-06-01`, holiday_name: 'Hari Lahir Pancasila', is_national_holiday: true },
        { holiday_date: `${year}-08-17`, Hari_Kemerdekaan_Republik_Indonesia: 'Hari Kemerdekaan Republik Indonesia', is_national_holiday: true },
        { holiday_date: `${year}-12-25`, holiday_name: 'Hari Raya Natal', is_national_holiday: true }
      ];
    }
    
    if (!holidays || !Array.isArray(holidays)) return;

    const fixedMasehi = ['Tahun Baru Masehi', 'Hari Buruh Internasional', 'Hari Lahir Pancasila', 'Hari Kemerdekaan Republik Indonesia', 'Hari Raya Natal'];

    await Event.deleteMany({ isHijriah: true, date: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31T23:59:59.999Z`) } });

    for (const h of holidays) {
      if (h.is_national_holiday) {
        const hDate = new Date(h.holiday_date);
        const nameToUse = h.holiday_name || h.Hari_Kemerdekaan_Republik_Indonesia;
        if (!nameToUse) continue;
        
        if (fixedMasehi.includes(nameToUse)) {
          const existing = await Event.findOne({ name: nameToUse, isPublicHoliday: true });
          if (!existing) {
            await Event.create({
              name: nameToUse,
              date: hDate,
              description: 'Libur Nasional',
              recurring: 'yearly',
              isPublicHoliday: true,
              isHijriah: false
            });
          }
        } else {
          // Check if it already exists for this exact shifting year to prevent duplicates on multiple boots
          const existingShift = await Event.findOne({ name: nameToUse, isPublicHoliday: true, isHijriah: true, date: hDate });
          if (!existingShift) {
             await Event.create({
               name: nameToUse,
               date: hDate,
               description: 'Libur Nasional',
               recurring: 'none',
               isPublicHoliday: true,
               isHijriah: true
             });
          }
        }
      }
    }
    console.log(`[Cron] Successfully synced public holidays for ${year}.`);
  } catch (err) {
    console.log(`[Cron] Failed to fetch public holidays (silent fail)`);
  }
};
