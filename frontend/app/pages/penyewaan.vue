<template>
  <div>
    <h1 class="page-title">Data Penyewaan</h1>
    
    <!-- Laporan & Export -->
    <div class="material-card" style="margin-bottom: 20px;">
      <h3 style="margin-bottom: 10px;">Laporan & Export</h3>
      
      <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 15px;">
        <strong style="color: var(--text-main);">Laporan Penyewaan:</strong>
        <a href="http://localhost:3001/api/reports/renting?format=pdf" target="_blank"><button class="btn" style="background: #c62828; padding: 5px 15px; font-size: 1rem;">PDF</button></a>
        <a href="http://localhost:3001/api/reports/renting?format=excel" target="_blank"><button class="btn" style="background: #107c41; padding: 5px 15px; font-size: 1rem;">Excel</button></a>
        <a href="http://localhost:3001/api/reports/renting?format=word" target="_blank"><button class="btn" style="background: #2b579a; padding: 5px 15px; font-size: 1rem;">Word</button></a>
      </div>

      <div style="display: flex; gap: 15px; align-items: center;">
        <strong style="color: var(--text-main);">Laporan Keuangan:</strong>
        <select v-model="financialRange" class="input" style="width: auto; margin-bottom: 0; padding: 5px;">
          <option value="daily">Harian</option>
          <option value="weekly">Mingguan</option>
          <option value="monthly">Bulanan</option>
          <option value="quarterly">Kuartal</option>
          <option value="yearly">Tahunan</option>
          <option value="">Semua Waktu</option>
        </select>
        <a :href="'http://localhost:3001/api/reports/financial?range=' + financialRange + '&format=pdf'" target="_blank"><button class="btn" style="background: #c62828; padding: 5px 15px; font-size: 1rem;">PDF</button></a>
        <a :href="'http://localhost:3001/api/reports/financial?range=' + financialRange + '&format=excel'" target="_blank"><button class="btn" style="background: #107c41; padding: 5px 15px; font-size: 1rem;">Excel</button></a>
        <a :href="'http://localhost:3001/api/reports/financial?range=' + financialRange + '&format=word'" target="_blank"><button class="btn" style="background: #2b579a; padding: 5px 15px; font-size: 1rem;">Word</button></a>
      </div>
    </div>

    <!-- Main Content with Tabs -->
    <div class="material-card">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 15px;">
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="btn" :style="activeTab === 'Aktif' ? 'background: var(--primary-color);' : 'background: #e0e0e0; color: #333;'" @click="activeTab = 'Aktif'">Penyewaan Aktif</button>
          <button class="btn" :style="activeTab === 'Historikal' ? 'background: var(--primary-color);' : 'background: #e0e0e0; color: #333;'" @click="activeTab = 'Historikal'">Historikal</button>
        </div>
        <button class="btn" style="background: var(--primary-color); padding: 8px 20px; font-weight: 500;" @click="router.push('/')">+ Penyewaan Cepat</button>
      </div>

      <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 20px; align-items: center;">
        <input type="text" v-model="searchTrx" class="input" placeholder="Cari berdasarkan Transaction ID (TRX-)..." style="flex: 1; min-width: 200px; margin-bottom: 0;" />
        <div style="display: flex; gap: 10px; align-items: center;">
          <strong>Urut Cepat:</strong>
          <button class="btn" style="background: #eee; color: #333; padding: 5px 10px; font-size: 1rem;" @click="sortBy('expectedReturnDate'); sortDesc = false;">Jatuh Tempo</button>
          <button class="btn" style="background: #eee; color: #333; padding: 5px 10px; font-size: 1rem;" @click="sortBy('createdAt'); sortDesc = true;">Tgl Pembuatan</button>
          <button class="btn" style="background: #eee; color: #333; padding: 5px 10px; font-size: 1rem;" @click="sortBy('kebayaId'); sortDesc = false;">Room</button>
        </div>
      </div>

      <div v-if="pending">Memuat...</div>
      <div v-else style="overflow-x: auto; width: 100%;">
        <table class="table">
        <thead>
          <tr>
            <th @click="sortBy('transactionId')" style="cursor: pointer;">TRX ID <span v-if="sortKey === 'transactionId'">{{ sortDesc ? '↓' : '↑' }}</span></th>
            <th @click="sortBy('createdAt')" style="cursor: pointer;">Tgl. Pembuatan <span v-if="sortKey === 'createdAt'">{{ sortDesc ? '↓' : '↑' }}</span></th>
            <th @click="sortBy('customerId')" style="cursor: pointer;">Pelanggan <span v-if="sortKey === 'customerId'">{{ sortDesc ? '↓' : '↑' }}</span></th>
            <th @click="sortBy('kebayaId')" style="cursor: pointer;">Room <span v-if="sortKey === 'kebayaId'">{{ sortDesc ? '↓' : '↑' }}</span></th>
            <th @click="sortBy('expectedReturnDate')" style="cursor: pointer;">Jatuh Tempo <span v-if="sortKey === 'expectedReturnDate'">{{ sortDesc ? '↓' : '↑' }}</span></th>
            <th @click="sortBy('status')" style="cursor: pointer;">Status / Deposit <span v-if="sortKey === 'status'">{{ sortDesc ? '↓' : '↑' }}</span></th>
            <th>Kwitansi</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in paginatedRentals" :key="r._id">
            <td><strong>{{ r.transactionId }}</strong></td>
            <td>{{ r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID') : new Date(r.rentalStartTime).toLocaleDateString('id-ID') }}</td>
            <td>{{ r.customerId?.name || 'Unknown' }}</td>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <img v-if="r.kebayaId?.imageUrl" :src="'http://localhost:3001' + r.kebayaId.imageUrl" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;" />
                <div v-else style="width: 40px; height: 40px; background: #eee; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.7em; color: #999;">No Img</div>
                {{ r.kebayaId?.tipeKamar }} ({{ r.kebayaId?.fasilitas }})
              </div>
            </td>
            <td>
              {{ new Date(r.expectedReturnDate).toLocaleDateString('id-ID') }}
              <span v-if="r.status === 'Active' && new Date(r.expectedReturnDate) < new Date()" style="color: red; font-weight: bold; display: block;">[TELAT]</span>
            </td>
            <td>
              <span v-if="['Active', 'Booked', 'Ready'].includes(r.status)" :style="r.depositPaid ? 'color: var(--success); font-weight: bold;' : 'color: #f39c12; font-weight: bold;'">
                {{ translateStatus(r.status) }}
                <span v-if="!r.depositPaid">
                  | 
                  <span v-if="r.payments && r.payments.length > 0 && r.payments.reduce((a,p)=>a+p.amount,0) > 0" style="color: #f39c12;">Deposit Parsial</span>
                  <span v-else style="color: var(--danger);">Belum Deposit</span>
                </span>
              </span>
              <span v-else :style="r.status === 'Completed' ? 'color: var(--success); font-weight: bold;' : 'color: var(--danger); font-weight: bold;'">
                {{ translateStatus(r.status).toUpperCase() }}
              </span>
            </td>
            <td style="vertical-align: top; padding-top: 15px;">
              <select v-if="r.status === 'Active' || r.status === 'Completed' || (r.payments && r.payments.length > 0)" class="input" style="width: 100%; min-width: 130px; padding: 8px 12px; font-size: 1em; margin-bottom: 0; cursor: pointer; background-color: #2980b9; color: white; border: none; border-radius: 4px; font-weight: 500;" @change="handleKwitansiAction($event, r)">
                <option value="" disabled selected hidden style="background: white; color: #333;">Aksi</option>
                <option value="pdf_deposit" style="background: white; color: #333;">PDF Deposit</option>
                <option v-if="r.status === 'Completed'" value="pdf_lunas" style="background: white; color: #333;">PDF Lunas</option>
                <option value="wa" style="background: white; color: #333;">Kirim WA</option>
                <option v-if="r.customerId?.email && r.status !== 'Cancelled'" value="email" style="background: white; color: #333;">Kirim Email</option>
              </select>
              <span v-else style="color: var(--text-muted); font-size: 0.8em;">-</span>
            </td>
            <td style="vertical-align: top; padding-top: 15px;">
              <strong v-if="['Booked', 'Ready'].includes(r.status) && new Date(r.rentalStartTime).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)" style="color: orange; display: block; font-size: 0.85rem; margin-bottom: 10px;">TELAT PICKUP</strong>
              <div v-if="['Active', 'Booked', 'Ready'].includes(r.status)" style="display: flex; flex-direction: column; gap: 5px;">
                <button v-if="r.status === 'Booked' && !r.depositPaid" class="btn" style="background: #f39c12; padding: 6px 12px; font-size: 1em; width: 100%; min-width: 130px; text-align: center; white-space: nowrap;" @click="payDeposit(r)">Bayar Deposit</button>
                <button v-if="r.status === 'Ready' && r.depositPaid" class="btn" style="background: #27ae60; padding: 6px 12px; font-size: 1em; width: 100%; min-width: 130px; text-align: center; white-space: nowrap;" @click="pickupKebaya(r._id)">Pickup</button>
                <button v-if="r.status === 'Active'" class="btn" style="background: var(--success); padding: 6px 12px; font-size: 1em; width: 100%; min-width: 130px; text-align: center; white-space: nowrap;" @click="returnKebaya(r._id)">Dikembalikan</button>

                <button v-if="r.status === 'Booked' && !r.depositPaid" class="btn" style="background: #25D366; padding: 6px 12px; font-size: 1em; width: 100%; min-width: 130px; text-align: center; white-space: nowrap;" @click="sendWaWarningDeposit(r)">WA Reminder</button>
                <button v-if="r.status === 'Ready' && r.depositPaid" class="btn" style="background: #25D366; padding: 6px 12px; font-size: 1em; width: 100%; min-width: 130px; text-align: center; white-space: nowrap;" @click="sendWaReminderPickup(r)">WA Reminder</button>
                <button v-if="r.status === 'Active'" class="btn" style="background: #25D366; padding: 6px 12px; font-size: 1em; width: 100%; min-width: 130px; text-align: center; white-space: nowrap;" @click="sendWaReminderReturn(r)">WA Reminder</button>

                <button class="btn" style="background: var(--danger); padding: 6px 12px; font-size: 1em; width: 100%; min-width: 130px; text-align: center; white-space: nowrap;" @click="cancelRental(r._id)">Batal</button>
              </div>
              <span v-else style="color: var(--text-muted); font-size: 0.8em;">-</span>
            </td>
          </tr>
          <tr v-if="displayedRentals.length === 0">
            <td colspan="7" style="text-align: center; padding: 20px;">Tidak ada penyewaan ditemukan</td>
          </tr>
        </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
        <div style="font-size: 0.9em;">
          Tampilkan: 
          <select v-model="itemsPerPage" class="input" style="width: auto; padding: 2px 5px; margin: 0; display: inline-block;" @change="currentPage = 1">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
        <div style="display: flex; gap: 10px; align-items: center; font-size: 0.9em;">
          <button class="btn" :disabled="currentPage === 1" @click="currentPage--" style="background: #e0e0e0; color: #333; padding: 2px 10px;">&lt; Prev</button>
          <span>Halaman {{ currentPage }} dari {{ totalPages || 1 }}</span>
          <button class="btn" :disabled="currentPage >= totalPages || totalPages === 0" @click="currentPage++" style="background: #e0e0e0; color: #333; padding: 2px 10px;">Next &gt;</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const rentals = ref<any[]>([]);
const pending = ref(true);
const financialRange = ref('monthly');
const activeTab = ref('Aktif');
const searchTrx = ref('');
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
    filtered = filtered.filter(r => ['Active', 'Booked', 'Ready'].includes(r.status));
  } else {
    filtered = filtered.filter(r => r.status === 'Completed' || r.status === 'Cancelled');
  }

  if (searchTrx.value) {
    const q = searchTrx.value.toLowerCase();
    filtered = filtered.filter(r => r.transactionId.toLowerCase().includes(q));
  }

  filtered.sort((a, b) => {
    let valA = a[sortKey.value];
    let valB = b[sortKey.value];
    
    if (sortKey.value === 'customerId') {
      valA = a.customerId?.name || '';
      valB = b.customerId?.name || '';
    } else if (sortKey.value === 'kebayaId') {
      valA = a.kebayaId?.tipeKamar || '';
      valB = b.kebayaId?.tipeKamar || '';
    } else if (sortKey.value === 'createdAt') {
      valA = new Date(a.createdAt || a.rentalStartTime).getTime();
      valB = new Date(b.createdAt || b.rentalStartTime).getTime();
    } else if (sortKey.value === 'expectedReturnDate') {
      valA = new Date(a.expectedReturnDate).getTime();
      valB = new Date(b.expectedReturnDate).getTime();
    }
    
    if (valA < valB) return sortDesc.value ? 1 : -1;
    if (valA > valB) return sortDesc.value ? -1 : 1;
    
    // Secondary sort by createdAt (if primary is not createdAt)
    if (sortKey.value !== 'createdAt') {
      let tA = new Date(a.createdAt || a.rentalStartTime).getTime();
      let tB = new Date(b.createdAt || b.rentalStartTime).getTime();
      if (tA < tB) return 1; // Default descending for creation date as fallback
      if (tA > tB) return -1;
    }

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
    'Active': 'Disewa',
    'Ready': 'Siap Pickup',
    'Booked': 'Dipesan',
    'Completed': 'Selesai',
    'Cancelled': 'Dibatalkan'
  };
  return map[status] || status;
};

const returnKebaya = async (rentalId: string) => {
  if (confirm('Selesaikan penyewaan dan kembalikan room?')) {
    try {
      const res = await fetch(`http://localhost:3001/api/rentals/${rentalId}/return`, {
        method: 'POST'
      });
      const data = await res.json();
      if(data.error) throw new Error(data.error);

      let msg = `Room berhasil dikembalikan!\n\n`;
      msg += `Biaya Sewa Dasar: Rp ${data.basePay}\n`;
      if(data.penaltyPay > 0) {
        msg += `Biaya Denda Keterlambatan: Rp ${data.penaltyPay}\n`;
      }
      msg += `Deposit Dibayar: Rp ${data.depositAmount}\n`;
      msg += `\nTotal Tagihan Akhir: Rp ${data.total}`;
      
      alert(msg);
      // Auto open lunas receipt
      window.open(`http://localhost:3001/receipts/Lunas_${data.rental.transactionId}.pdf`, '_blank');
      fetchData();
    } catch (err: any) {
      alert('Gagal memproses pengembalian: ' + err.message);
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

const payDeposit = async (rental: any) => {
  const currentTotalPaid = rental.payments.reduce((acc: number, p: any) => acc + p.amount, 0);
  const remainingDeposit = rental.depositAmount - currentTotalPaid;

  const amountStr = prompt(`Masukkan jumlah deposit yang dibayar (Sisa yang harus dibayar: Rp ${remainingDeposit}):`, String(remainingDeposit));
  if (!amountStr) return;

  const amount = parseInt(amountStr, 10);
  if (isNaN(amount) || amount <= 0) {
    alert('Jumlah deposit tidak valid.');
    return;
  }

  try {
    const res = await fetch(`http://localhost:3001/api/rentals/${rental._id}/pay-deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    const data = await res.json();
    if(data.error) throw new Error(data.error);
    alert('Deposit berhasil ditambahkan!');
    fetchData();
  } catch (err: any) {
    alert('Gagal memproses deposit: ' + err.message);
  }
};

const pickupKebaya = async (rentalId: string) => {
  if (confirm('Pelanggan mengambil room sekarang? Status akan berubah menjadi "Disewa".')) {
    try {
      const res = await fetch(`http://localhost:3001/api/rentals/${rentalId}/pickup`, { method: 'POST' });
      const data = await res.json();
      if(data.error) throw new Error(data.error);
      alert('Room berhasil diambil (Status: Disewa).');
      fetchData();
    } catch (err: any) {
      alert('Gagal mengubah status pickup: ' + err.message);
    }
  }
};

const openReceipt = (rental: any, type: string) => {
  window.open(`http://localhost:3001/api/receipts/${type}/${rental.transactionId}`, '_blank');
};

const sendWaReceipt = (r: any) => {
  if(!r.customerId || !r.customerId.telephone) return alert('Nomor HP pelanggan tidak tersedia');
  let num = r.customerId.telephone.replace(/[^0-9]/g, '');
  if (num.startsWith('0')) num = '62' + num.substring(1);

  const type = r.status === 'Completed' ? 'Lunas' : 'Deposit';
  let text = '';
  if (appConfig.value?.waKwitansiType === 'Link') {
    text = `Halo Kak ${r.customerId.name}, ini link untuk mengunduh kwitansi ${type} penyewaan room Anda:\n\nhttp://localhost:3001/api/receipts/${type}/${r.transactionId}`;
  } else {
    text = `Halo Kak ${r.customerId.name},\nBerikut ringkasan Kwitansi ${type} penyewaan room Anda:\n\n` +
           `ID Transaksi: ${r.transactionId}\n` +
           `Room: ${r.kebayaId?.tipeKamar} - ${r.kebayaId?.fasilitas}\n` +
           `Jatuh Tempo: ${new Date(r.expectedReturnDate).toLocaleDateString('id-ID')}\n`;
    if (type === 'Deposit') {
      text += `Harga Sewa: Rp ${r.kebayaId?.price}\nDeposit Dibayar: Rp ${r.depositAmount} ${r.depositPaid ? '(LUNAS)' : '(BELUM LUNAS)'}\n`;
    } else {
      text += `Total Denda: Rp ${r.penaltyAmount || 0}\nTotal Dibayar Akhir: Rp ${r.amountToPay || 0}\n`;
    }
    text += `\nTerima kasih telah menyewa di Kosan Fio!`;
  }
  
  const linkType = appConfig.value?.waLinkType || 'App';
  const url = linkType === 'Web' 
    ? `https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(text)}`
    : `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

const sendWaWarningDeposit = (r: any) => {
  if(!r.customerId || !r.customerId.telephone) return alert('Nomor HP pelanggan tidak tersedia');
  let num = r.customerId.telephone.replace(/[^0-9]/g, '');
  if (num.startsWith('0')) num = '62' + num.substring(1);

  const text = `Halo Kak ${r.customerId.name},\nKami dari Kosan Fio ingin mengingatkan bahwa pesanan Sewa Ruang Kos Anda:\n\n` +
         `ID Transaksi: ${r.transactionId}\n` +
         `Room: ${r.kebayaId?.tipeKamar} - ${r.kebayaId?.fasilitas}\n\n` +
         `Belum dibayarkan depositnya sebesar Rp ${r.depositAmount}.\nMohon segera melakukan pembayaran deposit agar pesanan Anda tidak dibatalkan.\n\nTerima kasih!`;

  const linkType = appConfig.value?.waLinkType || 'App';
  const url = linkType === 'Web' 
    ? `https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(text)}`
    : `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

const sendWaReminderPickup = (r: any) => {
  if(!r.customerId || !r.customerId.telephone) return alert('Nomor HP pelanggan tidak tersedia');
  let num = r.customerId.telephone.replace(/[^0-9]/g, '');
  if (num.startsWith('0')) num = '62' + num.substring(1);

  const text = `Halo Kak ${r.customerId.name},\nKami dari Kosan Fio ingin memberitahukan bahwa pesanan Sewa Ruang Kos Anda:\n\n` +
         `ID Transaksi: ${r.transactionId}\n` +
         `Room: ${r.kebayaId?.tipeKamar} - ${r.kebayaId?.fasilitas}\n\n` +
         `Sudah **SIAP DIAMBIL (PICKUP)**. Silakan datang ke butik kami untuk mengambil pesanan Anda.\n\nTerima kasih!`;

  const linkType = appConfig.value?.waLinkType || 'App';
  const url = linkType === 'Web' 
    ? `https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(text)}`
    : `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

const sendWaReminderReturn = (r: any) => {
  if(!r.customerId || !r.customerId.telephone) return alert('Nomor HP pelanggan tidak tersedia');
  let num = r.customerId.telephone.replace(/[^0-9]/g, '');
  if (num.startsWith('0')) num = '62' + num.substring(1);

  const text = `Halo Kak ${r.customerId.name},\nKami dari Kosan Fio ingin mengingatkan bahwa pesanan Sewa Ruang Kos Anda:\n\n` +
         `ID Transaksi: ${r.transactionId}\n` +
         `Room: ${r.kebayaId?.tipeKamar} - ${r.kebayaId?.fasilitas}\n` +
         `Jatuh Tempo Pengembalian: ${new Date(r.expectedReturnDate).toLocaleDateString('id-ID')}\n\n` +
         `Mohon pastikan untuk mengembalikan room tepat waktu untuk menghindari denda keterlambatan. Jika sudah dikembalikan, abaikan pesan ini.\n\nTerima kasih!`;

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
    openReceipt(r, 'Deposit');
  } else if (action === 'pdf_lunas') {
    openReceipt(r, 'Lunas');
  } else if (action === 'wa') {
    sendWaReceipt(r);
  } else if (action === 'email') {
    emailReceipt(r._id, r.status === 'Completed' ? 'Lunas' : 'Deposit');
  }

  // Reset dropdown back to default placeholder
  target.value = '';
};

onMounted(fetchData);
</script>
<style scoped>label { font-size: 0.9em; font-weight: 500; display: block; margin-bottom: 5px; color: var(--text-muted); }</style>
