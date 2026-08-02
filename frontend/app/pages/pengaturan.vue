<template>
  <div>
    <h1 class="page-title">Pengaturan Sistem</h1>
    
    <div v-if="!pageAuthenticated" style="text-align: center; padding: 2.5rem; background: white; border-radius: 0.5rem; box-shadow: 0 0.25rem 0.375rem rgba(0,0,0,0.1);">
      <h2 style="margin-bottom: 1.25rem;">Otorisasi Diperlukan</h2>
      <p style="margin-bottom: 0.9375rem;">Halaman ini dikunci. Masukkan Master PIN untuk mengakses pengaturan.</p>
      <input type="password" v-model="pagePin" class="input" placeholder="Masukkan PIN" style="max-width: 12.5rem; display: inline-block; text-align: center;" @keyup.enter="authenticatePage" />
      <br/><br/>
      <button class="btn" @click="authenticatePage" :disabled="pageAuthenticating">{{ pageAuthenticating ? 'Memeriksa...' : 'Buka Kunci' }}</button>
    </div>

    <div v-else>
      
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 2rem; border-bottom: 2px solid #eee; padding-bottom: 1rem;">
        <button class="btn" :style="activeTab === 'denda' ? 'background: var(--primary-color); color: white;' : 'background: #f5f5f5; color: #333;'" @click="activeTab = 'denda'">Denda</button>
        <button class="btn" :style="activeTab === 'antarmuka' ? 'background: var(--primary-color); color: white;' : 'background: #f5f5f5; color: #333;'" @click="activeTab = 'antarmuka'">Antarmuka</button>
        <button class="btn" :style="activeTab === 'wa' ? 'background: var(--primary-color); color: white;' : 'background: #f5f5f5; color: #333;'" @click="activeTab = 'wa'">WhatsApp</button>
        <button class="btn" :style="activeTab === 'template' ? 'background: var(--primary-color); color: white;' : 'background: #f5f5f5; color: #333;'" @click="activeTab = 'template'">Template Pesan</button>
        <button class="btn" :style="activeTab === 'audit' ? 'background: var(--primary-color); color: white;' : 'background: #f5f5f5; color: #333;'" @click="activeTab = 'audit'">Log Audit</button>
        <button class="btn" :style="activeTab === 'demo' ? 'background: var(--primary-color); color: white;' : 'background: #f5f5f5; color: #333;'" @click="activeTab = 'demo'">Demo</button>
        <button class="btn" :style="activeTab === 'danger' ? 'background: #d32f2f; color: white;' : 'background: #ffcdd2; color: #c62828;'" @click="activeTab = 'danger'">Danger Zone</button>
      </div>


      <div v-show="activeTab === 'denda'" class="material-card" style="max-width: 37.5rem;">
      <h2 style="margin-bottom: 1.25rem; color: var(--primary-color);">Pengaturan Denda Keterlambatan</h2>
      
      <div v-if="pending">Memuat konfigurasi...</div>
      <div v-else>
        <div style="margin-bottom: 0.9375rem;">
          <label style="display: block; font-size: 1em; margin-bottom: 0.3125rem;">Tipe Denda Global</label>
          <select v-model="form.penaltyType" class="input">
            <option value="None">Tanpa Denda</option>
            <option value="One-time">Satu Kali (Flat)</option>
            <option value="Daily">Per Hari</option>
            <option value="Weekly">Per Minggu</option>
          </select>
          <small style="color: var(--text-muted); display: block; margin-top: 0.3125rem;">Aturan ini akan berlaku secara otomatis untuk semua penyewaan yang telat dikembalikan.</small>
        </div>
        <div style="margin-bottom: 1.25rem;" v-if="form.penaltyType !== 'None'">
          <label style="display: block; font-size: 1em; margin-bottom: 0.3125rem;">Biaya Denda (Rp)</label>
          <input type="number" min="0" v-model="form.penaltyCost" class="input" />
        </div>
        
        <div style="margin-bottom: 1.25rem;">
          <label style="display: block; font-size: 1em; margin-bottom: 0.3125rem;">Toleransi Keterlambatan & Tunggakan (Hari)</label>
          <input type="number" min="0" v-model="form.overdueGracePeriodDays" class="input" />
          <small style="color: var(--text-muted); display: block; margin-top: 0.3125rem;">Batas toleransi (hari) sebelum room yang belum dibayar / lewat jatuh tempo otomatis ditandai sebagai 'Available'.</small>
        </div>


        <button class="btn" @click="saveConfig" :disabled="saving">
          {{ saving ? 'Menyimpan...' : 'Simpan Pengaturan' }}
        </button>
      </div>
    </div>

    <!-- Interface & Display -->
    <div v-show="activeTab === 'antarmuka'" class="material-card" style="max-width: 37.5rem;">
      <h2 style="margin-bottom: 1.25rem; color: var(--primary-color);">Antarmuka & Tampilan</h2>
      
      <div v-if="pending">Memuat konfigurasi...</div>
      <div v-else>
        <div style="margin-bottom: 0.9375rem;">
          <label style="display: block; font-size: 1em; margin-bottom: 0.3125rem;">Nama Aplikasi</label>
          <input type="text" v-model="form.appName" class="input" placeholder="Sistem Manajemen Kosan Fio" />
        </div>

        <div style="margin-bottom: 0.9375rem;">
          <label style="display: block; font-size: 1em; margin-bottom: 0.3125rem;">Deskripsi Singkat</label>
          <input type="text" v-model="form.appDescription" class="input" placeholder="Platform manajemen kosan terbaik." />
        </div>

        <div style="margin-bottom: 0.9375rem;">
          <label style="display: block; font-size: 1em; margin-bottom: 0.3125rem;">Logo Aplikasi</label>
          <input type="file" class="input" accept="image/*" @change="e => uploadImage(e, 'logo')" />
          <div v-if="form.appLogoUrl" style="margin-top: 0.625rem;">
            <img :src="'http://localhost:3001' + form.appLogoUrl" style="height: 3.75rem; object-fit: contain; border-radius: 0.25rem; background: #f0f0f0; padding: 0.3125rem;" />
          </div>
        </div>

        <div style="margin-bottom: 0.9375rem;">
          <label style="display: block; font-size: 1em; margin-bottom: 0.3125rem;">Favicon Aplikasi (Ikon Tab Browser)</label>
          <input type="file" class="input" accept="image/*" @change="e => uploadImage(e, 'favicon')" />
          <div v-if="form.appFaviconUrl" style="margin-top: 0.625rem;">
            <img :src="'http://localhost:3001' + form.appFaviconUrl" style="height: 2rem; width: 2rem; object-fit: contain; border-radius: 0.25rem; background: #f0f0f0; padding: 0.125rem;" />
          </div>
        </div>

        <div style="margin-bottom: 0.9375rem;">
          <label style="display: block; font-size: 1em; margin-bottom: 0.3125rem;">Ukuran Font Dasar (px)</label>
          <input type="number" v-model="form.baseFontSize" class="input" min="1" />
          <small style="color: var(--text-muted); display: block; margin-top: 0.3125rem;">Elemen teks terkecil di aplikasi akan menggunakan ukuran ini secara presisi (dalam px). Elemen lain seperti judul akan diskalakan otomatis.</small>
        </div>

        <button class="btn" @click="saveInterfaceConfig" :disabled="saving">
          {{ saving ? 'Menyimpan...' : 'Simpan Pengaturan Tampilan' }}
        </button>
      </div>
    </div>

    <!-- WhatsApp Bot -->
    <div v-show="activeTab === 'wa'" class="material-card" style="max-width: 37.5rem;">
      <h2 style="margin-bottom: 1.25rem; color: var(--primary-color);">Integrasi WhatsApp Bot</h2>
      
      <div v-if="pending">Memuat konfigurasi...</div>
      <div v-else>
        <div style="margin-bottom: 0.9375rem;">
          <label style="display: flex; align-items: center; gap: 0.625rem; cursor: pointer;">
            <input type="checkbox" v-model="form.enableWhatsAppBot" style="width: 1.125rem; height: 1.125rem;" />
            <span style="font-weight: bold;">Aktifkan Bot Pengingat Otomatis</span>
          </label>
          <small style="color: var(--text-muted); display: block; margin-top: 0.3125rem; margin-left: 1.75rem;">
            Sistem akan secara otomatis mengirim pesan WhatsApp kepada pelanggan H-1 sebelum penyewaan jatuh tempo.
          </small>
        </div>

        <div style="margin-bottom: 1.25rem;">
          <label style="display: block; font-size: 1em; margin-bottom: 0.3125rem;">Aplikasi WhatsApp untuk "Tombol WA"</label>
          <select v-model="form.waLinkType" class="input">
            <option value="App">WhatsApp Windows / HP (wa.me)</option>
            <option value="Web">WhatsApp Web (web.whatsapp.com)</option>
          </select>
          <small style="color: var(--text-muted); display: block; margin-top: 0.3125rem;">Memilih tujuan yang akan dibuka ketika Anda menekan tombol WA secara manual pada tabel penyewaan.</small>
        </div>

        <div style="margin-bottom: 1.25rem;">
          <label style="display: block; font-size: 1em; margin-bottom: 0.3125rem;">Format Kwitansi WhatsApp</label>
          <select v-model="form.waKwitansiType" class="input">
            <option value="Text">Teks Langsung (Ringkasan Kwitansi)</option>
            <option value="Link">Link Download PDF</option>
          </select>
          <small style="color: var(--text-muted); display: block; margin-top: 0.3125rem;">Pilih format pengiriman saat mengirim kwitansi (PDF Deposit / Lunas) ke pelanggan melalui tombol WA.</small>
        </div>

        <button class="btn" @click="saveWhatsAppConfig" :disabled="saving">
          {{ saving ? 'Menyimpan...' : 'Simpan Pengaturan WA' }}
        </button>

        <!-- QR Code Status -->
        <div v-if="form.enableWhatsAppBot" style="margin-top: 1.25rem; padding: 0.9375rem; background: #f5f5f5; border-radius: 0.5rem;">
          <h3 style="margin-bottom: 0.625rem; font-size: 1.1em;">Status Koneksi WhatsApp</h3>
          <p v-if="waPending && !waStatus.isRunning">Memeriksa status...</p>
          <div v-else>
            <div v-if="waStatus.isReady" style="color: var(--success); font-weight: bold; display: flex; align-items: center; gap: 0.3125rem;">
              <span>✅ Bot terhubung dan siap beroperasi!</span>
            </div>
            <div v-else-if="waStatus.qr" style="text-align: center;">
              <p style="margin-bottom: 0.625rem;">Scan QR Code ini menggunakan aplikasi WhatsApp di HP Anda (Perangkat Taut):</p>
              <img :src="'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(waStatus.qr)" alt="WhatsApp QR Code" />
            </div>
            <div v-else>
              <p style="font-style: italic;">Menginisialisasi bot WhatsApp (Chromium)... Mohon tunggu beberapa saat untuk memunculkan QR Code.</p>
              <button class="btn" style="margin-top: 0.625rem;" @click="checkWaStatus">Refresh Status</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Template Pesan WhatsApp -->
    <div v-show="activeTab === 'template'" class="material-card" style="max-width: 37.5rem;">
      <h2 style="margin-bottom: 1.25rem; color: var(--primary-color);">Template Pesan WhatsApp</h2>
      <p style="margin-bottom: 0.9375rem; font-size: 0.95em; line-height: 1.5; color: var(--text-muted);" v-pre>
        Variabel yang dapat digunakan:<br>
        <strong style="color: var(--primary-color);">{{nama}}</strong> : Nama Penyewa<br>
        <strong style="color: var(--primary-color);">{{kamar}}</strong> : Nomor/Nama Kamar<br>
        <strong style="color: var(--primary-color);">{{tanggal}}</strong> : Tanggal Jatuh Tempo<br>
        <strong style="color: var(--primary-color);">{{nominal}}</strong> : Total Tagihan/Tunggakan
      </p>

      <div style="margin-bottom: 0.9375rem;">
        <label style="display: flex; justify-content: space-between; margin-bottom: 0.3125rem;">
          <span>Belum Lunas / Kurang DP (Booked)</span>
          <button class="btn" style="padding: 0.125rem 0.5rem; font-size: 0.8em; background: #e0e0e0; color: #333;" @click="resetTemplate('msgTemplateBooked')">Reset Default</button>
        </label>
        <textarea v-model="form.msgTemplateBooked" class="input" style="height: 6.25rem; resize: vertical;"></textarea>
      </div>

      <div style="margin-bottom: 0.9375rem;">
        <label style="display: flex; justify-content: space-between; margin-bottom: 0.3125rem;">
          <span>Pengingat Check-In (Jadwal Hari Ini)</span>
          <button class="btn" style="padding: 0.125rem 0.5rem; font-size: 0.8em; background: #e0e0e0; color: #333;" @click="resetTemplate('msgTemplateCheckIn')">Reset Default</button>
        </label>
        <textarea v-model="form.msgTemplateCheckIn" class="input" style="height: 6.25rem; resize: vertical;"></textarea>
      </div>

      <div style="margin-bottom: 0.9375rem;">
        <label style="display: flex; justify-content: space-between; margin-bottom: 0.3125rem;">
          <span>Pengingat Jatuh Tempo (H-1 s/d H-7)</span>
          <button class="btn" style="padding: 0.125rem 0.5rem; font-size: 0.8em; background: #e0e0e0; color: #333;" @click="resetTemplate('msgTemplateReminder')">Reset Default</button>
        </label>
        <textarea v-model="form.msgTemplateReminder" class="input" style="height: 6.25rem; resize: vertical;"></textarea>
      </div>

      <div style="margin-bottom: 0.9375rem;">
        <label style="display: flex; justify-content: space-between; margin-bottom: 0.3125rem;">
          <span>Tunggakan (Lewat Jatuh Tempo)</span>
          <button class="btn" style="padding: 0.125rem 0.5rem; font-size: 0.8em; background: #e0e0e0; color: #333;" @click="resetTemplate('msgTemplateOverdue')">Reset Default</button>
        </label>
        <textarea v-model="form.msgTemplateOverdue" class="input" style="height: 6.25rem; resize: vertical;"></textarea>
      </div>

      <div style="margin-bottom: 0.9375rem;">
        <label style="display: flex; justify-content: space-between; margin-bottom: 0.3125rem;">
          <span>Overstay (Lewat Tanggal Keluar)</span>
          <button class="btn" style="padding: 0.125rem 0.5rem; font-size: 0.8em; background: #e0e0e0; color: #333;" @click="resetTemplate('msgTemplateOverstay')">Reset Default</button>
        </label>
        <textarea v-model="form.msgTemplateOverstay" class="input" style="height: 6.25rem; resize: vertical;"></textarea>
      </div>

      <div style="margin-bottom: 0.9375rem;">
        <label style="display: flex; justify-content: space-between; margin-bottom: 0.3125rem;">
          <span>Perlu Pengusiran</span>
          <button class="btn" style="padding: 0.125rem 0.5rem; font-size: 0.8em; background: #e0e0e0; color: #333;" @click="resetTemplate('msgTemplateEviction')">Reset Default</button>
        </label>
        <textarea v-model="form.msgTemplateEviction" class="input" style="height: 6.25rem; resize: vertical;"></textarea>
      </div>

      <div style="margin-bottom: 0.9375rem;">
        <label style="display: flex; justify-content: space-between; margin-bottom: 0.3125rem;">
          <span>Promo Loyalitas (Top 5 Aktif)</span>
          <button class="btn" style="padding: 0.125rem 0.5rem; font-size: 0.8em; background: #e0e0e0; color: #333;" @click="resetTemplate('msgTemplatePromo')">Reset Default</button>
        </label>
        <textarea v-model="form.msgTemplatePromo" class="input" style="height: 6.25rem; resize: vertical;"></textarea>
      </div>

      <button class="btn" @click="saveWhatsAppConfig" :disabled="saving">
        {{ saving ? 'Menyimpan...' : 'Simpan Template Pesan' }}
      </button>
    </div>

    <!-- Audit Log Security -->
    <div v-show="activeTab === 'audit'" class="material-card" style="max-width: 100%;">
      <h2 style="margin-bottom: 1.25rem; color: var(--primary-color);">Log Sistem & Audit</h2>

      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25em; flex-wrap: wrap; gap: 1em;">
          <div style="display: flex; gap: 0.5em; align-items: center; flex-wrap: wrap; flex: 1; min-width: 15em;">
            <input type="text" v-model="auditSearch" placeholder="Cari aksi, entitas..." class="input" style="flex: 1; min-width: 10em; margin: 0; padding: 0.6em;" @keyup.enter="fetchAuditLogs(1)" />
            <button class="btn" style="white-space: nowrap; margin: 0; padding: 0.6em 1.2em;" @click="fetchAuditLogs(1)">Cari</button>
          </div>
          <div style="display: flex; gap: 0.5em; align-items: center; flex-wrap: wrap; flex: 1; min-width: 15em; justify-content: flex-end;">
            <select v-model="pdfRange" class="input" style="flex: 1; min-width: 10em; max-width: 15em; margin: 0; padding: 0.6em;">
              <option value="1">1 Hari Terakhir</option>
              <option value="3">3 Hari Terakhir</option>
              <option value="7">7 Hari Terakhir</option>
              <option value="30">30 Hari Terakhir</option>
              <option value="all">Seluruh Waktu</option>
            </select>
            <a :href="'http://localhost:3001/api/audit/export/pdf?pin=' + pagePin + '&range=' + pdfRange" target="_blank" style="display: flex; text-decoration: none;">
              <button class="btn" style="background: #c62828; padding: 0.6em 1em; font-size: 1em; white-space: nowrap; margin: 0;">Print PDF Log</button>
            </a>
          </div>
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
              <td colspan="4" style="text-align: center; padding: 1.5em;">Tidak ada aktivitas terekam.</td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1em; flex-wrap: wrap; gap: 0.5em;">
          <div style="display: flex; align-items: center; gap: 0.5em;">
            <span style="font-size: 1em; color: var(--text-muted);">Tampilkan:</span>
            <select v-model="auditLimit" class="input" style="margin: 0; padding: 0.5em;" @change="fetchAuditLogs(1)">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5em;">
            <button class="btn" style="padding: 0.5em 1em; margin: 0;" @click="fetchAuditLogs(auditPage - 1)" :disabled="auditPage <= 1">Sebelumnya</button>
            <span style="font-size: 1em;">Halaman {{ auditPage }} dari {{ auditTotalPages || 1 }}</span>
            <button class="btn" style="padding: 0.5em 1em; margin: 0;" @click="fetchAuditLogs(auditPage + 1)" :disabled="auditPage >= auditTotalPages">Selanjutnya</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Demo Mode / Example Data -->
    <div v-show="activeTab === 'demo'" class="material-card" style="max-width: 37.5rem;">
      <h2 style="margin-bottom: 1.25rem; color: var(--info);">Mode Contoh (Demo State)</h2>
      <p style="margin-bottom: 0.9375rem; font-size: 1em; line-height: 1.5;">
        Mengaktifkan Mode Contoh akan menyimpan data asli Anda sementara dan menggantinya dengan berbagai data dummy (contoh Inventaris, Pelanggan, Penyewaan dari berbagai tanggal). Cocok untuk mencoba fitur atau melihat grafik dasbor.
      </p>
      
      <div v-if="demoPending">Memeriksa status...</div>
      <div v-else style="display: flex; align-items: center; gap: 0.9375rem; margin-bottom: 0.9375rem;">
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
    <div v-show="activeTab === 'danger'" class="material-card" style="max-width: 37.5rem;">
      <h2 style="margin-bottom: 1.25rem; color: var(--danger);">Zona Bahaya (Danger Zone)</h2>
      <p style="margin-bottom: 0.9375rem; font-size: 1em; line-height: 1.5;">
        Gunakan fitur ini hanya jika Anda ingin mereset seluruh sistem kembali ke kondisi awal (Clean Slate). Semua data Pelanggan, Inventaris, dan Penyewaan akan <strong>dihapus permanen</strong>.
      </p>
      
      <div style="margin-bottom: 1.25rem;">
        <label style="display: flex; align-items: center; gap: 0.625rem; cursor: pointer;">
          <input type="checkbox" v-model="wipeAudit" style="width: 1.125rem; height: 1.125rem;" />
          <span style="font-weight: bold; color: var(--danger);">Hapus juga seluruh Log Audit</span>
        </label>
        <small style="color: var(--text-muted); display: block; margin-top: 0.3125rem; margin-left: 1.75rem;">
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

const defaultTemplates = {
  msgTemplateBooked: 'Halo {{nama}},\n\nKami mengingatkan bahwa Anda memiliki booking untuk kamar {{kamar}} yang belum lunas/DP. Mohon segera diselesaikan sebesar Rp {{nominal}}.\n\nTerima kasih.',
  msgTemplateOverdue: 'Halo {{nama}},\n\nKami mengingatkan bahwa tagihan sewa kamar {{kamar}} Anda telah melewati batas waktu (jatuh tempo pada {{tanggal}}). Mohon segera melunasi tunggakan sebesar Rp {{nominal}}.\n\nTerima kasih.',
  msgTemplateOverstay: 'Halo {{nama}},\n\nKami mengingatkan bahwa masa sewa kamar {{kamar}} Anda telah habis pada {{tanggal}}.\nMohon segera konfirmasi perpanjangan sewa atau silakan check-out.\n\nTerima kasih.',
  msgTemplateReminder: 'Halo {{nama}},\n\nKami mengingatkan bahwa tagihan sewa kamar {{kamar}} Anda akan jatuh tempo pada {{tanggal}}.\nMohon persiapkan pembayaran Anda atau silakan konfirmasi jika ingin check-out.\n\nTerima kasih.',
  msgTemplateEviction: 'Halo {{nama}},\n\nKami menginformasikan bahwa masa sewa Anda di kamar {{kamar}} telah berakhir dan melewati batas waktu toleransi.\nMohon kesediaannya untuk segera mengosongkan kamar, atau hubungi kami untuk mendiskusikan lebih lanjut.\n\nTerima kasih atas kerja samanya.',
  msgTemplateCheckIn: 'Halo {{nama}},\n\nKami mengingatkan bahwa jadwal Check-In Anda untuk kamar {{kamar}} adalah hari ini.\nMohon segera melunasi pembayaran awal (jika ada) dan melakukan Check-In di lokasi.\n\nTerima kasih.',
  msgTemplatePromo: 'Halo {{nama}},\n\nTerima kasih telah menjadi penyewa setia Kosan Fio! Kami ada promo spesial untuk perpanjangan sewa Anda bulan ini.\n\nHubungi kami untuk klaim!'
};

const pending = ref(true);
const saving = ref(false);
const form = ref<any>({ 
  penaltyType: 'None', 
  penaltyCost: 0, 
  enableWhatsAppBot: false, 
  waLinkType: 'App', 
  waKwitansiType: 'Text', 
  baseFontSize: 18, 
  appName: '', 
  appDescription: '', 
  appLogoUrl: '', 
  appFaviconUrl: '', 
  msgTemplateBooked: defaultTemplates.msgTemplateBooked,
  msgTemplateOverdue: defaultTemplates.msgTemplateOverdue,
  msgTemplateOverstay: defaultTemplates.msgTemplateOverstay,
  msgTemplateReminder: defaultTemplates.msgTemplateReminder,
  msgTemplateEviction: defaultTemplates.msgTemplateEviction,
  msgTemplateCheckIn: defaultTemplates.msgTemplateCheckIn,
  msgTemplatePromo: defaultTemplates.msgTemplatePromo
});
const wipeAudit = ref(false);
const wiping = ref(false);

const pageAuthenticated = ref(false);
const pageAuthenticating = ref(false);
const pagePin = ref('');
const activeTab = ref('denda');

const auditLogs = ref<any[]>([]);
const pendingAudit = ref(false);
const auditSearch = ref('');
const auditPage = ref(1);
const auditTotalPages = ref(1);
const auditLimit = ref(10);
const pdfRange = ref('7');

const isDemoMode = ref(false);
const demoPending = ref(true);
const demoToggling = ref(false);

const waStatus = ref<any>({ isReady: false, qr: null, isRunning: false });
const waPending = ref(false);
let waInterval: any = null;

const uploadImage = async (e: any, type: string) => {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('image', file);
  formData.append('type', type);
  try {
    const res = await fetch('http://localhost:3001/api/config/upload-image', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (type === 'logo') form.value.appLogoUrl = data.appLogoUrl;
    if (type === 'favicon') form.value.appFaviconUrl = data.appFaviconUrl;
  } catch (err) {
    alert('Gagal mengupload gambar');
  }
};

const resetTemplate = (key: string) => {
  if (confirm('Yakin ingin mereset template ini ke bawaan default?')) {
    form.value[key] = (defaultTemplates as any)[key];
  }
};

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
      form.value.appName = data.appName || '';
      form.value.appDescription = data.appDescription || '';
      form.value.appLogoUrl = data.appLogoUrl || '';
      form.value.appFaviconUrl = data.appFaviconUrl || '';
      form.value.overdueGracePeriodDays = data.overdueGracePeriodDays !== undefined ? data.overdueGracePeriodDays : 3;
      form.value.msgTemplateBooked = data.msgTemplateBooked || defaultTemplates.msgTemplateBooked;
      form.value.msgTemplateOverdue = data.msgTemplateOverdue || defaultTemplates.msgTemplateOverdue;
      form.value.msgTemplateOverstay = data.msgTemplateOverstay || defaultTemplates.msgTemplateOverstay;
      form.value.msgTemplateReminder = data.msgTemplateReminder || defaultTemplates.msgTemplateReminder;
      form.value.msgTemplateEviction = data.msgTemplateEviction || defaultTemplates.msgTemplateEviction;
      form.value.msgTemplateCheckIn = data.msgTemplateCheckIn || defaultTemplates.msgTemplateCheckIn;
      form.value.msgTemplatePromo = data.msgTemplatePromo || defaultTemplates.msgTemplatePromo;

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
  if (form.value.baseFontSize < 1) {
    form.value.baseFontSize = 1;
  }
  saving.value = true;
  try {
    await fetch('http://localhost:3001/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });
    alert('Pengaturan Tampilan berhasil disimpan!');
    // Update local CSS variable immediately with 0.75 scaling logic
    const scaledRoot = form.value.baseFontSize / 0.75;
    document.documentElement.style.setProperty('--base-font-size', `${scaledRoot}px`);
    if (form.value.appName) {
      document.title = form.value.appName;
      window.location.reload();
    }
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

const fetchAuditLogs = async (page = 1) => {
  pendingAudit.value = true;
  auditPage.value = page;
  try {
    const res = await fetch(`http://localhost:3001/api/audit?pin=${pagePin.value}&page=${page}&limit=${auditLimit.value}&search=${encodeURIComponent(auditSearch.value)}`);
    if (res.ok) {
      const data = await res.json();
      auditLogs.value = data.logs;
      auditTotalPages.value = data.totalPages;
    }
  } catch (err) {
    console.error(err);
  }
  pendingAudit.value = false;
};

const authenticatePage = async () => {
  pageAuthenticating.value = true;
  try {
    const res = await fetch(`http://localhost:3001/api/audit?pin=${pagePin.value}`);
    if (res.ok) {
      await fetchAuditLogs(1);
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
