<template>
  <div>
    <h1 class="page-title">Inventaris Room</h1>
    
    <div class="material-card" style="margin-bottom: 20px;">
      <div style="display: flex; gap: 15px; align-items: center; justify-content: space-between;">
        <input type="text" v-model="searchQuery" class="input" placeholder="Cari Jenis atau Warna..." style="max-width: 400px; margin-bottom: 0;" />
        <button class="btn" @click="showForm = true" style="background: var(--primary-color);">+ Tambah Room</button>
      </div>
    </div>

    <!-- Add / Edit Form -->
    <div v-if="showForm" class="material-card" style="margin-bottom: 20px; border-left: 4px solid var(--primary-color);">
      <h3 style="margin-bottom: 15px;">{{ isEditing ? 'Edit Room' : 'Tambah Room Baru' }}</h3>
      
      <label style="display: block; font-size: 1em; margin-bottom: 5px;">Jenis</label>
      <input v-model="form.tipeKamar" class="input" placeholder="Contoh: Kutubaru" />
      
      <label style="display: block; font-size: 1em; margin-bottom: 5px;">Warna</label>
      <input v-model="form.fasilitas" class="input" placeholder="Contoh: Putih Tulang" />
      
      <label style="display: block; font-size: 1em; margin-bottom: 5px;">Harga Sewa (Rp)</label>
      <input type="number" v-model="form.price" class="input" placeholder="100000" />
      
      <label style="display: block; font-size: 1em; margin-bottom: 5px;">Total Stok</label>
      <input type="number" v-model="form.totalStock" class="input" placeholder="5" />

      <label style="display: block; font-size: 1em; margin-bottom: 5px;">Gambar Room (Opsional)</label>
      <input type="file" class="input" accept="image/*" @change="handleFileUpload" style="padding: 10px;" />
      
      <div v-if="imagePreview" style="margin-top: 10px; margin-bottom: 10px;">
        <label style="display: block; font-size: 1em; margin-bottom: 5px;">Pratinjau Gambar:</label>
        <img :src="imagePreview" alt="Pratinjau Room" style="max-width: 300px; max-height: 300px; border-radius: 8px; border: 1px solid var(--surface-border); object-fit: cover;" />
      </div>
      
      <div style="margin-top: 15px;">
        <button class="btn" @click="saveKebaya">{{ isEditing ? 'Simpan Perubahan' : 'Simpan Baru' }}</button>
        <button class="btn" @click="cancelEdit" style="background: #e0e0e0; color: #000; margin-left: 10px;">Batal</button>
      </div>
    </div>

    <div v-if="pending">Memuat...</div>
    <div v-else class="material-card">
      <div style="overflow-x: auto; width: 100%;">
        <table class="table">
          <thead>
            <tr>
              <th>Gambar</th>
              <th @click="sortByCol('tipeKamar')" style="cursor: pointer;">Jenis <span v-if="sortKey === 'tipeKamar'">{{ sortDesc ? '↓' : '↑' }}</span></th>
              <th @click="sortByCol('fasilitas')" style="cursor: pointer;">Warna <span v-if="sortKey === 'fasilitas'">{{ sortDesc ? '↓' : '↑' }}</span></th>
              <th @click="sortByCol('price')" style="cursor: pointer;">Harga Sewa Dasar <span v-if="sortKey === 'price'">{{ sortDesc ? '↓' : '↑' }}</span></th>
              <th @click="sortByCol('totalStock')" style="cursor: pointer;">Total Stok <span v-if="sortKey === 'totalStock'">{{ sortDesc ? '↓' : '↑' }}</span></th>
              <th @click="sortByCol('availableStock')" style="cursor: pointer;">Tersedia <span v-if="sortKey === 'availableStock'">{{ sortDesc ? '↓' : '↑' }}</span></th>
              <th>Laundry / Perbaikan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="k in paginatedRooms" :key="k._id">
              <tr style="cursor: pointer; transition: background 0.2s;" @click="toggleRow(k._id)" :style="expandedRow === k._id ? 'background: #f0f0f0;' : ''">
                <td>
                  <img v-if="k.imageUrl" :src="'http://localhost:3001' + k.imageUrl" style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px; border: 2px solid var(--surface-border);" />
                  <div v-else style="width: 150px; height: 150px; background: #eee; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1em; color: #999; border: 2px solid var(--surface-border);">No Img</div>
                </td>
                <td>{{ k.tipeKamar }}</td>
                <td>{{ k.fasilitas }}</td>
                <td>{{ formatRupiah(k.price) }}</td>
                <td>
                  <button @click.stop="adjustStock(k, -1)" style="border:none; background:#eee; cursor:pointer; padding: 2px 6px;">-</button>
                  <span style="margin: 0 5px;">{{ k.totalStock }}</span>
                  <button @click.stop="adjustStock(k, 1)" style="border:none; background:#eee; cursor:pointer; padding: 2px 6px;">+</button>
                </td>
                <td>
                  <div style="display: flex; flex-direction: column; gap: 5px; align-items: flex-start;">
                    <span :style="k.availableStock > 0 ? 'color: var(--success); font-weight: bold; font-size: 1.1em;' : 'color: var(--danger); font-weight: bold; font-size: 1.1em;'">
                      {{ k.availableStock }}
                    </span>
                    <div v-if="k.availableStock > 0" style="display: flex; gap: 5px;">
                      <button class="btn" style="background: #2980b9; padding: 2px 5px; font-size: 1em;" @click.stop="openTransfer(k._id, 'available', 'laundry', k.availableStock)">➔ Laundry</button>
                      <button class="btn" style="background: #e67e22; padding: 2px 5px; font-size: 1em;" @click.stop="openTransfer(k._id, 'available', 'maintenance', k.availableStock)">➔ Perbaikan</button>
                    </div>
                    <div v-if="transferActive.kebayaId === k._id && transferActive.from === 'available'" style="display: flex; gap: 5px; margin-top: 5px; background: #f9f9f9; padding: 5px; border-radius: 4px; border: 1px solid #ddd;" @click.stop>
                      <span style="font-size: 1em; align-self: center;">Ke {{ transferActive.to === 'laundry' ? 'Laundry' : 'Perbaikan' }}:</span>
                      <input type="number" v-model="transferAmount" :max="transferActive.max" min="1" class="input" style="width: 50px; padding: 2px; margin: 0; font-size: 1em;" />
                      <button class="btn" style="background: var(--success); padding: 2px 5px; font-size: 1em;" @click.stop="confirmTransfer">OK</button>
                      <button class="btn" style="background: #ccc; padding: 2px 5px; font-size: 1em; color: black;" @click.stop="cancelTransfer">X</button>
                    </div>
                  </div>
                </td>
                <td>
                  <div v-if="k.cleaningStock > 0" style="margin-bottom: 5px; display: flex; flex-direction: column; gap: 5px;">
                    <span style="color: #2980b9; font-size: 1em; font-weight: bold;">{{ k.cleaningStock }} di Laundry</span>
                    <button class="btn" style="background: var(--success); padding: 2px 5px; font-size: 1em; align-self: flex-start;" @click.stop="openTransfer(k._id, 'laundry', 'available', k.cleaningStock)">➔ Tersedia</button>
                    <div v-if="transferActive.kebayaId === k._id && transferActive.from === 'laundry'" style="display: flex; gap: 5px; background: #f9f9f9; padding: 5px; border-radius: 4px; border: 1px solid #ddd;" @click.stop>
                      <input type="number" v-model="transferAmount" :max="transferActive.max" min="1" class="input" style="width: 50px; padding: 2px; margin: 0; font-size: 1em;" />
                      <button class="btn" style="background: var(--success); padding: 2px 5px; font-size: 1em;" @click.stop="confirmTransfer">OK</button>
                      <button class="btn" style="background: #ccc; padding: 2px 5px; font-size: 1em; color: black;" @click.stop="cancelTransfer">X</button>
                    </div>
                  </div>
                  <div v-if="k.maintenanceStock > 0" style="display: flex; flex-direction: column; gap: 5px;">
                    <span style="color: #e67e22; font-size: 1em; font-weight: bold;">{{ k.maintenanceStock }} di Perbaikan</span>
                    <button class="btn" style="background: var(--success); padding: 2px 5px; font-size: 1em; align-self: flex-start;" @click.stop="openTransfer(k._id, 'maintenance', 'available', k.maintenanceStock)">➔ Tersedia</button>
                    <div v-if="transferActive.kebayaId === k._id && transferActive.from === 'maintenance'" style="display: flex; gap: 5px; background: #f9f9f9; padding: 5px; border-radius: 4px; border: 1px solid #ddd;" @click.stop>
                      <input type="number" v-model="transferAmount" :max="transferActive.max" min="1" class="input" style="width: 50px; padding: 2px; margin: 0; font-size: 1em;" />
                      <button class="btn" style="background: var(--success); padding: 2px 5px; font-size: 1em;" @click.stop="confirmTransfer">OK</button>
                      <button class="btn" style="background: #ccc; padding: 2px 5px; font-size: 1em; color: black;" @click.stop="cancelTransfer">X</button>
                    </div>
                  </div>
                  <span v-if="!k.cleaningStock && !k.maintenanceStock" style="color: var(--text-muted); font-size: 1em;">-</span>
                </td>
                <td>
                  <button class="btn" style="padding: 2px 8px; font-size: 1em; background: var(--primary-hover);" @click.stop="toggleRow(k._id)">
                    {{ expandedRow === k._id ? 'Tutup' : 'Penyewa' }}
                  </button>
                  <button class="btn" style="padding: 2px 8px; font-size: 1em; margin-left: 5px; background: #f39c12;" @click.stop="editKebaya(k)">Edit</button>
                  <button class="btn" style="padding: 2px 8px; font-size: 1em; margin-left: 5px; background: var(--danger);" @click.stop="deleteKebaya(k._id)">Hapus</button>
                </td>
              </tr>
              <!-- Expandable Row Content -->
              <tr v-if="expandedRow === k._id">
                <td colspan="8" style="background: #fafafa; padding: 15px; border-bottom: 1px solid var(--surface-border); box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
                  <div v-if="getRentalsForKebaya(k._id).length > 0">
                    <h4 style="margin-bottom: 10px; color: var(--primary-color);">Sedang Disewa Oleh:</h4>
                    <ul style="padding-left: 20px; font-size: 1em;">
                      <li v-for="r in getRentalsForKebaya(k._id)" :key="r._id" style="margin-bottom: 5px; cursor: pointer; color: #2980b9; transition: color 0.2s;" @mouseover="($event.target as HTMLElement).style.textDecoration = 'underline'" @mouseleave="($event.target as HTMLElement).style.textDecoration = 'none'" @click="router.push({ path: '/penyewaan', query: { search: r.transactionId } })">
                        <strong>{{ r.customerId.name }}</strong> ({{ r.customerId.telephone }}) - 
                        <em>Jatuh Tempo: {{ new Date(r.expectedReturnDate).toLocaleDateString('id-ID') }}</em>
                        <span v-if="new Date(r.expectedReturnDate) < new Date()" style="color: red; font-weight: bold; margin-left: 10px;">[TELAT]</span>
                      </li>
                    </ul>
                  </div>
                  <div v-else style="color: var(--text-muted); font-size: 1em; font-style: italic;">
                    Tidak ada stok yang sedang disewa saat ini.
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="filteredAndSortedRooms.length === 0">
              <td colspan="8" style="text-align: center; padding: 20px;">Tidak ada data yang cocok dengan pencarian.</td>
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
import { useApi } from '../composables/useApi';

const router = useRouter();
const { getRooms, getActiveRentals } = useApi();
const rooms = ref<any[]>([]);
const activeRentals = ref<any[]>([]);
const pending = ref(true);
const showForm = ref(false);

const searchQuery = ref('');
const sortKey = ref('tipeKamar');
const sortDesc = ref(false);
const expandedRow = ref<string | null>(null);
const isEditing = ref(false);
const editId = ref<string | null>(null);

const sortByCol = (key: string) => {
  if (sortKey.value === key) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortKey.value = key;
    sortDesc.value = false;
  }
};

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
};

const currentPage = ref(1);
const itemsPerPage = ref(10);

const form = ref({ tipeKamar: '', fasilitas: '', price: '', totalStock: '' });
const imageFile = ref<File | null>(null);
const imagePreview = ref<string | null>(null);

const transferActive = ref({ kebayaId: null, from: '', to: '', max: 1 });
const transferAmount = ref(1);

const fetchData = async () => {
  pending.value = true;
  rooms.value = await getRooms();
  activeRentals.value = await getActiveRentals();
  pending.value = false;
};

const handleFileUpload = (e: any) => {
  const file = e.target.files[0];
  if (file) {
    imageFile.value = file;
    imagePreview.value = URL.createObjectURL(file);
  } else {
    imageFile.value = null;
    imagePreview.value = null;
  }
};

const saveKebaya = async () => {
  if (!form.value.tipeKamar || !form.value.fasilitas || !form.value.price || !form.value.totalStock) {
    return alert('Harap isi semua field');
  }

  const formData = new FormData();
  formData.append('tipeKamar', form.value.tipeKamar);
  formData.append('fasilitas', form.value.fasilitas);
  formData.append('price', String(form.value.price));
  formData.append('totalStock', String(form.value.totalStock));
  
  if (!isEditing.value) {
    formData.append('availableStock', String(form.value.totalStock));
  }

  if (imageFile.value) {
    formData.append('image', imageFile.value);
  }

  try {
    const url = isEditing.value ? `http://localhost:3001/api/rooms/${editId.value}` : 'http://localhost:3001/api/rooms';
    const method = isEditing.value ? 'PUT' : 'POST';

    const res = await fetch(url, { method, body: formData });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Server error');
    }
    cancelEdit();
    fetchData();
  } catch (err: any) {
    alert('Gagal menyimpan room: ' + err.message);
  }
};

const cancelEdit = () => {
  showForm.value = false;
  isEditing.value = false;
  editId.value = null;
  form.value = { tipeKamar: '', fasilitas: '', price: '', totalStock: '' };
  imageFile.value = null;
  imagePreview.value = null;
};

const editKebaya = (k: any) => {
  isEditing.value = true;
  editId.value = k._id;
  form.value = { tipeKamar: k.tipeKamar, fasilitas: k.fasilitas, price: k.price, totalStock: k.totalStock };
  imagePreview.value = k.imageUrl ? `http://localhost:3001${k.imageUrl}` : null;
  showForm.value = true;
};

const deleteKebaya = async (id: string) => {
  if (confirm('Anda yakin ingin menghapus room ini?')) {
    try {
      await fetch(`http://localhost:3001/api/rooms/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert('Gagal menghapus room');
    }
  }
};

const openTransfer = (kebayaId: string, from: string, to: string, maxAmount: number) => {
  transferActive.value = { kebayaId: kebayaId as any, from, to, max: maxAmount };
  transferAmount.value = 1;
};

const cancelTransfer = () => {
  transferActive.value = { kebayaId: null, from: '', to: '', max: 1 };
  transferAmount.value = 1;
};

const confirmTransfer = async () => {
  const { kebayaId, from, to, max } = transferActive.value;
  const amount = transferAmount.value;
  if (!kebayaId || amount <= 0 || amount > max) {
    return alert('Jumlah tidak valid!');
  }

  try {
    const res = await fetch(`http://localhost:3001/api/rooms/${kebayaId}/transfer-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, amount })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal memindahkan stok');
    }
    cancelTransfer();
    fetchData();
  } catch(err: any) {
    alert(err.message);
  }
};

const adjustStock = async (k: any, amount: number) => {
  const newStock = Number(k.totalStock) + amount;
  if (newStock < 0) return;
  const newAvailable = Number(k.availableStock) + amount;
  
  const formData = new FormData();
  formData.append('totalStock', String(newStock));
  formData.append('availableStock', String(newAvailable));
  
  await fetch(`http://localhost:3001/api/rooms/${k._id}`, { method: 'PUT', body: formData });
  fetchData();
};

const toggleRow = (id: string) => {
  expandedRow.value = expandedRow.value === id ? null : id;
};

const getRentalsForKebaya = (kebayaId: string) => {
  return activeRentals.value.filter(r => r.kebayaId && r.kebayaId._id === kebayaId);
};

const filteredAndSortedRooms = computed(() => {
  let result = [...rooms.value];
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(k => k.tipeKamar.toLowerCase().includes(q) || k.fasilitas.toLowerCase().includes(q));
  }
  
  result.sort((a, b) => {
    let valA = a[sortKey.value];
    let valB = b[sortKey.value];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return sortDesc.value ? 1 : -1;
    if (valA > valB) return sortDesc.value ? -1 : 1;
    return 0;
  });
  
  return result;
});

const totalPages = computed(() => Math.ceil(filteredAndSortedRooms.value.length / itemsPerPage.value));

const paginatedRooms = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredAndSortedRooms.value.slice(start, start + itemsPerPage.value);
});

onMounted(fetchData);
</script>
