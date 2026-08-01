<template>
  <div>
    <h1 class="page-title">Data Penyewaan Kos</h1>
    
    <!-- Laporan & Export -->
    <div class="material-card" style="margin-bottom: 1.25rem;">
      <h3 style="margin-bottom: 0.625rem;">Laporan & Export</h3>
      
      <div style="display: flex; gap: 0.9375rem; align-items: center; margin-bottom: 0.9375rem;">
        <strong style="color: var(--text-main);">Laporan Penyewaan:</strong>
        <a href="http://localhost:3001/api/reports/renting?format=pdf" target="_blank"><button class="btn" style="background: #c62828; padding: 0.3125rem 0.9375rem; font-size: 1rem;">PDF</button></a>
        <a href="http://localhost:3001/api/reports/renting?format=excel" target="_blank"><button class="btn" style="background: #107c41; padding: 0.3125rem 0.9375rem; font-size: 1rem;">Excel</button></a>
        <a href="http://localhost:3001/api/reports/renting?format=word" target="_blank"><button class="btn" style="background: #2b579a; padding: 0.3125rem 0.9375rem; font-size: 1rem;">Word</button></a>
      </div>

      <div style="display: flex; gap: 0.9375rem; align-items: center;">
        <strong style="color: var(--text-main);">Laporan Keuangan:</strong>
        <select v-model="financialRange" class="input" style="width: auto; margin-bottom: 0; padding: 0.3125rem;">
          <option value="daily">Harian</option>
          <option value="weekly">Mingguan</option>
          <option value="monthly">Bulanan</option>
          <option value="quarterly">Kuartal</option>
          <option value="yearly">Tahunan</option>
          <option value="">Semua Waktu</option>
        </select>
        <a :href="'http://localhost:3001/api/reports/financial?range=' + financialRange + '&format=pdf'" target="_blank"><button class="btn" style="background: #c62828; padding: 0.3125rem 0.9375rem; font-size: 1rem;">PDF</button></a>
        <a :href="'http://localhost:3001/api/reports/financial?range=' + financialRange + '&format=excel'" target="_blank"><button class="btn" style="background: #107c41; padding: 0.3125rem 0.9375rem; font-size: 1rem;">Excel</button></a>
        <a :href="'http://localhost:3001/api/reports/financial?range=' + financialRange + '&format=word'" target="_blank"><button class="btn" style="background: #2b579a; padding: 0.3125rem 0.9375rem; font-size: 1rem;">Word</button></a>
      </div>
    </div>

    <!-- Main Content with Tabs -->
    <div class="material-card">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; gap: 0.9375rem;">
        <div style="display: flex; gap: 0.625rem; flex-wrap: wrap;">
          <button class="btn" :style="activeTab === 'Aktif' ? 'background: var(--primary-color);' : 'background: #e0e0e0; color: #333;'" @click="activeTab = 'Aktif'">Penyewaan Aktif</button>
          <button class="btn" :style="activeTab === 'Historikal' ? 'background: var(--primary-color);' : 'background: #e0e0e0; color: #333;'" @click="activeTab = 'Historikal'">Historikal</button>
        </div>
        <button class="btn" style="background: var(--primary-color); padding: 0.5rem 1.25rem; font-weight: 500;" @click="router.push('/')">+ Penyewaan Baru</button>
      </div>

      <div style="display: flex; gap: 0.9375rem; flex-wrap: wrap; margin-bottom: 1.25rem; align-items: center;">
        <input type="text" v-model="searchTrx" class="input" placeholder="Cari Transaction ID atau Nama..." style="flex: 1; min-width: 12.5rem; margin-bottom: 0;" />
        <div style="display: flex; gap: 0.625rem; align-items: center;">
          <strong>Urut Cepat:</strong>
          <button class="btn" style="background: #eee; color: #333; padding: 0.3125rem 0.625rem; font-size: 1rem;" @click="sortBy('expectedReturnDate'); sortDesc = false;">Tenggat</button>
          <button class="btn" style="background: #eee; color: #333; padding: 0.3125rem 0.625rem; font-size: 1rem;" @click="sortBy('createdAt'); sortDesc = true;">Tgl Pembuatan</button>
          <button class="btn" style="background: #eee; color: #333; padding: 0.3125rem 0.625rem; font-size: 1rem;" @click="sortBy('roomId'); sortDesc = false;">Room</button>
        </div>
      </div>

      <div v-if="pending">Memuat...</div>
      <div v-else style="overflow-x: auto; width: 100%;">
        <table class="table">
        <thead>
          <tr>
            <th @click="sortBy('transactionId')" style="cursor: pointer;">TRX ID <span v-if="sortKey === 'transactionId'">{{ sortDesc ? '↓' : '↑' }}</span></th>
            <th @click="sortBy('createdAt')" style="cursor: pointer;">Tgl. Pembuatan <span v-if="sortKey === 'createdAt'">{{ sortDesc ? '↓' : '↑' }}</span></th>
            <th @click="sortBy('customerIds')" style="cursor: pointer;">Penyewa <span v-if="sortKey === 'customerIds'">{{ sortDesc ? '↓' : '↑' }}</span></th>
            <th @click="sortBy('roomId')" style="cursor: pointer;">Room <span v-if="sortKey === 'roomId'">{{ sortDesc ? '↓' : '↑' }}</span></th>
            <th @click="sortBy('rentalType')" style="cursor: pointer;">Jenis Sewa <span v-if="sortKey === 'rentalType'">{{ sortDesc ? '↓' : '↑' }}</span></th>
            <th @click="sortBy('expectedReturnDate')" style="cursor: pointer;">Tenggat Bayar / Keluar <span v-if="sortKey === 'expectedReturnDate'">{{ sortDesc ? '↓' : '↑' }}</span></th>
            <th @click="sortBy('uiStatus')" style="cursor: pointer;">Status <span v-if="sortKey === 'uiStatus'">{{ sortDesc ? '↓' : '↑' }}</span></th>
            <th>Keuangan</th>
            <th>Kwitansi</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in paginatedRentals" :key="r._id">
            <td><strong>{{ r.transactionId }}</strong></td>
            <td>{{ r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID') : new Date(r.rentalStartTime).toLocaleDateString('id-ID') }}</td>
            <td>
              <div v-for="c in r.customerIds" :key="c._id" style="font-weight: 500;">
                {{ c.name }} <br><span style="font-size: 0.85em; color: #666;">{{ c.telephone }}</span>
              </div>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 0.625rem;">
                <img v-if="r.roomId?.imageUrl || r.roomId?.roomTypeId?.imageUrl" :src="'http://localhost:3001' + (r.roomId?.imageUrl || r.roomId?.roomTypeId?.imageUrl)" style="width: 2.5rem; height: 2.5rem; border-radius: 0.25rem; object-fit: cover;" />
                <div v-else style="width: 2.5rem; height: 2.5rem; background: #eee; border-radius: 0.25rem; display: flex; align-items: center; justify-content: center; font-size: 0.7em; color: #999;">No Img</div>
                <div>
                  <strong>{{ r.roomId?.roomNumber || '?' }}</strong><br>
                  <span style="font-size: 0.85em; color: #666;">{{ r.roomId?.roomTypeId?.name }}</span>
                </div>
              </div>
            </td>
            <td>
              <span :style="r.rentalType === 'Long-Stay' ? 'color: var(--primary-color); font-weight: bold;' : 'color: #d35400; font-weight: bold;'">
                {{ r.rentalType === 'Long-Stay' ? 'Bulanan' : 'Harian' }}
              </span>
            </td>
            <td>
              <div v-if="r.rentalType === 'Long-Stay'">
                <span v-if="r.paidUntil">Terbayar S/D:<br>{{ new Date(r.paidUntil).toLocaleDateString('id-ID') }}</span>
                <span v-else style="color: red;">Belum Ada Pembayaran</span>
              </div>
              <div v-else>
                <span>Keluar:<br>{{ new Date(r.expectedReturnDate).toLocaleDateString('id-ID') }}</span>
              </div>
            </td>
            <td>
              <span :style="(r.currentStatusText === 'Overstay' || r.uiStatus === 'Overstay') ? 'color: var(--danger); font-weight: bold;' : (r.tunggakanAmount === 0 && r.uiStatus !== 'Booked' ? 'color: var(--success); font-weight: bold;' : 'color: #f39c12; font-weight: bold;')">
                {{ r.currentStatusText || translateStatus(r.uiStatus) }}
              </span>
            </td>
            <td>
              <div style="font-size: 0.9em; min-width: 8.125rem;">
                <div style="margin-bottom: 0.125rem;">Terbayar: <strong style="color: #27ae60;">Rp {{ r.totalPaid?.toLocaleString('id-ID') || 0 }}</strong></div>
                <div v-if="r.tunggakanAmount > 0" style="margin-bottom: 0.125rem;">Tunggakan: <strong style="color: #c0392b;">Rp {{ r.tunggakanAmount?.toLocaleString('id-ID') }}</strong></div>
                <div v-if="r.saldoMengendap > 0" style="margin-bottom: 0.125rem;">Saldo: <strong style="color: #2980b9;">Rp {{ r.saldoMengendap?.toLocaleString('id-ID') }}</strong></div>
              </div>
            </td>
            <td style="vertical-align: top; padding-top: 0.9375rem;">
              <select v-if="r.uiStatus === 'Active' || r.uiStatus === 'Completed' || r.uiStatus === 'Perlu Pengusiran' || (r.payments && r.payments.length > 0)" class="input" style="width: 100%; min-width: 8.125rem; padding: 0.5rem 0.75rem; font-size: 1em; margin-bottom: 0; cursor: pointer; background-color: #2980b9; color: white; border: none; border-radius: 0.25rem; font-weight: 500;" @change="handleKwitansiAction($event, r)">
                <option value="" disabled selected hidden style="background: white; color: #333;">Aksi Kwitansi</option>
                <option value="pdf_deposit" style="background: white; color: #333;">PDF {{ r.rentalType === 'Long-Stay' ? 'Pembayaran' : 'Deposit' }}</option>
                <option v-if="r.uiStatus === 'Completed'" value="pdf_lunas" style="background: white; color: #333;">PDF Akhir/Lunas</option>
                <option value="wa" style="background: white; color: #333;">Kirim WA</option>
                <option v-if="r.customerIds && r.customerIds[0]?.email && r.uiStatus !== 'Cancelled'" value="email" style="background: white; color: #333;">Kirim Email</option>
                <option v-if="r.uiStatus === 'Perlu Pengusiran'" value="wa_pengusiran" style="background: white; color: #333;">WA Pengusiran</option>
                <option v-if="r.uiStatus === 'Perlu Pengusiran'" value="email_pengusiran" style="background: white; color: #333;">Email Pengusiran</option>
              </select>
              <span v-else style="color: var(--text-muted); font-size: 0.8em;">-</span>
            </td>
            <td style="vertical-align: top; padding-top: 0.9375rem;">
              <div v-if="['Active', 'Booked', 'Perlu Pengusiran'].includes(r.uiStatus)" style="display: flex; flex-direction: column; gap: 0.3125rem;">
                <button v-if="r.uiStatus === 'Perlu Pengusiran'" class="btn" style="background: var(--success); padding: 0.375rem 0.75rem; font-size: 1em; width: 100%; min-width: 8.125rem; text-align: center; white-space: nowrap;" @click="resolveEviction(r._id)">Selesai</button>

                <button v-if="r.uiStatus === 'Booked' || (r.rentalType === 'Long-Stay' && r.uiStatus === 'Active')" class="btn" style="background: #f39c12; padding: 0.375rem 0.75rem; font-size: 1em; width: 100%; min-width: 8.125rem; text-align: center; white-space: nowrap;" @click="payRent(r)">
                  {{ r.rentalType === 'Long-Stay' ? 'Bayar Sewa' : 'Bayar Sisa/DP' }}
                </button>
                <button v-if="r.uiStatus === 'Booked'" class="btn" style="background: #3498db; color: white; padding: 0.375rem 0.75rem; font-size: 1em; width: 100%; min-width: 8.125rem; text-align: center; white-space: nowrap; font-weight: bold;" @click="checkIn(r._id)">Check-In</button>
                <button v-if="r.uiStatus === 'Active'" class="btn" style="background: var(--danger); padding: 0.375rem 0.75rem; font-size: 1em; width: 100%; min-width: 8.125rem; text-align: center; white-space: nowrap;" @click="endStay(r._id)">Akhiri Sewa</button>

                <button v-if="r.uiStatus === 'Booked'" class="btn" style="background: #25D366; padding: 0.375rem 0.75rem; font-size: 1em; width: 100%; min-width: 8.125rem; text-align: center; white-space: nowrap;" @click="sendWaWarningDeposit(r)">WA Reminder</button>
                <button v-if="r.uiStatus === 'Active'" class="btn" style="background: #25D366; padding: 0.375rem 0.75rem; font-size: 1em; width: 100%; min-width: 8.125rem; text-align: center; white-space: nowrap;" @click="sendWaReminderReturn(r)">WA Reminder</button>

                <button class="btn" style="background: #888; padding: 0.375rem 0.75rem; font-size: 1em; width: 100%; min-width: 8.125rem; text-align: center; white-space: nowrap;" @click="cancelRental(r._id)">Batal</button>
              </div>
              <span v-else style="color: var(--text-muted); font-size: 0.8em;">-</span>
            </td>
          </tr>
          <tr v-if="displayedRentals.length === 0">
            <td colspan="10" style="text-align: center; padding: 1.25rem;">Tidak ada penyewaan ditemukan</td>
          </tr>
        </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.9375rem;">
        <div style="font-size: 0.9em;">
          Tampilkan: 
          <select v-model="itemsPerPage" class="input" style="width: auto; padding: 0.125rem 0.3125rem; margin: 0; display: inline-block;" @change="currentPage = 1">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
        <div style="display: flex; gap: 0.625rem; align-items: center; font-size: 0.9em;">
          <button class="btn" :disabled="currentPage === 1" @click="currentPage--" style="background: #e0e0e0; color: #333; padding: 0.125rem 0.625rem;">&lt; Prev</button>
          <span>Halaman {{ currentPage }} dari {{ totalPages || 1 }}</span>
          <button class="btn" :disabled="currentPage >= totalPages || totalPages === 0" @click="currentPage++" style="background: #e0e0e0; color: #333; padding: 0.125rem 0.625rem;">Next &gt;</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const rentals = ref<any[]>([]);
const pending = ref(true);
const financialRange = ref('monthly');
const activeTab = ref('Aktif');
const searchTrx = ref((route.query.search as string) || '');
const appConfig = ref<any>({});

const fetchData = async () => {
  pending.value = true;
  try {
    const res = await fetch('http://localhost:3001/api/rentals');
    rentals.value = await res.json();
    
    const cfgRes = await fetch('http://localhost:3001/api/config');
    appConfig.value = await cfgRes.json();
  } catch (err) {
    console.error(err);
  }
  pending.value = false;
};

const sortKey = ref('expectedReturnDate');
const sortDesc = ref(false);

const currentPage = ref(1);
const itemsPerPage = ref(10);

const sortBy = (key: string) => {
  if (sortKey.value === key) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortKey.value = key;
    sortDesc.value = false;
  }
};

const displayedRentals = computed(() => {
  let filtered = rentals.value;
  
  if (activeTab.value === 'Aktif') {
    filtered = filtered.filter(r => ['Active', 'Booked', 'Perlu Pengusiran'].includes(r.uiStatus || r.status));
  } else {
    filtered = filtered.filter(r => r.status === 'Completed' || r.status === 'Cancelled');
  }

  if (searchTrx.value) {
    const q = searchTrx.value.toLowerCase();
    filtered = filtered.filter(r => {
      if (r.transactionId.toLowerCase().includes(q)) return true;
      if (r.customerIds && r.customerIds.some((c: any) => c.name.toLowerCase().includes(q))) return true;
      return false;
    });
  }

  filtered.sort((a, b) => {
    let valA = a[sortKey.value];
    let valB = b[sortKey.value];
    
    if (sortKey.value === 'customerIds') {
      valA = a.customerIds && a.customerIds[0] ? a.customerIds[0].name : '';
      valB = b.customerIds && b.customerIds[0] ? b.customerIds[0].name : '';
    } else if (sortKey.value === 'roomId') {
      valA = a.roomId?.roomNumber || '';
      valB = b.roomId?.roomNumber || '';
    } else if (sortKey.value === 'createdAt') {
      valA = new Date(a.createdAt || a.rentalStartTime).getTime();
      valB = new Date(b.createdAt || b.rentalStartTime).getTime();
    } else if (sortKey.value === 'expectedReturnDate') {
      valA = new Date(a.expectedReturnDate || a.paidUntil || 0).getTime();
      valB = new Date(b.expectedReturnDate || b.paidUntil || 0).getTime();
    }
    
    if (valA < valB) return sortDesc.value ? 1 : -1;
    if (valA > valB) return sortDesc.value ? -1 : 1;
    
    return 0;
  });

  return filtered;
});

const totalPages = computed(() => Math.ceil(displayedRentals.value.length / itemsPerPage.value));

const paginatedRentals = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return displayedRentals.value.slice(start, start + itemsPerPage.value);
});

const translateStatus = (status: string) => {
  const map: Record<string, string> = {
    'Active': 'Disewa (Aktif)',
    'Booked': 'Dipesan (Booked)',
    'Completed': 'Selesai',
    'Cancelled': 'Dibatalkan'
  };
  return map[status] || status;
};

const endStay = async (rentalId: string) => {
  if (confirm('Akhiri masa sewa dan kosongkan room? Room akan diubah statusnya menjadi Cleaning.')) {
    try {
      const res = await fetch(`http://localhost:3001/api/rentals/${rentalId}/end-stay`, {
        method: 'POST'
      });
      const data = await res.json();
      if(data.error) throw new Error(data.error);

      let msg = `Sewa berhasil diakhiri!\n\n`;
      msg += `Tagihan Sisa: Rp ${data.amountToPay || 0}\n`;
      alert(msg);
      // Auto open lunas receipt
      window.open(`http://localhost:3001/receipts/Lunas_${data.transactionId}.pdf`, '_blank');
      fetchData();
    } catch (err: any) {
      alert('Gagal memproses pengakhiran sewa: ' + err.message);
    }
  }
};

const cancelRental = async (rentalId: string) => {
  if (confirm('Anda yakin ingin membatalkan penyewaan ini?')) {
    try {
      const res = await fetch(`http://localhost:3001/api/rentals/${rentalId}/cancel`, { method: 'POST' });
      const data = await res.json();
      if(data.error) throw new Error(data.error);
      fetchData();
    } catch (err: any) {
      alert('Gagal membatalkan: ' + err.message);
    }
  }
};

const payRent = async (rental: any) => {
  const rtPrice = rental.roomId?.roomTypeId?.price || 0;
  
  const amountStr = prompt(`Masukkan jumlah yang dibayar\n(Biaya sewa normal: Rp ${rtPrice}):`);
  if (!amountStr) return;

  const amount = parseInt(amountStr, 10);
  if (isNaN(amount) || amount <= 0) {
    alert('Jumlah tidak valid.');
    return;
  }

  try {
    const res = await fetch(`http://localhost:3001/api/rentals/${rental._id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    const data = await res.json();
    if(data.error) throw new Error(data.error);
    alert('Pembayaran berhasil dicatat!');
    
    // Auto open receipt (last payment)
    const lastPay = data.payments[data.payments.length - 1];
    if (lastPay) {
      window.open(`http://localhost:3001/receipts/Payment_${data.transactionId}_${lastPay.receiptId}.pdf`, '_blank');
    }

    fetchData();
  } catch (err: any) {
    alert('Gagal memproses pembayaran: ' + err.message);
  }
};

const openReceipt = (rental: any, type: string) => {
  window.open(`http://localhost:3001/api/receipts/${type}/${rental.transactionId}`, '_blank');
};

const sendWaReceipt = (r: any) => {
  if(!r.customerIds || r.customerIds.length === 0 || !r.customerIds[0].telephone) return alert('Nomor HP pelanggan utama tidak tersedia');
  const cust = r.customerIds[0];
  let num = cust.telephone.replace(/[^0-9]/g, '');
  if (num.startsWith('0')) num = '62' + num.substring(1);

  const type = r.status === 'Completed' ? 'Lunas' : 'Deposit';
  let text = '';
  if (appConfig.value?.waKwitansiType === 'Link') {
    text = `Halo ${cust.name}, ini link kwitansi ${type} sewa kos Anda:\n\nhttp://localhost:3001/api/receipts/${type}/${r.transactionId}`;
  } else {
    text = `Halo ${cust.name},\nBerikut ringkasan Kwitansi ${type} penyewaan Kos Anda:\n\n` +
           `ID Transaksi: ${r.transactionId}\n` +
           `Room: ${r.roomId?.roomNumber}\n` +
           (r.rentalType === 'Long-Stay' ? `Terbayar S/D: ${new Date(r.paidUntil).toLocaleDateString('id-ID')}\n` : '');
    text += `\nTerima kasih telah menyewa di Kosan Fio!`;
  }
  
  const linkType = appConfig.value?.waLinkType || 'App';
  const url = linkType === 'Web' 
    ? `https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(text)}`
    : `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

const checkIn = async (rentalId: string) => {
  if (confirm('Konfirmasi bahwa penyewa telah hadir dan setuju untuk Check-In sekarang?')) {
    try {
      const res = await fetch(`http://localhost:3001/api/rentals/${rentalId}/check-in`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert('Check-In Berhasil!');
        fetchData();
      } else {
        alert('Gagal Check-In: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  }
};

const parseWaTemplate = (template: string, custName: string, roomNum: string, dateStr: string, nominal: string) => {
  if (!template) return '';
  return template
    .replace(/\{\{nama\}\}/g, custName)
    .replace(/\{\{kamar\}\}/g, roomNum)
    .replace(/\{\{tanggal\}\}/g, dateStr)
    .replace(/\{\{nominal\}\}/g, nominal);
};

const sendWaWarningDeposit = (r: any) => {
  if(!r.customerIds || r.customerIds.length === 0 || !r.customerIds[0].telephone) return alert('Nomor HP pelanggan utama tidak tersedia');
  const cust = r.customerIds[0];
  let num = cust.telephone.replace(/[^0-9]/g, '');
  if (num.startsWith('0')) num = '62' + num.substring(1);

  const rawTemplate = appConfig.value?.msgTemplateBooked || 'Halo {{nama}},\n\nKami mengingatkan bahwa Anda memiliki booking untuk kamar {{kamar}} yang belum lunas/DP. Mohon segera diselesaikan sebesar Rp {{nominal}}.\n\nTerima kasih.';
  const text = parseWaTemplate(rawTemplate, cust.name, r.roomId?.roomNumber || '', '', String(r.tunggakanAmount || 0));

  const linkType = appConfig.value?.waLinkType || 'App';
  const url = linkType === 'Web' 
    ? `https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(text)}`
    : `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

const sendWaReminderReturn = (r: any) => {
  if(!r.customerIds || r.customerIds.length === 0 || !r.customerIds[0].telephone) return alert('Nomor HP pelanggan utama tidak tersedia');
  const cust = r.customerIds[0];
  let num = cust.telephone.replace(/[^0-9]/g, '');
  if (num.startsWith('0')) num = '62' + num.substring(1);

  const dateStr = r.rentalType === 'Long-Stay' 
    ? new Date(r.paidUntil).toLocaleDateString('id-ID') 
    : new Date(r.expectedReturnDate).toLocaleDateString('id-ID');

  let rawTemplate = '';
  if (r.tunggakanAmount > 0) {
    rawTemplate = appConfig.value?.msgTemplateOverdue || 'Halo {{nama}},\n\nKami mengingatkan bahwa tagihan sewa kamar {{kamar}} Anda telah melewati batas waktu (jatuh tempo pada {{tanggal}}). Mohon segera melunasi tunggakan sebesar Rp {{nominal}}.\n\nTerima kasih.';
  } else {
    // 1, 3, 7 days before payment or just generic
    rawTemplate = appConfig.value?.msgTemplateReminder || 'Halo {{nama}},\n\nKami mengingatkan bahwa tagihan sewa kamar {{kamar}} Anda akan jatuh tempo pada {{tanggal}}.\nMohon persiapkan pembayaran Anda atau silakan konfirmasi jika ingin check-out.\n\nTerima kasih.';
  }

  const text = parseWaTemplate(rawTemplate, cust.name, r.roomId?.roomNumber || '', dateStr, String(r.tunggakanAmount || 0));

  const linkType = appConfig.value?.waLinkType || 'App';
  const url = linkType === 'Web' 
    ? `https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(text)}`
    : `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

const emailReceipt = async (rentalId: string, type: 'Deposit' | 'Lunas') => {
  try {
    alert('Mengirim email... Mohon tunggu.');
    const res = await fetch(`http://localhost:3001/api/rentals/${rentalId}/email-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
    const data = await res.json();
    if(data.error) throw new Error(data.error);
    
    alert(`Email kwitansi berhasil dikirim!\nCek preview di: ${data.previewUrl}`);
    window.open(data.previewUrl, '_blank');
  } catch (err: any) {
    alert('Gagal mengirim email: ' + err.message);
  }
};

const handleKwitansiAction = (event: Event, r: any) => {
  const target = event.target as HTMLSelectElement;
  const action = target.value;
  
  if (action === 'pdf_deposit') {
    openReceipt(r, r.rentalType === 'Long-Stay' ? 'Payment' : 'Deposit');
  } else if (action === 'pdf_lunas') {
    openReceipt(r, 'Lunas');
  } else if (action === 'wa') {
    sendWaReceipt(r);
  } else if (action === 'email') {
    emailReceipt(r._id, r.status === 'Completed' ? 'Lunas' : 'Deposit');
  } else if (action === 'wa_pengusiran') {
    sendWaEviction(r);
  } else if (action === 'email_pengusiran') {
    emailEviction(r._id);
  }

  // Reset dropdown back to default placeholder
  target.value = '';
};

const resolveEviction = async (id: string) => {
  if (!confirm('Tandai masalah penyewaan ini sebagai Selesai?')) return;
  try {
    const res = await fetch(`http://localhost:3001/api/rentals/${id}/resolve-eviction`, { method: 'POST' });
    if (!res.ok) throw new Error('Gagal menyelesaikan pengusiran');
    fetchData();
  } catch (err: any) {
    alert(err.message);
  }
};

const sendWaEviction = (r: any) => {
  if(!r.customerIds || r.customerIds.length === 0 || !r.customerIds[0].telephone) return alert('Nomor HP pelanggan utama tidak tersedia');
  const cust = r.customerIds[0];
  let num = cust.telephone.replace(/[^0-9]/g, '');
  if (num.startsWith('0')) num = '62' + num.substring(1);

  const rawTemplate = appConfig.value?.msgTemplateEviction || 'PEMBERITAHUAN PENTING\n\nHalo {{nama}},\nKami memberitahukan bahwa masa sewa Anda di kamar {{kamar}} telah melewati batas waktu toleransi.\nStatus penyewaan Anda saat ini adalah PERLU PENGUSIRAN. Mohon segera kemasi barang Anda secepatnya.\n\nTerima kasih.';
  const text = parseWaTemplate(rawTemplate, cust.name, r.roomId?.roomNumber || '', '', String(r.tunggakanAmount || 0));

  const linkType = appConfig.value?.waLinkType || 'App';
  const url = linkType === 'Web' 
    ? `https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(text)}`
    : `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

const emailEviction = async (rentalId: string) => {
  try {
    alert('Mengirim email... Mohon tunggu.');
    const res = await fetch(`http://localhost:3001/api/rentals/${rentalId}/email-eviction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if(data.error) throw new Error(data.error);
    
    alert(`Email Peringatan Pengusiran berhasil dikirim!\nCek preview di: ${data.previewUrl}`);
    window.open(data.previewUrl, '_blank');
  } catch (err: any) {
    alert('Gagal mengirim email: ' + err.message);
  }
};

onMounted(fetchData);
</script>
<style scoped>label { font-size: 0.9em; font-weight: 500; display: block; margin-bottom: 0.3125rem; color: var(--text-muted); }</style>
