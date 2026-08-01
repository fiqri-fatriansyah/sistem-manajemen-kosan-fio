<template>
  <div>
    <!-- Hero Section -->
    <div class="hero-section" style="display: flex; gap: 20px; align-items: center; background: linear-gradient(135deg, var(--primary-color), var(--primary-hover)); color: white; padding: 30px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
      <div style="flex: 1;">
        <h1 style="font-size: 2.5rem; margin-bottom: 10px;">Sistem Manajemen Kosan Fio</h1>
        <p style="font-size: 1.1rem; opacity: 0.9;">Kelola penyewaan dan inventaris kosan dengan mudah dan elegan.</p>
      </div>
      <div style="width: 150px; height: 150px; background: rgba(255,255,255,0.2); border-radius: 50%; overflow: hidden; border: 4px solid rgba(255,255,255,0.4);">
        <img src="/img/kosan_background.jpg" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
    </div>

    <!-- Announcement Banner -->
    <div v-if="upcomingHoliday" style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 10px 15px; margin-bottom: 30px; border-radius: 4px; display: flex; align-items: center; gap: 10px;">
      <strong style="color: #e65100;">📢 Pengumuman Libur:</strong>
      <span style="color: #333;">Mendekati <strong>{{ upcomingHoliday.name }}</strong> pada tanggal {{ new Date(upcomingHoliday.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }) }}. Pastikan ketersediaan stok room!</span>
    </div>

    <!-- 1. Quick Rent Integrated Form -->
    <div class="material-card" style="margin-bottom: 30px;">
      <h2 style="margin-bottom: 20px; color: var(--primary-color);">1. Penyewaan Cepat</h2>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Data Pelanggan -->
        <div>
          <h3 style="margin-bottom: 10px; font-size: 1.1rem;">Data Pelanggan</h3>
          <div style="margin-bottom: 15px; position: relative;">
            <label style="display: block; font-size: 1em; margin-bottom: 5px;">Ketik untuk mencari</label>
            <input v-model="quickForm.customerSearch" class="input" placeholder="Cari nama atau nomor HP..." @input="onCustomerInput" @focus="showCustomerDropdown = true" @blur="onCustomerBlur" />
            
            <div v-if="showCustomerDropdown && quickForm.customerSearch" style="position: absolute; top: calc(100% - 10px); left: 0; right: 0; background: white; border: 1px solid var(--surface-border); border-radius: 4px; z-index: 10; max-height: 200px; overflow-y: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div v-for="c in filteredCustomers" :key="c._id" @mousedown.prevent="selectCustomer(c)" style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='white'">
                {{ c.name }} ({{ c.telephone }})
              </div>
              <div @mousedown.prevent="selectNewCustomer" style="padding: 10px; cursor: pointer; color: var(--primary-color); font-weight: bold; background: #fafafa;" onmouseover="this.style.background='#eee'" onmouseout="this.style.background='#fafafa'">
                + Tambah Pelanggan Baru: "{{ quickForm.customerSearch }}"
              </div>
            </div>
          </div>

          <div v-if="isNewCustomer" style="background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px dashed var(--primary-color);">
            <p style="font-size: 1em; color: var(--text-muted); margin-bottom: 10px;">Pelanggan baru terdeteksi. Silakan lengkapi:</p>
            <label style="display: block; font-size: 1em; margin-bottom: 5px;">Telephone *</label>
            <input v-model="quickForm.newCustomerPhone" class="input" />
          </div>
        </div>

        <!-- Pilih Room -->
        <div>
          <h3 style="margin-bottom: 10px; font-size: 1.1rem;">Pilih Room</h3>
          <div style="margin-bottom: 15px; display: flex; gap: 15px; align-items: flex-start;">
            <div style="flex: 1;">
              <label style="display: block; font-size: 1em; margin-bottom: 5px;">Pilih Room Tersedia</label>
              <select v-model="quickForm.kebayaId" class="input" @change="calculateCost" style="margin-bottom: 0;">
                <option value="" disabled>-- Pilih Room --</option>
                <option v-for="k in availableRooms" :key="k._id" :value="k._id">
                  {{ k.tipeKamar }} - {{ k.fasilitas }} (Rp {{ k.price }})
                </option>
              </select>
            </div>
            <!-- Tampilkan gambar room yang dipilih -->
            <div v-if="selectedKebaya" style="flex-shrink: 0;">
              <img v-if="selectedKebaya.imageUrl" :src="'http://localhost:3001' + selectedKebaya.imageUrl" style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px; border: 2px solid var(--surface-border);" />
              <div v-else style="width: 150px; height: 150px; background: #eee; border-radius: 8px; border: 2px solid var(--surface-border); display: flex; align-items: center; justify-content: center; font-size: 1em; color: #999;">No Img</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Durasi & Harga -->
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--surface-border); display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <h3 style="margin-bottom: 10px; font-size: 1.1rem;">Durasi & Waktu</h3>
          <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <div style="flex: 1;">
              <label style="display: block; font-size: 1em; margin-bottom: 5px;">Waktu Sewa</label>
              <input type="date" v-model="quickForm.startDate" class="input" @change="onStartDateChange" />
            </div>
            <div style="flex: 1;">
              <label style="display: block; font-size: 1em; margin-bottom: 5px;">Kembali (Ekspektasi)</label>
              <input type="date" v-model="quickForm.returnDate" class="input" @change="onReturnDateChange" />
            </div>
          </div>
          <p style="font-weight: bold; font-size: 1.1rem; margin-bottom: 5px;">Durasi: <span style="color: var(--primary-color);">{{ rentalDuration }} Hari</span></p>
          <p style="font-weight: bold; font-size: 1.2rem; margin-bottom: 5px;">Total Biaya: <span style="color: var(--success);">Rp {{ totalCost }}</span></p>
          <p v-if="quickForm.initialPayment > 0" style="font-weight: bold; font-size: 1rem; color: var(--text-main);">
            Sisa Tagihan: <span style="color: var(--danger);">Rp {{ Math.max(0, totalCost - quickForm.initialPayment) }}</span>
          </p>
        </div>

        <div>
          <h3 style="margin-bottom: 10px; font-size: 1.1rem;">Deposit</h3>
          <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <div style="flex: 1;">
              <label style="display: block; font-size: 1em; margin-bottom: 5px;">Nominal terbayar</label>
              <input type="number" v-model="quickForm.initialPayment" class="input" placeholder="0" />
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top: 20px; text-align: right;">
        <button class="btn" @click="processQuickRent" :disabled="processing">
          {{ processing ? 'Memproses...' : 'Proses Penyewaan' }}
        </button>
      </div>
    </div>

    <!-- 2. Daftar Room Telat / Jatuh Tempo -->
    <div class="material-card" style="margin-bottom: 30px; border-left: 5px solid var(--danger);">
      <h2 style="margin-bottom: 20px; color: var(--danger);">2. Peringatan: Telat & Jatuh Tempo</h2>
      <div style="overflow-x: auto; width: 100%;">
        <table class="table">
        <thead>
          <tr>
            <th>Pelanggan</th>
            <th>Room</th>
            <th>Jatuh Tempo</th>
            <th>Alasan Peringatan</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in dueRentals" :key="r._id">
            <td>{{ r.customerId?.name }}</td>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <img v-if="r.kebayaId?.imageUrl" :src="'http://localhost:3001' + r.kebayaId.imageUrl" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;" />
                <div v-else style="width: 40px; height: 40px; background: #eee; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 1em; color: #999;">No Img</div>
                {{ r.kebayaId?.tipeKamar }} ({{ r.kebayaId?.fasilitas }})
              </div>
            </td>
            <td>{{ new Date(r.expectedReturnDate).toLocaleDateString('id-ID') }}</td>
            <td>
              <strong v-if="r.status === 'Active' && new Date(r.expectedReturnDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)" style="color: red; display: block; font-size: 1rem;">JATUH TEMPO PENGEMBALIAN</strong>
              <strong v-if="['Booked', 'Ready'].includes(r.status) && new Date(r.rentalStartTime).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)" style="color: orange; display: block; font-size: 1rem;">TELAT PICKUP</strong>
              <strong v-if="!r.depositPaid && (!r.payments || r.payments.length === 0)" style="color: #d35400; display: block; font-size: 1rem;">BELUM DEPOSIT SAMA SEKALI</strong>
              <strong v-if="!r.depositPaid && r.payments && r.payments.length > 0" style="color: #e67e22; display: block; font-size: 1rem;">DEPOSIT PARSIAL (BELUM LUNAS)</strong>
            </td>
            <td>
              <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                <button class="btn" style="flex: 1; min-width: 90px; text-align: center; padding: 6px 12px; font-size: 1em; white-space: nowrap;" @click="goToReturn(r._id)">Proses</button>
                <a v-if="r.customerId && r.customerId.telephone" 
                   :href="getWaLink(r.customerId.telephone, 'Halo Kak ' + r.customerId.name + ', mengingatkan bahwa sewaan room Anda ' + (new Date(r.expectedReturnDate) < new Date() ? 'sudah TELAT' : 'jatuh tempo pada ' + new Date(r.expectedReturnDate).toLocaleDateString('id-ID')) + '. Mohon dikembalikan ya!')" 
                   target="_blank" 
                   class="btn" 
                   style="flex: 1; min-width: 90px; text-align: center; padding: 6px 12px; font-size: 1em; background: #25D366; text-decoration: none; white-space: nowrap;"
                   title="Kirim Pengingat WhatsApp">
                  💬 WA
                </a>
              </div>
            </td>
          </tr>
          <tr v-if="dueRentals.length === 0">
            <td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">Tidak ada room yang telat atau deposit yang belum lunas.</td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <!-- 3. Small Dashboard (Top 5) -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
      <div class="material-card">
        <h3 style="margin-bottom: 15px; color: var(--primary-color);">Top 5 Room Terpopuler</h3>
        <ol style="padding-left: 20px; line-height: 1.8; font-size: 1rem;">
          <li v-for="k in stats?.topRooms" :key="k.room._id" style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
            <img v-if="k.room.imageUrl" :src="'http://localhost:3001' + k.room.imageUrl" style="width: 60px; height: 60px; border-radius: 4px; object-fit: cover;" />
            <div v-else style="width: 60px; height: 60px; background: #eee; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 1em; color: #999;">No Img</div>
            <div style="line-height: 1.4;">
              <strong style="font-size: 1.1em;">{{ k.room.tipeKamar }} ({{ k.room.fasilitas }})</strong><br/>
              <span style="font-size: 1em; color: var(--text-muted);">Disewa {{ k.count }} kali</span>
            </div>
          </li>
          <li v-if="!stats?.topRooms?.length" style="list-style: none; color: var(--text-muted);">Belum ada data</li>
        </ol>
      </div>

      <div class="material-card">
        <h3 style="margin-bottom: 15px; color: var(--success);">Top 5 Pelanggan Teraktif</h3>
        <ol style="padding-left: 20px; line-height: 1.8; font-size: 1rem;">
          <li v-for="c in stats?.topCustomers" :key="c.customer._id" style="margin-bottom: 10px;">
            <strong style="font-size: 1.1em;">{{ c.customer.name }}</strong> - Menyewa {{ c.count }} kali
          </li>
          <li v-if="!stats?.topCustomers?.length" style="list-style: none; color: var(--text-muted);">Belum ada data</li>
        </ol>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '../composables/useApi';

const router = useRouter();
const { getDashboardStats, getCustomers, getRooms } = useApi();

const stats = ref<any>(null);
const dueRentals = ref<any[]>([]);
const customers = ref<any[]>([]);
const rooms = ref<any[]>([]);
const processing = ref(false);
const upcomingHoliday = ref<any>(null);
const waLinkType = ref('App');

const getLocalDate = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

const todayStr = getLocalDate(new Date());
const defaultReturn = new Date();
defaultReturn.setDate(defaultReturn.getDate() + 2);
const defaultReturnStr = getLocalDate(defaultReturn);

const quickForm = ref({
  customerSearch: '',
  existingCustomerId: '',
  newCustomerPhone: '',
  kebayaId: '',
  startDate: todayStr,
  returnDate: defaultReturnStr,
  initialPayment: 0
});

const isNewCustomer = ref(false);
const rentalDuration = ref(3);
const totalCost = ref(0);

const availableRooms = computed(() => rooms.value.filter(k => k.availableStock > 0));
const selectedKebaya = computed(() => rooms.value.find(k => k._id === quickForm.value.kebayaId));

const showCustomerDropdown = ref(false);

const filteredCustomers = computed(() => {
  if (!quickForm.value.customerSearch) return [];
  const q = quickForm.value.customerSearch.toLowerCase();
  return customers.value.filter(c => 
    c.name.toLowerCase().includes(q) || 
    c.telephone.includes(q)
  );
});

const onCustomerInput = () => {
  showCustomerDropdown.value = true;
  quickForm.value.existingCustomerId = '';
  isNewCustomer.value = true; // assume new until selected from list
};

const onCustomerBlur = () => {
  showCustomerDropdown.value = false;
  if (!quickForm.value.existingCustomerId && quickForm.value.customerSearch.trim() !== '') {
    isNewCustomer.value = true;
  } else if (quickForm.value.customerSearch.trim() === '') {
    isNewCustomer.value = false;
    quickForm.value.existingCustomerId = '';
  }
};

const selectCustomer = (c: any) => {
  quickForm.value.customerSearch = `${c.name} (${c.telephone})`;
  quickForm.value.existingCustomerId = c._id;
  isNewCustomer.value = false;
  showCustomerDropdown.value = false;
};

const selectNewCustomer = () => {
  quickForm.value.existingCustomerId = '';
  isNewCustomer.value = true;
  showCustomerDropdown.value = false;
};

let returnDateManuallyChanged = false;

const onStartDateChange = () => {
  if (!returnDateManuallyChanged) {
    const start = new Date(quickForm.value.startDate);
    start.setDate(start.getDate() + 2);
    quickForm.value.returnDate = getLocalDate(start);
  }
  calculateCost();
};

const onReturnDateChange = () => {
  returnDateManuallyChanged = true;
  calculateCost();
};

const calculateCost = () => {
  const start = new Date(quickForm.value.startDate);
  const end = new Date(quickForm.value.returnDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  let days = Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1; // start of renting = day 1
  if (days < 1) days = 1;
  rentalDuration.value = days;

  if (selectedKebaya.value) {
    totalCost.value = days * selectedKebaya.value.price;
  } else {
    totalCost.value = 0;
  }
};

const fetchData = async () => {
  stats.value = await getDashboardStats();
  customers.value = await getCustomers();
  rooms.value = await getRooms();
  
  // Fetch active rentals to check for warnings
  const activeRes = await fetch('http://localhost:3001/api/rentals');
  const allActive = await activeRes.json();
  const todayZero = new Date();
  todayZero.setHours(0,0,0,0);
  
  dueRentals.value = allActive.filter((r: any) => {
    const startZero = new Date(r.rentalStartTime);
    startZero.setHours(0,0,0,0);
    const endZero = new Date(r.expectedReturnDate);
    endZero.setHours(0,0,0,0);

    if (r.status === 'Active' && endZero < todayZero) return true;
    if (['Booked', 'Ready'].includes(r.status) && startZero < todayZero) return true;
    if (['Booked', 'Ready', 'Active'].includes(r.status) && !r.depositPaid && startZero <= todayZero) return true;
    return false;
  });

  try {
    const eventsRes = await fetch(`http://localhost:3001/api/events?year=${todayZero.getFullYear()}`);
    const eventsData = await eventsRes.json();
    const nextHoliday = eventsData.find((e: any) => new Date(e.date) >= todayZero && e.isPublicHoliday);
    if (nextHoliday) {
      // Only show if it's within the next 30 days
      const diffTime = new Date(nextHoliday.date).getTime() - todayZero.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) {
        upcomingHoliday.value = nextHoliday;
      }
    }
  } catch (err) {
    console.error('Failed to load upcoming holiday');
  }

  try {
    const cfgRes = await fetch('http://localhost:3001/api/config');
    const cfgData = await cfgRes.json();
    if (cfgData) waLinkType.value = cfgData.waLinkType || 'App';
  } catch(e) {}
};

const goToReturn = (id: string) => {
  router.push('/penyewaan');
};

const formatWaNumber = (phone: string) => {
  if(!phone) return '';
  let num = phone.replace(/[^0-9]/g, '');
  if (num.startsWith('0')) {
    num = '62' + num.substring(1);
  }
  return num;
};

const getWaLink = (phone: string, text: string) => {
  const num = formatWaNumber(phone);
  if (waLinkType.value === 'Web') {
    return `https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
};

const processQuickRent = async () => {
  if (!quickForm.value.kebayaId) return alert('Pilih room');
  if (!quickForm.value.customerSearch) return alert('Masukkan data pelanggan');
  
  processing.value = true;
  let finalCustomerId = quickForm.value.existingCustomerId;

  try {
    if (isNewCustomer.value) {
      if (!quickForm.value.newCustomerPhone) {
        processing.value = false;
        return alert('Telephone pelanggan baru wajib diisi');
      }
      const custName = quickForm.value.customerSearch;
      
      const custRes = await fetch('http://localhost:3001/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: custName, telephone: quickForm.value.newCustomerPhone })
      });
      const custData = await custRes.json();
      finalCustomerId = custData._id;
    }

    const res = await fetch('http://localhost:3001/api/rentals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        customerId: finalCustomerId, 
        kebayaId: quickForm.value.kebayaId,
        rentalStartTime: quickForm.value.startDate,
        expectedReturnDate: quickForm.value.returnDate,
        initialPayment: quickForm.value.initialPayment,
        totalCost: totalCost.value
      })
    });
    
    if (!res.ok) {
       const errData = await res.json();
       throw new Error(errData.error || 'Server error');
    }

    const newRental = await res.json();
    if (newRental && newRental.transactionId) {
       window.open(`http://localhost:3001/api/receipts/Deposit/${newRental.transactionId}`, '_blank');
    }

    alert('Penyewaan berhasil diproses! Kwitansi Deposit telah dibuat.');
    
    // Reset form
    quickForm.value.customerSearch = '';
    quickForm.value.existingCustomerId = '';
    quickForm.value.newCustomerPhone = '';
    quickForm.value.kebayaId = '';
    quickForm.value.initialPayment = 0;
    isNewCustomer.value = false;
    totalCost.value = 0;
    
    fetchData(); 
  } catch (err) {
    alert('Gagal memproses penyewaan');
  } finally {
    processing.value = false;
  }
};

onMounted(fetchData);
</script>
