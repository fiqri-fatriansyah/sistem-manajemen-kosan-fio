<template>
  <div>
    <h1 class="page-title">Inventaris Room & Tipe Kosan</h1>
    
    <div class="material-card" style="margin-bottom: 1.25rem;">
      <div style="display: flex; gap: 0.9375rem; align-items: center; justify-content: space-between; flex-wrap: wrap;">
        <div style="display: flex; gap: 0.625rem; align-items: center; flex: 1; min-width: 18.75rem;">
          <input type="text" v-model="searchQuery" class="input" placeholder="Cari Tipe, No. Room, Fasilitas, atau Penyewa..." style="flex: 1; max-width: 25rem; margin-bottom: 0;" />
          <button class="btn" style="background: #34495e; padding: 0.3125rem 0.625rem; font-size: 0.9em;" @click="expandAll" title="Buka Semua">Buka Semua</button>
          <button class="btn" style="background: #7f8c8d; padding: 0.3125rem 0.625rem; font-size: 0.9em;" @click="collapseAll" title="Tutup Semua">Tutup Semua</button>
        </div>
        <div style="display: flex; gap: 0.625rem;">
          <button class="btn" @click="openRoomTypeForm(null)" style="background: var(--primary-color);">+ Tambah Tipe Baru</button>
        </div>
      </div>
    </div>

    <!-- Add / Edit RoomType Form -->
    <div v-if="showRoomTypeForm" class="material-card" style="margin-bottom: 1.25rem; border-left: 0.25rem solid var(--primary-color);">
      <h3 style="margin-bottom: 0.9375rem;">{{ isEditingRT ? 'Edit Tipe Room' : 'Tambah Tipe Baru' }}</h3>
      
      <label class="form-label">Nama Tipe (Misal: VIP, Standard)</label>
      <input v-model="rtForm.name" class="input" placeholder="VIP Room" />
      
      <label class="form-label">Harga Sewa Bulanan (Rp)</label>
      <input type="number" min="0" v-model="rtForm.price" class="input" placeholder="1500000" />
      
      <label class="form-label">Harga Sewa Harian (Rp)</label>
      <input type="number" min="0" v-model="rtForm.priceDaily" class="input" placeholder="150000" />
      
      <label class="form-label">Fasilitas (Pilih atau Ketik Baru)</label>
      <div style="display: flex; flex-wrap: wrap; gap: 0.625rem; margin-bottom: 0.625rem;">
        <label v-for="tag in availableTags" :key="tag.name" style="display: flex; align-items: center; gap: 0.3125rem; cursor: pointer; background: #eee; padding: 0.3125rem 0.625rem; border-radius: 1.25rem;">
          <input type="checkbox" :value="tag.name" v-model="rtForm.features" /> {{ tag.name }}
        </label>
      </div>
      <div style="display: flex; gap: 0.625rem; margin-bottom: 0.9375rem; max-width: 18.75rem;">
        <input v-model="newTagInput" class="input" style="margin-bottom: 0;" placeholder="Fasilitas Baru..." @keyup.enter="addNewTag" />
        <button class="btn" style="padding: 0.3125rem 0.625rem;" @click="addNewTag">Tambah</button>
      </div>

      <label class="form-label">Gambar Tipe Room (Opsional)</label>
      <input type="file" class="input" accept="image/*" @change="handleRTImageUpload" style="padding: 0.625rem;" />
      
      <div v-if="rtImagePreview" style="margin-top: 0.625rem; margin-bottom: 0.625rem;">
        <img :src="rtImagePreview" style="max-width: 18.75rem; max-height: 12.5rem; border-radius: 0.5rem; object-fit: cover;" />
      </div>
      
      <div style="margin-top: 0.9375rem;">
        <button class="btn" @click="saveRoomType">{{ isEditingRT ? 'Simpan Perubahan' : 'Simpan Baru' }}</button>
        <button class="btn" @click="showRoomTypeForm = false" style="background: #e0e0e0; color: #000; margin-left: 0.625rem;">Batal</button>
      </div>
    </div>

    <!-- Add / Edit Room Form -->
    <div v-if="showRoomForm" class="material-card" style="margin-bottom: 1.25rem; border-left: 0.25rem solid #27ae60;">
      <h3 style="margin-bottom: 0.9375rem;">{{ isEditingRoom ? 'Edit Room' : 'Tambah Ruangan Baru' }}</h3>
      
      <label class="form-label">Tipe Room</label>
      <select v-model="rForm.roomTypeId" class="input" @change="onRoomTypeChangeForRoom">
        <option value="" disabled>Pilih Tipe Room...</option>
        <option v-for="rt in roomTypes" :key="rt._id" :value="rt._id">{{ rt.name }} (Rp {{ formatRupiah(rt.price) }})</option>
      </select>
      
      <label class="form-label">Nomor/ID Room</label>
      <input v-model="rForm.roomNumber" class="input" placeholder="A1, B2, 101, dll." />

      <label class="form-label">Harga Bulanan Khusus (Opsional)</label>
      <input type="number" min="0" v-model="rForm.priceMonthly" class="input" placeholder="Kosongkan untuk ikut harga tipe..." />

      <label class="form-label">Harga Harian Khusus (Opsional)</label>
      <input type="number" min="0" v-model="rForm.priceDaily" class="input" placeholder="Kosongkan untuk ikut harga tipe..." />

      <label class="form-label">Fasilitas Khusus Room (Turunan dari Tipe)</label>
      <div style="display: flex; flex-wrap: wrap; gap: 0.625rem; margin-bottom: 0.625rem;">
        <label v-for="tag in availableTags" :key="tag.name" style="display: flex; align-items: center; gap: 0.3125rem; cursor: pointer; background: #e8f5e9; padding: 0.3125rem 0.625rem; border-radius: 1.25rem;">
          <input type="checkbox" :value="tag.name" v-model="rForm.features" /> {{ tag.name }}
        </label>
      </div>
      <div style="display: flex; gap: 0.625rem; margin-bottom: 0.9375rem; max-width: 18.75rem;">
        <input v-model="newTagInput" class="input" style="margin-bottom: 0;" placeholder="Fasilitas Baru..." @keyup.enter="addNewTag" />
        <button class="btn" style="padding: 0.3125rem 0.625rem;" @click="addNewTag">Tambah</button>
      </div>

      <label class="form-label">Status Awal</label>
      <select v-model="rForm.status" class="input">
        <option value="Available">Available (Tersedia)</option>
        <option value="Cleaning">Cleaning (Dibersihkan)</option>
        <option value="Maintenance">Maintenance (Perbaikan)</option>
      </select>

      <label class="form-label">Gambar Room Spesifik (Opsional)</label>
      <input type="file" class="input" accept="image/*" @change="handleRImageUpload" style="padding: 0.625rem;" />
      
      <div v-if="rImagePreview" style="margin-top: 0.625rem; margin-bottom: 0.625rem;">
        <img :src="rImagePreview" style="max-width: 18.75rem; max-height: 12.5rem; border-radius: 0.5rem; object-fit: cover;" />
      </div>
      
      <div style="margin-top: 0.9375rem;">
        <button class="btn" @click="saveRoom">{{ isEditingRoom ? 'Simpan Perubahan' : 'Simpan Baru' }}</button>
        <button class="btn" @click="showRoomForm = false" style="background: #e0e0e0; color: #000; margin-left: 0.625rem;">Batal</button>
      </div>
    </div>

    <!-- Inventory Display -->
    <div v-if="pending">Memuat...</div>
    <div v-else>
      <div v-if="filteredRoomTypes.length === 0" class="material-card" style="text-align: center; padding: 1.875rem;">
        Tidak ada data yang cocok dengan pencarian.
      </div>

      <div v-for="rt in paginatedRoomTypes" :key="rt._id" class="material-card" style="margin-bottom: 1.25rem; padding: 0; overflow: hidden;">
        <!-- RoomType Header (Collapsible) -->
        <div style="background: #f8f9fa; padding: 0.9375rem 1.25rem; border-bottom: 1px solid var(--surface-border); display: flex; align-items: center; justify-content: space-between; cursor: pointer;" @click="toggleRT(rt._id)">
          <div style="display: flex; gap: 1.25rem; align-items: center;">
            <img v-if="rt.imageUrl" :src="'http://localhost:3001' + rt.imageUrl" style="width: 5rem; height: 5rem; object-fit: cover; border-radius: 0.5rem;" />
            <div v-else style="width: 5rem; height: 5rem; background: #eee; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; font-size: 0.8em; color: #999;">No Img</div>
            
            <div>
              <h2 style="margin: 0; color: var(--primary-color);">{{ rt.name }}</h2>
              <div style="color: var(--text-muted); font-size: 0.9em; margin-top: 0.3125rem;">
                <span v-for="feat in rt.features" :key="feat" style="background: #e0e0e0; padding: 0.125rem 0.5rem; border-radius: 0.75rem; margin-right: 0.3125rem; font-size: 0.85em;">{{ feat }}</span>
              </div>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; gap: 1.25rem;">
            <div style="text-align: right;">
              <div style="font-weight: bold; font-size: 1.1em;">Rp {{ formatRupiah(rt.price) }} /Bulan</div>
              <div style="font-weight: bold; font-size: 0.9em; color: #27ae60;">Rp {{ formatRupiah(rt.priceDaily) }} /Hari</div>
              <div style="font-size: 0.85em; color: var(--text-muted); margin-top: 0.3125rem;">
                Tersedia: <strong>{{ getAvailableCount(rt._id) }}</strong> / Total: {{ getRoomsByType(rt._id).length }}
              </div>
            </div>
            <button class="btn" style="background: #f39c12; padding: 0.3125rem 0.625rem;" @click.stop="openRoomTypeForm(rt)">Edit Tipe</button>
            <span style="font-size: 1.5em; color: #888;">
              {{ expandedRTs.includes(rt._id) ? '▲' : '▼' }}
            </span>
          </div>
        </div>

        <!-- Room Items -->
        <div v-if="expandedRTs.includes(rt._id)" style="padding: 1.25rem; background: #fff;">
          <div style="margin-bottom: 0.9375rem; display: flex; justify-content: flex-end;">
            <button class="btn" style="background: var(--primary-color);" @click.stop="openRoomForm(null, rt._id)">+ Tambah Ruangan Baru</button>
          </div>
          <div style="overflow-x: auto; width: 100%;">
            <table class="table" style="margin: 0; min-width: 40rem;">
            <thead>
              <tr>
                <th style="width: 5rem;">Gambar</th>
                <th>No. Room</th>
                <th>Fasilitas Khusus</th>
                <th>Status & Aksi</th>
                <th>Penyewa Saat Ini</th>
                <th style="width: 9.375rem;">Opsi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="room in getFilteredRoomsByType(rt._id)" :key="room._id">
                <td>
                  <img v-if="room.imageUrl || rt.imageUrl" :src="'http://localhost:3001' + (room.imageUrl || rt.imageUrl)" style="width: 3.75rem; height: 3.75rem; object-fit: cover; border-radius: 0.25rem;" />
                  <div v-else style="width: 3.75rem; height: 3.75rem; background: #f5f5f5; border-radius: 0.25rem;"></div>
                </td>
                <td style="font-weight: bold; font-size: 1.1em;">
                  {{ room.roomNumber }}
                  <div style="font-size: 0.75em; font-weight: normal; margin-top: 0.3125rem; padding: 0.25rem; border-radius: 0.25rem;" :style="room.priceMonthly || room.priceDaily ? 'background: #fff3e0; border: 1px solid #ffe0b2; color: #d35400;' : 'background: #f8f9fa; border: 1px solid #eee; color: #666;'">
                    <div v-if="room.priceMonthly || room.priceDaily" style="margin-bottom: 0.125rem;"><strong>(Harga Khusus)</strong></div>
                    <div>Bulanan: Rp {{ formatRupiah(room.priceMonthly || rt.price) }}</div>
                    <div>Harian: Rp {{ formatRupiah(room.priceDaily || rt.priceDaily || Math.ceil(rt.price/30)) }}</div>
                  </div>
                </td>
                <td>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.3125rem;">
                    <span v-for="feat in room.features" :key="feat" style="background: #e8f5e9; color: #2e7d32; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.8em; border: 1px solid #c8e6c9;">{{ feat }}</span>
                  </div>
                </td>
                <td>
                  <span class="status-badge" :class="'status-' + room.status.toLowerCase()">{{ room.status }}</span>
                  
                  <div style="margin-top: 0.625rem; display: flex; gap: 0.3125rem; flex-wrap: wrap; align-items: center;" v-if="room.status !== 'Occupied'">
                    <span style="font-size: 0.85em; color: #555; font-weight: bold; margin-right: 0.25rem;">Ubah Ke:</span>
                    <button v-if="room.status !== 'Available'" class="btn" style="padding: 0.25rem 0.625rem; font-size: 0.85em; background: var(--success); box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.15);" @click="changeRoomStatus(room._id, 'Available')">Tersedia</button>
                    <button v-if="room.status !== 'Cleaning'" class="btn" style="padding: 0.25rem 0.625rem; font-size: 0.85em; background: #3498db; box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.15);" @click="changeRoomStatus(room._id, 'Cleaning')">Bersihkan</button>
                    <button v-if="room.status !== 'Maintenance'" class="btn" style="padding: 0.25rem 0.625rem; font-size: 0.85em; background: #e67e22; box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.15);" @click="changeRoomStatus(room._id, 'Maintenance')">Perbaikan</button>
                  </div>
                </td>
                <td>
                  <div v-if="getRentalsForRoom(room._id).length">
                    <div v-for="r in getRentalsForRoom(room._id)" :key="r._id" style="margin-bottom: 0.3125rem; font-size: 0.9em; background: #f8f9fa; padding: 0.3125rem; border-radius: 0.25rem; border: 1px solid #eee;">
                      <strong>{{ r.customerIds.map((c: any) => c.name).join(', ') }}</strong>
                      <div style="color: #666; font-size: 0.85em;">
                        {{ r.rentalType }}<br/>
                        <span v-if="r.rentalType === 'Long-Stay' && r.paidUntil">
                          Paid Until: {{ new Date(r.paidUntil).toLocaleDateString('id-ID') }}
                        </span>
                        <span v-if="r.rentalType === 'One-Time' && r.expectedReturnDate">
                          Jatuh Tempo: {{ new Date(r.expectedReturnDate).toLocaleDateString('id-ID') }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span v-else style="color: #999;">-</span>
                </td>
                <td>
                  <button class="btn" style="padding: 0.25rem 0.625rem; font-size: 0.9em; background: #34495e; margin-bottom: 0.3125rem; width: 100%;" @click="openRoomForm(room)">Edit</button>
                  <button class="btn" style="padding: 0.25rem 0.625rem; font-size: 0.9em; background: var(--danger); width: 100%;" @click="deleteRoom(room._id)">Hapus</button>
                </td>
              </tr>
              <tr v-if="getFilteredRoomsByType(rt._id).length === 0">
                <td colspan="6" style="text-align: center; color: #888;">Tidak ada room di dalam tipe ini yang cocok dengan pencarian.</td>
              </tr>
            </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Pagination Controls -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.25rem;">
        <div style="font-size: 0.9em;">
          Tampilkan: 
          <select v-model="itemsPerPage" class="input" style="width: auto; padding: 0.125rem 0.3125rem; margin: 0; display: inline-block;" @change="currentPage = 1">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>
        <div style="display: flex; gap: 0.625rem; align-items: center; font-size: 0.9em;">
          <button class="btn" :disabled="currentPage === 1" @click="currentPage--" style="background: #e0e0e0; color: #333; padding: 0.125rem 0.625rem;">&lt; Prev</button>
          <span style="font-weight: bold;">Halaman {{ currentPage }} dari {{ totalPages || 1 }}</span>
          <button class="btn" :disabled="currentPage >= totalPages || totalPages === 0" @click="currentPage++" style="background: #e0e0e0; color: #333; padding: 0.125rem 0.625rem;">Next &gt;</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useApi } from '../composables/useApi';

const router = useRouter();
const route = useRoute();
const { getRoomTypes, getRooms, getFeatureTags, getActiveRentals } = useApi();

const roomTypes = ref<any[]>([]);
const rooms = ref<any[]>([]);
const featureTags = ref<any[]>([]);
const activeRentals = ref<any[]>([]);
const pending = ref(true);

const searchQuery = ref((route.query.search as string) || '');
const expandedRTs = ref<string[]>([]);

// RoomType Form
const showRoomTypeForm = ref(false);
const isEditingRT = ref(false);
const rtEditId = ref<string | null>(null);
const rtForm = ref({ name: '', price: '', priceDaily: '', features: [] as string[] });
const rtImageFile = ref<File | null>(null);
const rtImagePreview = ref<string | null>(null);

// Room Form
const showRoomForm = ref(false);
const isEditingRoom = ref(false);
const rEditId = ref<string | null>(null);
const rForm = ref({ roomTypeId: '', roomNumber: '', status: 'Available', features: [] as string[], priceMonthly: '', priceDaily: '' });
const rImageFile = ref<File | null>(null);
const rImagePreview = ref<string | null>(null);

const newTagInput = ref('');

const fetchData = async () => {
  pending.value = true;
  try {
    roomTypes.value = await getRoomTypes();
    rooms.value = await getRooms();
    featureTags.value = await getFeatureTags();
    activeRentals.value = await getActiveRentals();
    
    // Auto-expand if only 1 room type in the result
    if (filteredRoomTypes.value.length === 1) {
      expandedRTs.value = [filteredRoomTypes.value[0]._id];
    } else if (roomTypes.value.length === 1) {
      expandedRTs.value = [roomTypes.value[0]._id];
    }
  } catch (err) {
    console.error(err);
  }
  pending.value = false;
};

onMounted(fetchData);

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(number || 0);
};

const availableTags = computed(() => {
  return featureTags.value.sort((a, b) => a.name.localeCompare(b.name));
});

const addNewTag = async () => {
  if (!newTagInput.value.trim()) return;
  const tagName = newTagInput.value.trim();
  
  if (featureTags.value.find(t => t.name.toLowerCase() === tagName.toLowerCase())) {
    newTagInput.value = '';
    return;
  }
  
  try {
    const res = await fetch('http://localhost:3001/api/rooms/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tagName })
    });
    const data = await res.json();
    featureTags.value.push(data);
    
    // Automatically check it in active form
    if (showRoomTypeForm.value) rtForm.value.features.push(data.name);
    if (showRoomForm.value) rForm.value.features.push(data.name);
    
    newTagInput.value = '';
  } catch(err) {
    alert('Gagal menambah tag');
  }
};

const toggleRT = (id: string) => {
  if (expandedRTs.value.includes(id)) {
    expandedRTs.value = expandedRTs.value.filter(x => x !== id);
  } else {
    expandedRTs.value.push(id);
  }
};

const expandAll = () => {
  expandedRTs.value = filteredRoomTypes.value.map(rt => rt._id);
};

const collapseAll = () => {
  expandedRTs.value = [];
};

// --- ROOM TYPES LOGIC ---

const openRoomTypeForm = (rt: any) => {
  if (rt) {
    isEditingRT.value = true;
    rtEditId.value = rt._id;
    rtForm.value = { name: rt.name, price: rt.price, priceDaily: rt.priceDaily, features: [...rt.features] };
    rtImagePreview.value = rt.imageUrl ? `http://localhost:3001${rt.imageUrl}` : null;
  } else {
    isEditingRT.value = false;
    rtEditId.value = null;
    rtForm.value = { name: '', price: '', priceDaily: '', features: [] };
    rtImagePreview.value = null;
  }
  rtImageFile.value = null;
  showRoomTypeForm.value = true;
  showRoomForm.value = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleRTImageUpload = (e: any) => {
  const file = e.target.files[0];
  if (file) {
    rtImageFile.value = file;
    rtImagePreview.value = URL.createObjectURL(file);
  }
};

const saveRoomType = async () => {
  const formData = new FormData();
  formData.append('name', rtForm.value.name);
  formData.append('price', String(rtForm.value.price));
  formData.append('priceDaily', String(rtForm.value.priceDaily || 0));
  formData.append('features', JSON.stringify(rtForm.value.features));
  if (rtImageFile.value) formData.append('image', rtImageFile.value);

  const url = isEditingRT.value ? `http://localhost:3001/api/rooms/types/${rtEditId.value}` : 'http://localhost:3001/api/rooms/types';
  const method = isEditingRT.value ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, { method, body: formData });
    if (!res.ok) throw new Error(await res.text());
    showRoomTypeForm.value = false;
    await fetchData();
  } catch(err: any) {
    alert('Error: ' + err.message);
  }
};

// --- ROOMS LOGIC ---

const onRoomTypeChangeForRoom = () => {
  if (!isEditingRoom.value && rForm.value.roomTypeId) {
    const rt = roomTypes.value.find(t => t._id === rForm.value.roomTypeId);
    if (rt) {
      rForm.value.features = [...rt.features];
    }
  }
};

const openRoomForm = (r: any, prefilledTypeId: string = '') => {
  if (r) {
    isEditingRoom.value = true;
    rEditId.value = r._id;
    rForm.value = { 
      roomTypeId: r.roomTypeId._id || r.roomTypeId, 
      roomNumber: r.roomNumber, 
      status: r.status, 
      features: [...r.features],
      priceMonthly: r.priceMonthly || '',
      priceDaily: r.priceDaily || ''
    };
    rImagePreview.value = r.imageUrl ? `http://localhost:3001${r.imageUrl}` : null;
  } else {
    isEditingRoom.value = false;
    rEditId.value = null;
    let newFeatures: string[] = [];
    if (prefilledTypeId) {
      const parentRt = roomTypes.value.find(type => type._id === prefilledTypeId);
      if (parentRt) newFeatures = [...parentRt.features];
    }
    rForm.value = { roomTypeId: prefilledTypeId, roomNumber: '', status: 'Available', features: newFeatures, priceMonthly: '', priceDaily: '' };
    rImagePreview.value = null;
  }
  rImageFile.value = null;
  showRoomForm.value = true;
  showRoomTypeForm.value = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleRImageUpload = (e: any) => {
  const file = e.target.files[0];
  if (file) {
    rImageFile.value = file;
    rImagePreview.value = URL.createObjectURL(file);
  }
};

const saveRoom = async () => {
  const formData = new FormData();
  formData.append('roomTypeId', rForm.value.roomTypeId);
  formData.append('roomNumber', rForm.value.roomNumber);
  formData.append('status', rForm.value.status);
  formData.append('priceMonthly', String(rForm.value.priceMonthly || ''));
  formData.append('priceDaily', String(rForm.value.priceDaily || ''));
  formData.append('features', JSON.stringify(rForm.value.features));
  if (rImageFile.value) formData.append('image', rImageFile.value);

  const url = isEditingRoom.value ? `http://localhost:3001/api/rooms/${rEditId.value}` : 'http://localhost:3001/api/rooms';
  const method = isEditingRoom.value ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, { method, body: formData });
    if (!res.ok) throw new Error(await res.text());
    showRoomForm.value = false;
    await fetchData();
  } catch(err: any) {
    alert('Error: ' + err.message);
  }
};

const deleteRoom = async (id: string) => {
  if (confirm('Yakin ingin menghapus room ini?')) {
    await fetch(`http://localhost:3001/api/rooms/${id}`, { method: 'DELETE' });
    await fetchData();
  }
};

const changeRoomStatus = async (id: string, newStatus: string) => {
  const formData = new FormData();
  formData.append('status', newStatus);
  await fetch(`http://localhost:3001/api/rooms/${id}`, { method: 'PUT', body: formData });
  await fetchData();
};

// --- DATA ACCESSORS & FILTERS ---

const getRoomsByType = (rtId: string) => {
  return rooms.value.filter(r => (r.roomTypeId._id || r.roomTypeId) === rtId);
};

const getAvailableCount = (rtId: string) => {
  return getRoomsByType(rtId).filter(r => r.status === 'Available').length;
};

const getRentalsForRoom = (roomId: string) => {
  return activeRentals.value.filter(r => r.roomId && (r.roomId._id || r.roomId) === roomId);
};

const filteredRoomTypes = computed(() => {
  if (!searchQuery.value) return roomTypes.value;
  
  const q = searchQuery.value.toLowerCase();
  
  // A RoomType matches if its name matches, its features match, OR any of its rooms match
  return roomTypes.value.filter(rt => {
    if (rt.name.toLowerCase().includes(q)) return true;
    if (rt.features.some((f: string) => f.toLowerCase().includes(q))) return true;
    
    // Check its rooms
    const rtsRooms = getRoomsByType(rt._id);
    for (const r of rtsRooms) {
      if (r.roomNumber.toLowerCase().includes(q)) return true;
      if (r.features.some((f: string) => f.toLowerCase().includes(q))) return true;
      
      // Check rentals for this room
      const rent = getRentalsForRoom(r._id);
      if (rent.some(rn => rn.customerIds.some((c: any) => c.name.toLowerCase().includes(q)))) return true;
    }
    
    return false;
  });
});

const currentPage = ref(1);
const itemsPerPage = ref(10);
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('fio_itemsPerPage');
  if (saved) itemsPerPage.value = Number(saved);
}

watch(itemsPerPage, (newVal) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('fio_itemsPerPage', newVal.toString());
  }
});

const totalPages = computed(() => {
  return Math.ceil(filteredRoomTypes.value.length / itemsPerPage.value) || 1;
});

const paginatedRoomTypes = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredRoomTypes.value.slice(start, start + itemsPerPage.value);
});

// Reset page when search changes
watch(searchQuery, () => {
  currentPage.value = 1;
  if (filteredRoomTypes.value.length === 1) {
    expandedRTs.value = [filteredRoomTypes.value[0]._id];
  } else {
    expandedRTs.value = [];
  }
});

const getFilteredRoomsByType = (rtId: string) => {
  let rtsRooms = getRoomsByType(rtId);
  if (!searchQuery.value) return rtsRooms;
  
  const q = searchQuery.value.toLowerCase();
  return rtsRooms.filter(r => {
    if (r.roomNumber.toLowerCase().includes(q)) return true;
    if (r.features.some((f: string) => f.toLowerCase().includes(q))) return true;
    
    const rent = getRentalsForRoom(r._id);
    if (rent.some(rn => rn.customerIds.some((c: any) => c.name.toLowerCase().includes(q)))) return true;
    
    // If the room type itself matched the query, show all its rooms
    const rt = roomTypes.value.find(t => t._id === rtId);
    if (rt && rt.name.toLowerCase().includes(q)) return true;
    
    return false;
  });
};

</script>

<style scoped>
.form-label {
  display: block;
  font-size: 0.95em;
  margin-bottom: 0.3125rem;
  font-weight: 600;
  color: #444;
}
.status-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 1.25rem;
  font-size: 0.85em;
  font-weight: bold;
}
.status-available { background: #e8f5e9; color: #2e7d32; }
.status-occupied { background: #ffebee; color: #c62828; }
.status-cleaning { background: #e3f2fd; color: #1565c0; }
.status-maintenance { background: #fff3e0; color: #ef6c00; }
</style>
