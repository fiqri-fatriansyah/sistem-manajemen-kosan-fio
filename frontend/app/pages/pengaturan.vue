<template>
  <div>
    <h1 class="page-title">Pengaturan Sistem</h1>
    
    <div v-if="!pageAuthenticated" style="text-align: center; padding: 40px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h2 style="margin-bottom: 20px;">Otorisasi Diperlukan</h2>
      <p style="margin-bottom: 15px;">Halaman ini dikunci. Masukkan Master PIN untuk mengakses pengaturan.</p>
      <input type="password" v-model="pagePin" class="input" placeholder="Masukkan PIN" style="max-width: 200px; display: inline-block; text-align: center;" @keyup.enter="authenticatePage" />
      <br/><br/>
      <button class="btn" @click="authenticatePage" :disabled="pageAuthenticating">{{ pageAuthenticating ? 'Memeriksa...' : 'Buka Kunci' }}</button>
    </div>

    <div v-else>
      <div class="material-card" style="max-width: 600px;">
      <h2 style="margin-bottom: 20px; color: var(--primary-color);">Pengaturan Denda Keterlambatan</h2>
      
      <div v-if="pending">Memuat konfigurasi...</div>
      <div v-else>
        <div style="margin-bottom: 15px;">
          <label style="display: block; font-size: 1em; margin-bottom: 5px;">Tipe Denda Global</label>
          <select v-model="form.penaltyType" class="input">
            <option value="None">Tanpa Denda</option>
            <option value="One-time">Satu Kali (Flat)</option>
            <option value="Daily">Per Hari</option>
            <option value="Weekly">Per Minggu</option>
          </select>
          <small style="color: var(--text-muted); display: block; margin-top: 5px;">Aturan ini akan berlaku secara otomatis untuk semua penyewaan yang telat dikembalikan.</small>
        </div>

        <div style="margin-bottom: 20px;" v-if="form.penaltyType !== 'None'">
          <label style="display: block; font-size: 1em; margin-bottom: 5px;">Biaya Denda (Rp)</label>
          <input type="number" v-model="form.penaltyCost" class="input" />
        </div>

        <button class="btn" @click="saveConfig" :disabled="saving">
          {{ saving ? 'Menyimpan...' : 'Simpan Pengaturan' }}
        </button>
      </div>
    </div>

    <!-- Interface & Display -->
    <div class="material-card" style="max-width: 600px; margin-top: 30px;">
      <h2 style="margin-bottom: 20px; color: var(--primary-color);">Antarmuka & Tampilan</h2>
      
      <div v-if="pending">Memuat konfigurasi...</div>
      <div v-else>
        <div style="margin-bottom: 15px;">
          <label style="display: block; font-size: 1em; margin-bottom: 5px;">Ukuran Font Dasar (px)</label>
          <input type="number" v-model="form.baseFontSize" class="input" min="18" />
          <small style="color: var(--text-muted); display: block; margin-top: 5px;">Minimum adalah 18px agar mudah dibaca. Elemen lain seperti judul akan diskalakan otomatis mengikuti ukuran dasar ini.</small>
        </div>

        <button class="btn" @click="saveInterfaceConfig" :disabled="saving">
          {{ saving ? 'Menyimpan...' : 'Simpan Pengaturan Tampilan' }}
        </button>
      </div>
    </div>

    <!-- WhatsApp Bot -->
    <div class="material-card" style="max-width: 600px; margin-top: 30px;">
      <h2 style="margin-bottom: 20px; color: var(--primary-color);">Integrasi WhatsApp Bot</h2>
      
      <div v-if="pending">Memuat konfigurasi...</div>
      <div v-else>
        <div style="margin-bottom: 15px;">
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <input type="checkbox" v-model="form.enableWhatsAppBot" style="width: 18px; height: 18px;" />
            <span style="font-weight: bold;">Aktifkan Bot Pengingat Otomatis</span>
          </label>
          <small style="color: var(--text-muted); display: block; margin-top: 5px; margin-left: 28px;">
            Sistem akan secara otomatis mengirim pesan WhatsApp kepada pelanggan H-1 sebelum penyewaan jatuh tempo.
          </small>
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; font-size: 1em; margin-bottom: 5px;">Aplikasi WhatsApp untuk "Tombol WA"</label>
          <select v-model="form.waLinkType" class="input">
            <option value="App">WhatsApp Windows / HP (wa.me)</option>
            <option value="Web">WhatsApp Web (web.whatsapp.com)</option>
          </select>
          <small style="color: var(--text-muted); display: block; margin-top: 5px;">Memilih tujuan yang akan dibuka ketika Anda menekan tombol WA secara manual pada tabel penyewaan.</small>
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; font-size: 1em; margin-bottom: 5px;">Format Kwitansi WhatsApp</label>
          <select v-model="form.waKwitansiType" class="input">
            <option value="Text">Teks Langsung (Ringkasan Kwitansi)</option>
            <option value="Link">Link Download PDF</option>
          </select>
          <small style="color: var(--text-muted); display: block; margin-top: 5px;">Pilih format pengiriman saat mengirim kwitansi (PDF Deposit / Lunas) ke pelanggan melalui tombol WA.</small>
        </div>

        <button class="btn" @click="saveWhatsAppConfig" :disabled="saving">
          {{ saving ? 'Menyimpan...' : 'Simpan Pengaturan WA' }}
        </button>

        <!-- QR Code Status -->
        <div v-if="form.enableWhatsAppBot" style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
          <h3 style="margin-bottom: 10px; font-size: 1.1em;">Status Koneksi WhatsApp</h3>
          <p v-if="waPending && !waStatus.isRunning">Memeriksa status...</p>
          <div v-else>
            <div v-if="waStatus.isReady" style="color: var(--success); font-weight: bold; display: flex; align-items: center; gap: 5px;">
              <span>✅ Bot terhubung dan siap beroperasi!</span>
            </div>
            <div v-else-if="waStatus.qr" style="text-align: center;">
              <p style="margin-bottom: 10px;">Scan QR Code ini menggunakan aplikasi WhatsApp di HP Anda (Perangkat Taut):</p>
              <img :src="'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(waStatus.qr)" alt="WhatsApp QR Code" />
            </div>
            <div v-else>
              <p style="font-style: italic;">Menginisialisasi bot WhatsApp (Chromium)... Mohon tunggu beberapa saat untuk memunculkan QR Code.</p>
              <button class="btn" style="margin-top: 10px;" @click="checkWaStatus">Refresh Status</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Audit Log Security -->
    <div class="material-card" style="margin-top: 30px;">
      <h2 style="margin-bottom: 20px; color: var(--primary-color);">Log Sistem & Audit</h2>

      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0;">Riwayat Aktivitas</h3>
          <a :href="'http://localhost:3001/api/audit/export/pdf?pin=' + pagePin" target="_blank">
            <button class="btn" style="background: #c62828; padding: 5px 15px; font-size: 1em;">Print PDF Log</button>
          </a>
        </div>

        <div v-if="pendingAudit">Memuat log...</div>
        <table v-else class="table" style="font-size: 1em;">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Aksi</th>
              <th>Entitas</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in auditLogs" :key="log._id">
              <td>{{ new Date(log.timestamp).toLocaleString('id-ID') }}</td>
              <td>
                <span :style="{ fontWeight: 'bold', color: getActionColor(log.action) }">
                  {{ log.action }}
                </span>
              </td>
              <td>{{ log.entity }}</td>
              <td>{{ log.details }}</td>
            </tr>
            <tr v-if="auditLogs.length === 0">
              <td colspan="4" style="text-align: center; padding: 20px;">Tidak ada aktivitas terekam.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Demo Mode / Example Data -->
    <div class="material-card" style="max-width: 600px; margin-top: 30px; border-left: 5px solid var(--info);">
      <h2 style="margin-bottom: 20px; color: var(--info);">Mode Contoh (Demo State)</h2>
      <p style="margin-bottom: 15px; font-size: 1em; line-height: 1.5;">
        Mengaktifkan Mode Contoh akan menyimpan data asli Anda sementara dan menggantinya dengan berbagai data dummy (contoh Inventaris, Pelanggan, Penyewaan dari berbagai tanggal). Cocok untuk mencoba fitur atau melihat grafik dasbor.
      </p>
      
      <div v-if="demoPending">Memeriksa status...</div>
      <div v-else style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
        <span style="font-size: 1.1em; font-weight: bold;">Status: 
          <span :style="{ color: isDemoMode ? 'var(--success)' : 'var(--text-muted)' }">
            {{ isDemoMode ? 'AKTIF (Data Dummy)' : 'TIDAK AKTIF (Data Asli)' }}
          </span>
        </span>
      </div>

      <button class="btn" :style="{ background: isDemoMode ? '#f39c12' : '#2980b9', color: 'white', fontWeight: 'bold' }" @click="toggleDemoMode" :disabled="demoToggling">
        {{ demoToggling ? 'Sedang Memproses...' : (isDemoMode ? 'Matikan Mode Contoh & Kembalikan Data Asli' : 'Aktifkan Mode Contoh') }}
      </button>
    </div>

    <!-- Danger Zone -->
    <div class="material-card" style="max-width: 600px; margin-top: 30px; border-left: 5px solid var(--danger);">
      <h2 style="margin-bottom: 20px; color: var(--danger);">Zona Bahaya (Danger Zone)</h2>
      <p style="margin-bottom: 15px; font-size: 1em; line-height: 1.5;">
        Gunakan fitur ini hanya jika Anda ingin mereset seluruh sistem kembali ke kondisi awal (Clean Slate). Semua data Pelanggan, Inventaris, dan Penyewaan akan <strong>dihapus permanen</strong>.
      </p>
      
      <div style="margin-bottom: 20px;">
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
          <input type="checkbox" v-model="wipeAudit" style="width: 18px; height: 18px;" />
          <span style="font-weight: bold; color: var(--danger);">Hapus juga seluruh Log Audit</span>
        </label>
        <small style="color: var(--text-muted); display: block; margin-top: 5px; margin-left: 28px;">
          Jika tidak dicentang, riwayat Log Audit sebelumnya akan dipertahankan sebagai jejak historikal permanen.
        </small>
      </div>

      <button class="btn" style="background: var(--danger);" @click="executeFactoryReset" :disabled="wiping">
        {{ wiping ? 'Sedang Menghapus Data...' : 'Hapus Semua Data (Factory Reset)' }}
      </button>
    </div>
    
    </div> <!-- End of authenticated div -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const pending = ref(true);
const saving = ref(false);
const form = ref({ penaltyType: 'None', penaltyCost: 0, enableWhatsAppBot: false, waLinkType: 'App', waKwitansiType: 'Text', baseFontSize: 18 });

const wipeAudit = ref(false);
const wiping = ref(false);

const pageAuthenticated = ref(false);
const pageAuthenticating = ref(false);
const pagePin = ref('');

const auditLogs = ref<any[]>([]);
const pendingAudit = ref(false);

const isDemoMode = ref(false);
const demoPending = ref(true);
const demoToggling = ref(false);

const waStatus = ref<any>({ isReady: false, qr: null, isRunning: false });
const waPending = ref(false);
let waInterval: any = null;

const fetchConfig = async () => {
  pending.value = true;
  demoPending.value = true;
  try {
    const res = await fetch('http://localhost:3001/api/config');
    const data = await res.json();
    if(data) {
      form.value.penaltyType = data.penaltyType;
      form.value.penaltyCost = data.penaltyCost;
      form.value.enableWhatsAppBot = data.enableWhatsAppBot || false;
      form.value.waLinkType = data.waLinkType || 'App';
      form.value.waKwitansiType = data.waKwitansiType || 'Text';
      form.value.baseFontSize = data.baseFontSize || 18;
      if (form.value.enableWhatsAppBot) {
        checkWaStatus();
      }
    }
    
    const demoRes = await fetch('http://localhost:3001/api/config/demo-status');
    const demoData = await demoRes.json();
    isDemoMode.value = demoData.isDemoMode;

  } catch (err) {
    console.error(err);
  }
  pending.value = false;
  demoPending.value = false;
};

const checkWaStatus = async () => {
  waPending.value = true;
  try {
    const res = await fetch('http://localhost:3001/api/config/whatsapp-status');
    waStatus.value = await res.json();
    if (!waStatus.value.isReady && waStatus.value.isRunning && form.value.enableWhatsAppBot) {
      if (!waInterval) waInterval = setInterval(checkWaStatus, 3000);
    } else if (waStatus.value.isReady) {
      if (waInterval) { clearInterval(waInterval); waInterval = null; }
    }
  } catch (err) {}
  waPending.value = false;
};

const saveConfig = async () => {
  saving.value = true;
  try {
    await fetch('http://localhost:3001/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });
    alert('Pengaturan Denda berhasil disimpan!');
  } catch (err) {
    alert('Gagal menyimpan pengaturan');
  }
  saving.value = false;
};

const saveInterfaceConfig = async () => {
  if (form.value.baseFontSize < 18) {
    form.value.baseFontSize = 18;
  }
  saving.value = true;
  try {
    await fetch('http://localhost:3001/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });
    alert('Pengaturan Tampilan berhasil disimpan!');
    // Update local CSS variable immediately
    document.documentElement.style.setProperty('--base-font-size', `${form.value.baseFontSize}px`);
  } catch (err) {
    alert('Gagal menyimpan pengaturan');
  }
  saving.value = false;
};

const saveWhatsAppConfig = async () => {
  if (form.value.enableWhatsAppBot) {
    if (!confirm('PERINGATAN: Mengaktifkan bot otomatis dapat membuat nomor WA Anda ditandai sebagai spam atau diblokir oleh WhatsApp jika dilaporkan. Gunakan nomor khusus (bukan nomor pribadi utama). Lanjutkan?')) {
      form.value.enableWhatsAppBot = false;
      return;
    }
  }
  
  saving.value = true;
  try {
    await fetch('http://localhost:3001/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });
    alert('Pengaturan WhatsApp berhasil disimpan!');
    if (form.value.enableWhatsAppBot) {
      waStatus.value.isRunning = true; // Optimistic
      setTimeout(checkWaStatus, 2000); 
    } else {
      if (waInterval) { clearInterval(waInterval); waInterval = null; }
      waStatus.value = { isReady: false, qr: null, isRunning: false };
    }
  } catch (err) {
    alert('Gagal menyimpan pengaturan');
  }
  saving.value = false;
};

const toggleDemoMode = async () => {
  const actionText = isDemoMode.value ? "mematikan" : "mengaktifkan";
  const pin = prompt(`Masukkan Master PIN Anda untuk ${actionText} Mode Contoh:`);
  if (!pin) return; // user cancelled

  demoToggling.value = true;
  try {
    const res = await fetch('http://localhost:3001/api/config/toggle-demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    
    const data = await res.json();
    if (res.ok) {
      alert(`SUKSES: Mode Contoh berhasil ${actionText}!`);
      window.location.reload();
    } else {
      alert('GAGAL: ' + data.error);
    }
  } catch (err: any) {
    alert('Gagal mengeksekusi toggle demo: ' + err.message);
  }
  demoToggling.value = false;
};

const executeFactoryReset = async () => {
  const pin = prompt('Tindakan ini SANGAT BERBAHAYA. Masukkan Master PIN Anda untuk melanjutkan:');
  if (!pin) return; // user cancelled

  if (confirm('PERINGATAN TERAKHIR: Semua data akan hilang selamanya. Anda yakin?')) {
    wiping.value = true;
    try {
      const res = await fetch('http://localhost:3001/api/config/wipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, wipeAudit: wipeAudit.value })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert('SUKSES: ' + data.message);
        window.location.reload();
      } else {
        alert('GAGAL: ' + data.error);
      }
    } catch (err: any) {
      alert('Gagal mengeksekusi factory reset: ' + err.message);
    }
    wiping.value = false;
  }
};

const authenticatePage = async () => {
  pageAuthenticating.value = true;
  try {
    // Audit log endpoint can be used to verify Master PIN quickly
    const res = await fetch(`http://localhost:3001/api/audit?pin=${pagePin.value}`);
    if (res.ok) {
      auditLogs.value = await res.json();
      pageAuthenticated.value = true;
      fetchConfig();
    } else {
      alert('PIN Salah!');
    }
  } catch (err) {
    console.error(err);
    alert('Terjadi kesalahan koneksi.');
  }
  pageAuthenticating.value = false;
};

const getActionColor = (action: string) => {
  switch(action) {
    case 'CREATE': return 'var(--success)';
    case 'UPDATE': return '#f39c12';
    case 'DELETE': return 'var(--danger)';
    case 'CANCEL': return 'var(--danger)';
    case 'RENT': return '#2980b9';
    case 'RETURN': return '#8e44ad';
    default: return 'var(--text-main)';
  }
};

// Do not fetch config until authenticated
// onMounted(fetchConfig);
</script>
