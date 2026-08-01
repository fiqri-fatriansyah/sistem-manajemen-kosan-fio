<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h1 class="page-title">Audit Log</h1>
      <a href="http://localhost:3001/api/audit/export/pdf" target="_blank">
        <button class="btn" style="background: #c62828;">Print PDF Log</button>
      </a>
    </div>

    <div class="material-card">
      <div v-if="pending">Memuat log...</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>Waktu</th>
            <th>Aksi</th>
            <th>Entitas</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log._id">
            <td>{{ new Date(log.timestamp).toLocaleString('id-ID') }}</td>
            <td>
              <span :style="{ fontWeight: 'bold', color: getActionColor(log.action) }">
                {{ log.action }}
              </span>
            </td>
            <td>{{ log.entity }}</td>
            <td>{{ log.details }}</td>
          </tr>
          <tr v-if="logs.length === 0">
            <td colspan="4" style="text-align: center; padding: 20px;">Tidak ada aktivitas terekam.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const logs = ref<any[]>([]);
const pending = ref(true);

const fetchLogs = async () => {
  pending.value = true;
  try {
    const res = await fetch('http://localhost:3001/api/audit');
    logs.value = await res.json();
  } catch (err) {
    console.error(err);
  }
  pending.value = false;
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

onMounted(fetchLogs);
</script>
