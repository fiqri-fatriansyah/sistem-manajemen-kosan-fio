<template>
  <div>
    <h1 class="page-title">Daftar Pelanggan</h1>
    <div class="material-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <h2>Pelanggan</h2>
        <button class="btn" @click="showForm = true">Tambah Pelanggan</button>
      </div>

      <div v-if="showForm" style="margin-bottom: 1.25rem; padding: 0.9375rem; border: 1px solid var(--surface-border); border-radius: 0.5rem;">
        <h3 style="margin-bottom: 0.625rem;">{{ isEditing ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru' }}</h3>
        <label>Nama Pelanggan *</label>
        <input v-model="form.name" class="input" />
        <label>Telephone *</label>
        <input v-model="form.telephone" class="input" />
        <label>Alamat (Opsional)</label>
        <input v-model="form.address" class="input" />
        <label>Email (Opsional)</label>
        <input v-model="form.email" type="email" class="input" />
        <button class="btn" @click="saveCustomer">{{ isEditing ? 'Simpan Perubahan' : 'Simpan' }}</button>
        <button class="btn" @click="cancelEdit" style="background: #e0e0e0; color: #000; margin-left: 0.625rem;">Batal</button>
      </div>

      <div v-if="pending">Memuat...</div>
      <div v-else style="overflow-x: auto; width: 100%;">
        <table class="table">
        <thead>
          <tr>
            <th @click="sortBy('name')" style="cursor: pointer;">Nama <span v-if="sortKey === 'name'">{{ sortDesc ? '↓' : '↑' }}</span></th>
            <th @click="sortBy('telephone')" style="cursor: pointer;">Telephone <span v-if="sortKey === 'telephone'">{{ sortDesc ? '↓' : '↑' }}</span></th>
            <th @click="sortBy('address')" style="cursor: pointer;">Alamat <span v-if="sortKey === 'address'">{{ sortDesc ? '↓' : '↑' }}</span></th>
            <th @click="sortBy('email')" style="cursor: pointer;">Email <span v-if="sortKey === 'email'">{{ sortDesc ? '↓' : '↑' }}</span></th>
            <th>Penyewaan Aktif</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="c in paginatedCustomers" :key="c._id">
            <tr style="cursor: pointer; transition: background 0.2s;" @click="toggleRow(c._id)" :style="expandedRow === c._id ? 'background: #f0f0f0;' : ''">
              <td>{{ c.name }}</td>
              <td>{{ c.telephone }}</td>
              <td>{{ c.address || '-' }}</td>
              <td>{{ c.email || '-' }}</td>
              <td>
                <button class="btn" style="padding: 0.125rem 0.5rem; font-size: 0.8rem; background: var(--primary-hover);" @click.stop="toggleRow(c._id)">
                  {{ expandedRow === c._id ? 'Tutup' : 'Lihat Sewa' }}
                </button>
              </td>
              <td>
                <button class="btn" style="padding: 0.125rem 0.5rem; font-size: 0.8rem; background: #f39c12;" @click.stop="editCustomer(c)">Edit</button>
                <button class="btn" style="padding: 0.125rem 0.5rem; font-size: 0.8rem; margin-left: 0.3125rem; background: var(--danger);" @click.stop="deleteCustomer(c._id)">Hilangkan</button>
              </td>
            </tr>
            <tr v-if="expandedRow === c._id">
              <td colspan="5" style="background: #fafafa; padding: 0.9375rem; border-bottom: 1px solid var(--surface-border); box-shadow: inset 0 0.125rem 0.25rem rgba(0,0,0,0.05);">
                <div v-if="getRentalsForCustomer(c._id).length > 0">
                  <h4 style="margin-bottom: 0.625rem; color: var(--primary-color);">Daftar Room yang Sedang Disewa:</h4>
                  <ul style="padding-left: 1.25rem; font-size: 0.9rem;">
                    <li v-for="r in getRentalsForCustomer(c._id)" :key="r._id" style="margin-bottom: 0.625rem; display: flex; align-items: center; gap: 0.625rem;">
                      <img v-if="r.roomId?.imageUrl" :src="'http://localhost:3001' + r.roomId.imageUrl" style="width: 1.875rem; height: 1.875rem; border-radius: 0.25rem; object-fit: cover;" />
                      <div v-else style="width: 1.875rem; height: 1.875rem; background: #eee; border-radius: 0.25rem; display: flex; align-items: center; justify-content: center; font-size: 0.6em; color: #999;">No Img</div>
                      <div>
                        <strong>{{ r.roomId.tipeKamar }} ({{ r.roomId.fasilitas }})</strong> - 
                        <em>Jatuh Tempo: {{ new Date(r.expectedReturnDate).toLocaleDateString('id-ID') }}</em>
                        <span v-if="new Date(r.expectedReturnDate) < new Date()" style="color: red; font-weight: bold; margin-left: 0.625rem;">[TELAT]</span>
                      </div>
                    </li>
                  </ul>
                </div>
                <div v-else style="color: var(--text-muted); font-size: 0.9rem; font-style: italic;">
                  Pelanggan ini tidak sedang menyewa room.
                </div>
              </td>
            </tr>
          </template>
          <tr v-if="customers.length === 0">
            <td colspan="6" style="text-align: center; padding: 1.25rem">Belum ada data pelanggan</td>
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
import { ref, computed, onMounted } from 'vue';
import { useApi } from '../composables/useApi';

const { getCustomers, getActiveRentals } = useApi();
const customers = ref<any[]>([]);
const activeRentals = ref<any[]>([]);
const pending = ref(true);
const showForm = ref(false);
const isEditing = ref(false);
const editId = ref<string | null>(null);
const expandedRow = ref<string | null>(null);
const form = ref({ name: '', telephone: '', address: '', email: '' });

const sortKey = ref('name');
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

const sortedCustomers = computed(() => {
  let result = [...customers.value];
  result.sort((a, b) => {
    let valA = (a[sortKey.value] || '').toLowerCase();
    let valB = (b[sortKey.value] || '').toLowerCase();
    
    if (valA < valB) return sortDesc.value ? 1 : -1;
    if (valA > valB) return sortDesc.value ? -1 : 1;
    return 0;
  });
  return result;
});

const totalPages = computed(() => Math.ceil(sortedCustomers.value.length / itemsPerPage.value));

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return sortedCustomers.value.slice(start, start + itemsPerPage.value);
});

const fetchData = async () => {
  pending.value = true;
  customers.value = await getCustomers();
  
  // Sort rentals by expectedReturnDate ascending so closest/late returns are first
  const rawRentals = await getActiveRentals();
  activeRentals.value = rawRentals.sort((a: any, b: any) => 
    new Date(a.expectedReturnDate).getTime() - new Date(b.expectedReturnDate).getTime()
  );
  
  pending.value = false;
};

const toggleRow = (id: string) => {
  expandedRow.value = expandedRow.value === id ? null : id;
};

const getRentalsForCustomer = (customerId: string) => {
  return activeRentals.value.filter(r => r.customerId && r.customerId._id === customerId);
};

const saveCustomer = async () => {
  if (!form.value.name || !form.value.telephone) return alert('Nama dan Telephone harus diisi');

  try {
    const url = isEditing.value ? `http://localhost:3001/api/customers/${editId.value}` : 'http://localhost:3001/api/customers';
    const method = isEditing.value ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });
    
    cancelEdit();
    fetchData();
  } catch (err) {
    alert('Gagal menyimpan pelanggan');
  }
};

const cancelEdit = () => {
  showForm.value = false;
  isEditing.value = false;
  editId.value = null;
  form.value = { name: '', telephone: '', address: '', email: '' };
};

const editCustomer = (c: any) => {
  isEditing.value = true;
  editId.value = c._id;
  form.value = { name: c.name, telephone: c.telephone, address: c.address, email: c.email };
  showForm.value = true;
};

const deleteCustomer = async (id: string) => {
  if (confirm('Anda yakin ingin menghilangkan (soft-delete) pelanggan ini?')) {
    try {
      await fetch(`http://localhost:3001/api/customers/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert('Gagal menghilangkan pelanggan');
    }
  }
};

onMounted(fetchData);
</script>
<style scoped>label { font-size: 0.9em; font-weight: 500; display: block; margin-bottom: 0.3125rem; color: var(--text-muted); }</style>
