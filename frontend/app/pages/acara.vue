<template>
  <div>
    <h1 class="page-title">Acara & Hari Libur</h1>
    <div class="material-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <h2>Daftar Acara</h2>
        <button class="btn" @click="showForm = true">Tambah Acara</button>
      </div>

      <div v-if="showForm" style="margin-bottom: 1.25rem; padding: 0.9375rem; border: 1px solid var(--surface-border); border-radius: 0.5rem;">
        <label>Nama Acara</label>
        <input v-model="form.name" class="input" />
        <label>Tanggal</label>
        <input v-model="form.date" type="date" class="input" />
        <label>Deskripsi</label>
        <input v-model="form.description" class="input" />
        <label>Pengulangan</label>
        <select v-model="form.recurring" class="input">
          <option value="none">Tidak Ada</option>
          <option value="weekly">Setiap Minggu</option>
          <option value="monthly">Setiap Bulan</option>
          <option value="yearly">Setiap Tahun</option>
        </select>
        <button class="btn" @click="addEvent">Simpan</button>
        <button class="btn" @click="showForm = false" style="background: #e0e0e0; color: #000; margin-left: 0.625rem;">Batal</button>
      </div>

      <div v-if="pending">Memuat...</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Acara</th>
            <th>Deskripsi</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in events" :key="e._id + e.date">
            <td>
              {{ new Date(e.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
              <span v-if="e.recurring !== 'none'" style="font-size: 1em; background: var(--primary-color); color: white; padding: 0.125rem 0.3125rem; border-radius: 0.25rem; margin-left: 0.3125rem; display: inline-block;">
                 <template v-if="e.recurring === 'weekly'">Mingguan</template>
                 <template v-else-if="e.recurring === 'monthly'">Bulanan</template>
                 <template v-else-if="e.recurring === 'yearly'">Tahunan</template>
               </span>
            </td>
            <td>
              {{ e.name }}
              <span v-if="e.isPublicHoliday" style="font-size: 1em; background: var(--danger); color: white; padding: 0.125rem 0.3125rem; border-radius: 0.25rem; margin-left: 0.3125rem; display: inline-block; margin-top: 0.3125rem;">Libur Nasional</span>
            </td>
            <td>{{ e.description }}</td>
            <td>
              <button class="btn" style="background: var(--danger); padding: 0.3125rem 0.625rem; font-size: 1em;" @click="deleteEvent(e._id)">Hapus</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '../composables/useApi';

const { getEvents } = useApi();
const events = ref<any[]>([]);
const pending = ref(true);
const showForm = ref(false);
const form = ref({ name: '', date: '', description: '', recurring: 'none' });

const fetchEvents = async () => {
  pending.value = true;
  events.value = await getEvents();
  pending.value = false;
};

const addEvent = async () => {
  if (!form.value.name || !form.value.date) return alert('Nama dan Tanggal harus diisi');
  try {
    await fetch('http://localhost:3011/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });
    showForm.value = false;
    form.value = { name: '', date: '', description: '', recurring: 'none' };
    fetchEvents();
  } catch (err) {
    alert('Gagal menambah acara');
  }
};

const deleteEvent = async (id: string) => {
  if (confirm('Hapus acara ini?')) {
    await fetch(`http://localhost:3011/api/events/${id}`, { method: 'DELETE' });
    fetchEvents();
  }
};

onMounted(fetchEvents);
</script>
<style>label { font-size: 1em; font-weight: 500; display: block; margin-bottom: 0.3125rem; color: var(--text-muted); }</style>
