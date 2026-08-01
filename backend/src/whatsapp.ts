import { Client, LocalAuth } from 'whatsapp-web.js';

let client: Client | null = null;
let latestQrStr: string | null = null;
let isReady = false;

export const initWhatsApp = () => {
  if (client) return; // already initialized

  console.log('[WhatsApp] Initializing client...');
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', (qr) => {
    latestQrStr = qr;
    isReady = false;
    console.log('[WhatsApp] New QR code generated. Awaiting scan...');
  });

  client.on('ready', () => {
    isReady = true;
    latestQrStr = null;
    console.log('[WhatsApp] Client is perfectly ready!');
  });

  client.on('disconnected', () => {
    console.log('[WhatsApp] Client disconnected.');
    isReady = false;
    latestQrStr = null;
    client = null;
  });

  client.initialize().catch(err => {
    console.error('[WhatsApp] Initialization error:', err);
  });
};

export const getWhatsAppStatus = () => {
  return {
    isReady,
    qr: latestQrStr,
    isRunning: client !== null
  };
};

export const destroyWhatsApp = async () => {
  if (client) {
    try {
      await client.destroy();
    } catch(e) {}
    client = null;
    isReady = false;
    latestQrStr = null;
    console.log('[WhatsApp] Client destroyed and stopped.');
  }
};

export const sendWhatsAppMessage = async (phone: string, message: string) => {
  if (!isReady || !client) {
    console.log('[WhatsApp] Client not ready, message dropped.');
    return;
  }
  // Format phone number (e.g., 0812... -> 62812...@c.us)
  let formattedPhone = phone.replace(/[^0-9]/g, ''); // strip non-numeric
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '62' + formattedPhone.substring(1);
  }
  formattedPhone += '@c.us';
  
  try {
    await client.sendMessage(formattedPhone, message);
    console.log(`[WhatsApp] Sent message to ${formattedPhone}`);
  } catch (err) {
    console.error(`[WhatsApp] Failed to send message to ${formattedPhone}:`, err);
  }
};
