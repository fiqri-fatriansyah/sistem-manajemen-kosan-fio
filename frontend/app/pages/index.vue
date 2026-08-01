<template>
  <div>
    <!-- Hero Section -->
    <div class="hero-section" style="display: flex; gap: 1rem; align-items: center; background: linear-gradient(135deg, var(--primary-color), var(--primary-hover)); color: white; padding: 1rem; border-radius: 0.5rem; margin-bottom: 0.9375rem; box-shadow: 0 0.25rem 0.625rem rgba(0,0,0,0.15);">
      <div style="flex: 1;">
        <h1 style="font-size: 1.5rem; margin-bottom: 0.25rem;">{{ appConfig.appName || 'Sistem Manajemen Kosan Fio' }}</h1>
        <p style="font-size: 1rem; margin-bottom: 0; opacity: 0.9;">{{ appConfig.appDescription || 'Kelola penyewaan ruang kos dan kelola penghuni dengan mudah dan elegan.' }}</p>
      </div>
      <div style="width: 4.5rem; height: 4.5rem; background: rgba(255,255,255,0.2); border-radius: 50%; overflow: hidden; border: 0.125rem solid rgba(255,255,255,0.4);">
        <img src="/img/kosan_background.jpg" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
    </div>

    <!-- Announcement Banner -->
    <div v-if="upcomingHoliday" style="background: #fff3e0; border-left: 0.25rem solid #ff9800; padding: 0.625rem 0.9375rem; margin-bottom: 1.875rem; border-radius: 0.25rem; display: flex; align-items: center; gap: 0.625rem;">
      <strong style="color: #e65100;">📢 Pengumuman Libur:</strong>
      <span style="color: #333;">Mendekati <strong>{{ upcomingHoliday.name }}</strong> pada tanggal {{ new Date(upcomingHoliday.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }) }}. Pastikan ketersediaan kosan!</span>
    </div>

    <!-- Penyewaan Baru Integrated Form -->
    <div class="material-card" style="margin-bottom: 1.875rem;">
      <h2 style="margin-bottom: 1.25rem; color: var(--primary-color);">Penyewaan Baru</h2>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
        <!-- Data Pelanggan -->
        <div>
          <h3 style="margin-bottom: 0.625rem; font-size: 1.1rem;">Data Penghuni (Bisa Lebih Dari Satu)</h3>
          
          <!-- Daftar Penghuni yang Dipilih -->
          <div style="margin-bottom: 0.9375rem;">
            <div v-for="(p, index) in selectedTenants" :key="index" style="background: #f0f4f8; padding: 0.5rem 0.75rem; border-radius: 0.375rem; margin-bottom: 0.3125rem; display: flex; justify-content: space-between; align-items: center; border: 1px solid #d9e2ec;">
              <span><strong>{{ p.name }}</strong> ({{ p.telephone }}) <span v-if="p.isNew" style="font-size:0.8em; color:var(--primary-color);">[Baru]</span></span>
              <button class="btn" style="background: none; color: var(--danger); padding: 0.125rem; font-size: 1.2em;" @click="removeTenant(index)">✖</button>
            </div>
            <div v-if="selectedTenants.length === 0" style="color: #888; font-style: italic; font-size: 0.9em; margin-bottom: 0.625rem;">Belum ada penghuni ditambahkan.</div>
          </div>

          <div style="margin-bottom: 0.9375rem; position: relative;">
            <label style="display: block; font-size: 1em; margin-bottom: 0.3125rem;">Tambah Penghuni</label>
            <input v-model="customerSearch" class="input" placeholder="Cari nama atau nomor HP..." @input="onCustomerInput" @focus="showCustomerDropdown = true" @blur="onCustomerBlur" />
            
            <div v-if="showCustomerDropdown && customerSearch" style="position: absolute; top: calc(100% - 0.625rem); left: 0; right: 0; background: white; border: 1px solid var(--surface-border); border-radius: 0.25rem; z-index: 10; max-height: 12.5rem; overflow-y: auto; box-shadow: 0 0.25rem 0.375rem rgba(0,0,0,0.1);">
              <div v-for="c in filteredCustomers" :key="c._id" @mousedown.prevent="addExistingTenant(c)" style="padding: 0.625rem; cursor: pointer; border-bottom: 1px solid #eee;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='white'">
                {{ c.name }} ({{ c.telephone }})
              </div>
              <div @mousedown.prevent="prepareNewTenant" style="padding: 0.625rem; cursor: pointer; color: var(--primary-color); font-weight: bold; background: #fafafa;" onmouseover="this.style.background='#eee'" onmouseout="this.style.background='#fafafa'">
                + Tambah Pelanggan Baru: "{{ customerSearch }}"
              </div>
            </div>
          </div>

          <div v-if="isAddingNewTenant" style="background: #f9f9f9; padding: 0.9375rem; border-radius: 0.5rem; border: 1px dashed var(--primary-color);">
            <p style="font-size: 1em; color: var(--text-muted); margin-bottom: 0.625rem;">Melengkapi data pelanggan baru:</p>
            <label style="display: block; font-size: 1em; margin-bottom: 0.3125rem;">Nomor HP / Telepon *</label>
            <div style="display: flex; gap: 0.625rem;">
              <input v-model="newCustomerPhone" class="input" style="margin-bottom:0;" placeholder="08123456789" />
              <button class="btn" style="background: var(--primary-color);" @click="confirmNewTenant">Tambah ke Daftar</button>
            </div>
          </div>
        </div>

        <!-- Pilih Room -->
        <div>
          <h3 style="margin-bottom: 0.625rem; font-size: 1.1rem;">Pilih Room Kos</h3>
          <div style="margin-bottom: 0.9375rem; display: flex; gap: 0.9375rem; align-items: flex-start;">
            <div style="flex: 1; display: flex; flex-direction: column; gap: 0.625rem;">
              <div>
                <label style="display: block; font-size: 1em; margin-bottom: 0.3125rem;">Tipe Room</label>
                <select v-model="quickForm.roomTypeId" class="input" style="margin-bottom: 0;" @change="quickForm.roomId = ''; calculateCost()">
                  <option value="" disabled>-- Pilih Tipe Room --</option>
                  <option v-for="rt in roomTypes" :key="rt._id" :value="rt._id">
                    {{ rt.name }}
                  </option>
                </select>
              </div>
              
              <div>
                <label style="display: block; font-size: 1em; margin-bottom: 0.3125rem;">Ruangan Tersedia</label>
                <select v-model="quickForm.roomId" class="input" style="margin-bottom: 0;" :disabled="!quickForm.roomTypeId" @change="calculateCost">
                  <option value="" disabled>-- Pilih Ruangan --</option>
                  <option v-for="k in availableRoomsFiltered" :key="k._id" :value="k._id">
                    {{ k.roomNumber }} (Rp {{ formatRupiah(k.priceMonthly || k.roomTypeId?.price) }}/Bulan)
                  </option>
                </select>
              </div>
            </div>
            <!-- Tampilkan gambar room yang dipilih -->
            <div v-if="selectedRoom || selectedRoomType" style="flex-shrink: 0;">
              <img v-if="selectedRoom?.imageUrl || selectedRoomType?.imageUrl" :src="'http://localhost:3001' + (selectedRoom?.imageUrl || selectedRoomType?.imageUrl)" style="width: 9.375rem; height: 9.375rem; object-fit: cover; border-radius: 0.5rem; border: 0.125rem solid var(--surface-border);" />
              <div v-else style="width: 9.375rem; height: 9.375rem; background: #eee; border-radius: 0.5rem; border: 0.125rem solid var(--surface-border); display: flex; align-items: center; justify-content: center; font-size: 1em; color: #999;">No Img</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Durasi & Harga -->
      <div style="margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid var(--surface-border); display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
        <div>
          <h3 style="margin-bottom: 0.625rem; font-size: 1.1rem;">Durasi & Waktu</h3>
          
          <div style="display: flex; gap: 0.9375rem; margin-bottom: 0.9375rem;">
            <label style="display: flex; align-items: center; gap: 0.3125rem; cursor: pointer; font-size: 1.1em; font-weight: bold;">
              <input type="radio" v-model="quickForm.rentalType" value="Long-Stay" @change="calculateCost" /> Long-Stay (Bulanan)
            </label>
            <label style="display: flex; align-items: center; gap: 0.3125rem; cursor: pointer; font-size: 1.1em; font-weight: bold;">
              <input type="radio" v-model="quickForm.rentalType" value="One-Time" @change="calculateCost" /> One-Time (Harian)
            </label>
          </div>

          <!-- Long-Stay (Bulanan) Form -->
          <div v-if="quickForm.rentalType === 'Long-Stay'">
            <label style="display: block; font-size: 1em; margin-bottom: 0.3125rem;">Mulai Ngekos</label>
            <input type="date" v-model="quickForm.startDate" class="input" style="margin-bottom: 0.9375rem;" />
            <p style="font-weight: bold; font-size: 1.1rem; margin-bottom: 0.3125rem;">Harga Bulanan: <span style="color: var(--primary-color);">Rp {{ formatRupiah(selectedRoom?.priceMonthly || selectedRoom?.roomTypeId?.price) }}</span></p>
          </div>

          <!-- One-Time (Harian) Form -->
          <div v-else>
            <div style="display: flex; gap: 0.625rem; margin-bottom: 0.9375rem;">
              <div style="flex: 1;">
                <label style="display: block; font-size: 1em; margin-bottom: 0.3125rem;">Check-In</label>
                <input type="date" v-model="quickForm.startDate" class="input" @change="onStartDateChange" />
              </div>
              <div style="flex: 1;">
                <label style="display: block; font-size: 1em; margin-bottom: 0.3125rem;">Check-Out</label>
                <input type="date" v-model="quickForm.returnDate" class="input" @change="onReturnDateChange" />
              </div>
            </div>
            <p style="font-weight: bold; font-size: 1.1rem; margin-bottom: 0.3125rem;">Durasi Harian: <span style="color: var(--primary-color);">{{ rentalDuration }} Hari</span></p>
            <p style="font-weight: bold; font-size: 1.2rem; margin-bottom: 0.3125rem;">Total Biaya Harian: <span style="color: var(--success);">Rp {{ formatRupiah(totalCostHarian) }}</span></p>
          </div>
        </div>

        <div>
          <h3 style="margin-bottom: 0.625rem; font-size: 1.1rem;">Pembayaran Awal</h3>
          <div style="display: flex; gap: 0.625rem; margin-bottom: 0.9375rem;">
            <div style="flex: 1;">
              <label style="display: block; font-size: 1em; margin-bottom: 0.3125rem;">Uang Muka / Pembayaran Bulan Pertama (Rp)</label>
              <input type="number" min="0" v-model="quickForm.initialPayment" class="input" placeholder="0" />
            </div>
          </div>
          <div v-if="quickForm.rentalType === 'Long-Stay'" style="background: #e8f5e9; border: 1px solid #c8e6c9; padding: 0.625rem; border-radius: 0.25rem;">
            <span style="font-size: 0.9em; color: #2e7d32;">
              Info: Pembayaran awal akan dikonversi menjadi bulan sewa lunas. (Misal: Rp 1,5jt untuk 1 bulan, Rp 3jt untuk 2 bulan).
            </span>
          </div>
          <div v-if="quickForm.rentalType === 'One-Time' && quickForm.initialPayment > 0" style="font-weight: bold; font-size: 1rem; color: var(--text-main); margin-top: 0.625rem;">
            Sisa Tagihan (Harian): <span style="color: var(--danger);">Rp {{ formatRupiah(Math.max(0, totalCostHarian - quickForm.initialPayment)) }}</span>
          </div>
        </div>
      </div>

      <div v-if="isDateConflict" style="margin-top: 1.25rem; padding: 0.9375rem; background: #ffebee; border: 1px solid #ffcdd2; border-radius: 0.25rem; color: #c62828; font-weight: bold;">
        ⚠️ Ruangan tidak tersedia pada tanggal yang dipilih. Bentrok dengan reservasi lain.
      </div>
      
      <div style="margin-top: 1.25rem; text-align: right;">
        <button class="btn" style="background: var(--primary-color); font-size: 1.1em; padding: 0.625rem 1.25rem;" @click="processQuickRent" :disabled="processing || isDateConflict">
          {{ processing ? 'Memproses...' : 'Selesaikan Penyewaan & Simpan' }}
        </button>
      </div>
    </div>

    <!-- Daftar Penghuni Telat Bayar / Overstay -->
    <div v-if="dueRentals.length > 0" class="material-card" style="margin-bottom: 1.875rem; border-left: 0.25rem solid var(--danger);">
      <h2 style="margin-bottom: 1.25rem; color: var(--danger);">Peringatan: Tunggakan & Overstay</h2>
      <div style="overflow-x: auto; width: 100%;">
        <table class="table">
        <thead>
          <tr>
            <th>Penghuni Utama</th>
            <th>Room</th>
            <th>Jatuh Tempo</th>
            <th>Masalah</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in dueRentals" :key="r._id">
            <td>{{ r.customerIds?.[0]?.name }}</td>
            <td>
              <div style="display: flex; align-items: center; gap: 0.625rem;">
                <img v-if="r.roomId?.imageUrl || r.roomId?.roomTypeId?.imageUrl" :src="'http://localhost:3001' + (r.roomId?.imageUrl || r.roomId?.roomTypeId?.imageUrl)" style="width: 2.5rem; height: 2.5rem; border-radius: 0.25rem; object-fit: cover;" />
                <div v-else style="width: 2.5rem; height: 2.5rem; background: #eee; border-radius: 0.25rem; display: flex; align-items: center; justify-content: center; font-size: 1em; color: #999;">No Img</div>
                {{ r.roomId?.roomNumber }}<br><span style="font-size: 0.8em; color: #666;">{{ r.roomId?.roomTypeId?.name }}</span>
              </div>
            </td>
            <td>{{ new Date(r.paidUntil || r.expectedReturnDate).toLocaleDateString('id-ID') }}</td>
            <td>
              <strong style="color: #e74c3c; display: block; font-size: 1rem;">
                {{ r.currentStatusText?.toUpperCase() }} 
                <span style="font-size: 0.8em; color: #666; font-weight: normal;">
                  ({{ r.rentalType === 'Long-Stay' ? 'Bulanan' : 'Harian' }})
                </span>
              </strong>
            </td>
            <td>
              <div style="display: flex; gap: 0.625rem; flex-wrap: wrap;">
                <button class="btn" style="flex: 1; min-width: 6.25rem; text-align: center; padding: 0.75rem; font-size: 1em; font-weight: bold; white-space: nowrap; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;" @click="goToRentals(r.transactionId)">Proses</button>
                <a v-if="r.customerIds?.[0]?.telephone" 
                   :href="getWaLink(r.customerIds[0].telephone, getWaWarningText(r))" 
                   target="_blank" 
                   class="btn" 
                   style="flex: 1; min-width: 6.25rem; text-align: center; padding: 0.75rem; font-size: 1em; font-weight: bold; background: #25D366; text-decoration: none; white-space: nowrap; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.3125rem;"
                   title="Kirim Pengingat WhatsApp">
                  <span style="font-size: 1.2em;">💬</span> WA
                </a>
              </div>
            </td>
          </tr>
          <tr v-if="dueRentals.length === 0">
            <td colspan="5" style="text-align: center; padding: 1.25rem; color: var(--text-muted);">Tidak ada penghuni yang memiliki tunggakan/overstay.</td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <!-- 3. Small Dashboard (Top 5) -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.875rem;">
      <div class="material-card">
        <h3 style="margin-bottom: 0.9375rem; color: var(--primary-color);">Top 5 Tipe Room Kos</h3>
        <ol style="padding-left: 1.25rem; line-height: 1.8; font-size: 1rem;">
          <li v-for="k in stats?.topRooms" :key="k.roomType?._id" style="display: flex; align-items: center; gap: 0.9375rem; margin-bottom: 0.9375rem;">
            <img v-if="k.roomType?.imageUrl" :src="'http://localhost:3001' + k.roomType.imageUrl" style="width: 3.75rem; height: 3.75rem; border-radius: 0.25rem; object-fit: cover;" />
            <div v-else style="width: 3.75rem; height: 3.75rem; background: #eee; border-radius: 0.25rem; display: flex; align-items: center; justify-content: center; font-size: 1em; color: #999;">No Img</div>
            <div style="line-height: 1.4;">
              <strong style="font-size: 1.1em;">{{ k.roomType?.name }}</strong><br/>
              <span style="font-size: 1em; color: var(--text-muted);">Disewa {{ k.count }} kali</span>
            </div>
          </li>
          <li v-if="!stats?.topRooms?.length" style="list-style: none; color: var(--text-muted);">Belum ada data</li>
        </ol>
      </div>

      <div class="material-card">
        <h3 style="margin-bottom: 0.9375rem; color: var(--success);">Top 5 Penghuni Teraktif</h3>
        <ol style="padding-left: 1.25rem; line-height: 1.8; font-size: 1rem;">
          <li v-for="c in stats?.topCustomers" :key="c.customer._id" style="margin-bottom: 0.625rem;">
            <strong style="font-size: 1.1em;">{{ c.customer.name }}</strong> - {{ c.count }} Transaksi
          </li>
          <li v-if="!stats?.topCustomers?.length" style="list-style: none; color: var(--text-muted);">Belum ada data</li>
        </ol>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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
const appConfig = ref<any>({});

// Tenant Management
const selectedTenants = ref<any[]>([]);
const customerSearch = ref('');
const showCustomerDropdown = ref(false);
const isAddingNewTenant = ref(false);
const newCustomerPhone = ref('');

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID').format(number || 0);
};

const getLocalDate = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

const todayStr = getLocalDate(new Date());
const defaultReturn = new Date();
defaultReturn.setDate(defaultReturn.getDate() + 2);
const defaultReturnStr = getLocalDate(defaultReturn);

const quickForm = ref({
  roomTypeId: '',
  roomId: '',
  rentalType: 'Long-Stay',
  startDate: todayStr,
  returnDate: defaultReturnStr,
  initialPayment: 0
});

const rentalDuration = ref(3);
const totalCostHarian = ref(0);
const unavailableDatesForSelectedRoom = ref<any[]>([]);

const availableRooms = computed(() => rooms.value.filter(k => k.status !== 'Maintenance'));
const roomTypes = computed(() => {
  const typesMap = new Map();
  availableRooms.value.forEach(r => {
    if (r.roomTypeId) {
      typesMap.set(r.roomTypeId._id, r.roomTypeId);
    }
  });
  return Array.from(typesMap.values());
});
const availableRoomsFiltered = computed(() => {
  if (!quickForm.value.roomTypeId) return [];
  return availableRooms.value.filter(k => (k.roomTypeId?._id || k.roomTypeId) === quickForm.value.roomTypeId);
});
const selectedRoomType = computed(() => roomTypes.value.find((rt: any) => rt._id === quickForm.value.roomTypeId));
const selectedRoom = computed(() => rooms.value.find(k => k._id === quickForm.value.roomId));

watch(() => quickForm.value.roomId, async (newVal) => {
  if (newVal) {
    try {
      const res = await fetch(`http://localhost:3001/api/rentals/unavailable-dates/${newVal}`);
      unavailableDatesForSelectedRoom.value = await res.json();
    } catch(e) {
      unavailableDatesForSelectedRoom.value = [];
    }
  } else {
    unavailableDatesForSelectedRoom.value = [];
  }
});

const isDateConflict = computed(() => {
  if (!quickForm.value.roomId) return false;
  
  const reqStart = new Date(quickForm.value.startDate);
  let reqEnd = new Date('2099-12-31T23:59:59Z');
  if (quickForm.value.rentalType === 'One-Time') {
    reqEnd = new Date(quickForm.value.returnDate);
  }
  
  for (const range of unavailableDatesForSelectedRoom.value) {
    const exStart = new Date(range.start);
    const exEnd = new Date(range.end);
    if (reqStart < exEnd && reqEnd > exStart) {
      return true;
    }
  }
  return false;
});

const filteredCustomers = computed(() => {
  if (!customerSearch.value) return [];
  const q = customerSearch.value.toLowerCase();
  return customers.value.filter(c => 
    c.name.toLowerCase().includes(q) || 
    c.telephone.includes(q)
  );
});

const onCustomerInput = () => {
  showCustomerDropdown.value = true;
  isAddingNewTenant.value = false;
};

const onCustomerBlur = () => {
  setTimeout(() => {
    showCustomerDropdown.value = false;
  }, 200);
};

const addExistingTenant = (c: any) => {
  if (!selectedTenants.value.find(t => t._id === c._id)) {
    selectedTenants.value.push(c);
  }
  customerSearch.value = '';
  showCustomerDropdown.value = false;
};

const prepareNewTenant = () => {
  isAddingNewTenant.value = true;
  showCustomerDropdown.value = false;
};

const confirmNewTenant = () => {
  if (!customerSearch.value || !newCustomerPhone.value) return alert('Nama dan Nomor HP wajib diisi');
  
  selectedTenants.value.push({
    isNew: true,
    name: customerSearch.value,
    telephone: newCustomerPhone.value
  });
  
  customerSearch.value = '';
  newCustomerPhone.value = '';
  isAddingNewTenant.value = false;
};

const removeTenant = (index: number) => {
  selectedTenants.value.splice(index, 1);
};

let returnDateManuallyChanged = false;

const onStartDateChange = () => {
  if (!returnDateManuallyChanged && quickForm.value.rentalType === 'One-Time') {
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
  if (quickForm.value.rentalType === 'One-Time') {
    const start = new Date(quickForm.value.startDate);
    const end = new Date(quickForm.value.returnDate);
    const msPerDay = 1000 * 60 * 60 * 24;
    let days = Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
    if (days < 1) days = 1;
    rentalDuration.value = days;

    if (selectedRoom.value && selectedRoom.value.roomTypeId) {
      const harian = selectedRoom.value.priceDaily || selectedRoom.value.roomTypeId.priceDaily || Math.ceil(selectedRoom.value.roomTypeId.price / 30);
      totalCostHarian.value = days * harian;
    } else {
      totalCostHarian.value = 0;
    }
  }
};

const fetchData = async () => {
  stats.value = await getDashboardStats();
  customers.value = await getCustomers();
  rooms.value = await getRooms();
  
  if (roomTypes.value.length === 1) {
    quickForm.value.roomTypeId = roomTypes.value[0]._id;
  }
  
  const activeRes = await fetch('http://localhost:3001/api/rentals');
  const allActive = await activeRes.json();
  const todayZero = new Date();
  todayZero.setHours(0,0,0,0);
  
  dueRentals.value = allActive.filter((r: any) => {
    if (r.status === 'Completed' || r.status === 'Cancelled') return false;

    if (r.rentalType === 'Long-Stay' && r.paidUntil) {
      const pZero = new Date(r.paidUntil);
      pZero.setHours(0,0,0,0);
      if (pZero < todayZero) return true;
    } else if (r.rentalType === 'One-Time' && r.expectedReturnDate) {
      const eZero = new Date(r.expectedReturnDate);
      eZero.setHours(0,0,0,0);
      if (eZero < todayZero) return true;
    }
    
    if (r.status === 'Booked' && !r.depositPaid) return true;

    return false;
  });

  try {
    const eventsRes = await fetch(`http://localhost:3001/api/events?year=${todayZero.getFullYear()}`);
    const eventsData = await eventsRes.json();
    const nextHoliday = eventsData.find((e: any) => new Date(e.date) >= todayZero && e.isPublicHoliday);
    if (nextHoliday) {
      const diffTime = new Date(nextHoliday.date).getTime() - todayZero.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) {
        upcomingHoliday.value = nextHoliday;
      }
    }
  } catch (err) { }

  try {
    const cfgRes = await fetch('http://localhost:3001/api/config');
    const cfgData = await cfgRes.json();
    if (cfgData) {
      waLinkType.value = cfgData.waLinkType || 'App';
      appConfig.value = cfgData;
    }
  } catch(e) {}
};

const goToRentals = (trxId?: string) => {
  if (trxId) {
    router.push({ path: '/penyewaan', query: { search: trxId } });
  } else {
    router.push('/penyewaan');
  }
};

const formatWaNumber = (phone: string) => {
  if(!phone) return '';
  let num = phone.replace(/[^0-9]/g, '');
  if (num.startsWith('0')) num = '62' + num.substring(1);
  return num;
};

const getWaLink = (phone: string, text: string) => {
  const num = formatWaNumber(phone);
  if (waLinkType.value === 'Web') {
    return `https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
};

const parseWaTemplate = (template: string, custName: string, roomNum: string, dateStr: string, nominal: string) => {
  if (!template) return '';
  return template
    .replace(/\{\{nama\}\}/g, custName)
    .replace(/\{\{kamar\}\}/g, roomNum)
    .replace(/\{\{tanggal\}\}/g, dateStr)
    .replace(/\{\{nominal\}\}/g, nominal);
};

const getWaWarningText = (r: any) => {
  const custName = r.customerIds?.[0]?.name || '';
  const roomNum = r.roomId?.roomNumber || '';
  
  if (r.status === 'Booked' && !r.depositPaid) {
    const rawTemplate = appConfig.value?.msgTemplateBooked || 'Halo {{nama}},\n\nKami mengingatkan bahwa Anda memiliki booking untuk kamar {{kamar}} yang belum lunas/DP. Mohon segera diselesaikan sebesar Rp {{nominal}}.\n\nTerima kasih.';
    return parseWaTemplate(rawTemplate, custName, roomNum, '', String(r.tunggakanAmount || 0));
  } else if (r.tunggakanAmount > 0 || (r.status === 'Active' && r.rentalType === 'One-Time')) {
    const rawTemplate = appConfig.value?.msgTemplateOverdue || 'Halo {{nama}},\n\nKami mengingatkan bahwa tagihan sewa kamar {{kamar}} Anda telah melewati batas waktu (jatuh tempo pada {{tanggal}}). Mohon segera melunasi tunggakan sebesar Rp {{nominal}}.\n\nTerima kasih.';
    const dateStr = new Date(r.paidUntil || r.expectedReturnDate).toLocaleDateString('id-ID');
    return parseWaTemplate(rawTemplate, custName, roomNum, dateStr, String(r.tunggakanAmount || 0));
  }
  
  // Default fallback
  return `Halo ${custName}, mengingatkan bahwa tagihan Kos Anda (Room ${roomNum}) sudah jatuh tempo. Mohon segera melakukan pembayaran. Terima kasih!`;
};

const processQuickRent = async () => {
  if (!quickForm.value.roomId) return alert('Pilih room terlebih dahulu');
  if (selectedTenants.value.length === 0) return alert('Tambahkan setidaknya 1 penghuni');
  
  processing.value = true;

  try {
    // Save new customers first
    const finalCustomerIds = [];
    for (const t of selectedTenants.value) {
      if (t.isNew) {
        const custRes = await fetch('http://localhost:3001/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: t.name, telephone: t.telephone })
        });
        const custData = await custRes.json();
        finalCustomerIds.push(custData._id);
      } else {
        finalCustomerIds.push(t._id);
      }
    }

    const res = await fetch('http://localhost:3001/api/rentals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        customerIds: finalCustomerIds, 
        roomId: quickForm.value.roomId,
        rentalType: quickForm.value.rentalType,
        rentalStartTime: quickForm.value.startDate,
        expectedReturnDate: quickForm.value.rentalType === 'One-Time' ? quickForm.value.returnDate : undefined,
        initialPayment: quickForm.value.initialPayment
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

    alert('Penyewaan berhasil diproses! Transaksi telah dicatat.');
    
    // Reset form
    selectedTenants.value = [];
    quickForm.value.roomId = '';
    quickForm.value.initialPayment = 0;
    isAddingNewTenant.value = false;
    
    fetchData(); 
  } catch (err: any) {
    alert('Gagal memproses penyewaan: ' + err.message);
  } finally {
    processing.value = false;
  }
};

onMounted(fetchData);
</script>
