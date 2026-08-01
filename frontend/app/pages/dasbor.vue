<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
      <h1 class="page-title" style="margin-bottom: 0;">Dasbor Analitik</h1>
      <div style="display: flex; gap: 0.625rem;">
        <a href="http://localhost:3001/api/reports/dashboard?format=pdf" target="_blank">
          <button class="btn" style="background: #c62828; font-size: 1rem;">Export PDF</button>
        </a>
        <a href="http://localhost:3001/api/reports/dashboard?format=excel" target="_blank">
          <button class="btn" style="background: #107c41; font-size: 1rem;">Export Excel</button>
        </a>
        <a href="http://localhost:3001/api/reports/dashboard?format=word" target="_blank">
          <button class="btn" style="background: #2b579a; font-size: 1rem;">Export Word</button>
        </a>
      </div>
    </div>

    <div v-if="pending">Memuat grafik...</div>
    <div v-else-if="error" style="color: var(--danger)">Gagal memuat data dari server.</div>
    <div v-else>
      <!-- 4 Metrics Cards -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 1.875rem;">
        <div class="material-card" style="text-align: center; background: linear-gradient(135deg, #2980b9, #3498db); color: white;">
          <h3 style="font-size: 1rem; margin-bottom: 0.625rem; font-weight: normal; opacity: 0.9;">Tingkat Hunian</h3>
          <div style="font-size: 2.5rem; font-weight: bold;">{{ stats?.metrics?.tingkatHunian || 0 }}%</div>
        </div>
        <div class="material-card" style="text-align: center; background: linear-gradient(135deg, #16a085, #1abc9c); color: white;">
          <h3 style="font-size: 1rem; margin-bottom: 0.625rem; font-weight: normal; opacity: 0.9;">Kamar Kosong Hari Ini</h3>
          <div style="font-size: 2.5rem; font-weight: bold;">{{ stats?.metrics?.kamarKosong || 0 }}</div>
        </div>
        <div class="material-card" style="text-align: center; background: linear-gradient(135deg, #c0392b, #e74c3c); color: white;">
          <h3 style="font-size: 1rem; margin-bottom: 0.625rem; font-weight: normal; opacity: 0.9;">Total Tunggakan</h3>
          <div style="font-size: 1.8rem; font-weight: bold; margin-top: 0.625rem;">Rp {{ formatRupiah(stats?.metrics?.totalTunggakan || 0) }}</div>
        </div>
        <div class="material-card" style="text-align: center; background: linear-gradient(135deg, #d35400, #e67e22); color: white;">
          <h3 style="font-size: 1rem; margin-bottom: 0.625rem; font-weight: normal; opacity: 0.9;">Penghuni Bermasalah</h3>
          <div style="font-size: 2.5rem; font-weight: bold;">{{ stats?.metrics?.jumlahPenghuniBermasalah || 0 }}</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="material-card">
          <h3 style="margin-bottom: 0; color: #c0392b; text-align: center;">Tunggakan berdasarkan Tipe Room</h3>
          <div style="height: 25rem; position: relative;">
            <Pie :data="tunggakanRoomTypeChartData" :options="pieOptions" />
          </div>
        </div>

        <div class="material-card">
          <h3 style="margin-bottom: 0; color: #d35400; text-align: center;">Overstay vs Tunggakan (Jumlah Kasus)</h3>
          <div style="height: 25rem; position: relative;">
            <Pie :data="overstayVsTunggakanChartData" :options="pieOptions" />
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="material-card">
          <h3 style="margin-bottom: 0; color: var(--primary-color);">Pendapatan per Bulan (Rp)</h3>
          <div style="height: 25rem; position: relative;">
            <Bar :data="revenueChartData" :options="barOptions" />
          </div>
        </div>

        <div class="material-card">
          <h3 style="margin-bottom: 0; color: #f39c12;">Top 5 Pelanggan Paling Bernilai (Pendapatan Rp)</h3>
          <div style="height: 25rem; position: relative;">
            <Bar :data="topValueCustomersData" :options="barOptions" />
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="material-card">
          <h3 style="margin-bottom: 0; color: var(--primary-color);">Tren Penyewaan</h3>
          <div style="height: 25rem; position: relative;">
            <Line :data="rentalsChartData" :options="lineOptions" />
          </div>
        </div>

        <div class="material-card">
          <h3 style="margin-bottom: 0; color: var(--primary-color); text-align: center;">Room Terpopuler</h3>
          <div style="height: 25rem; position: relative;">
            <Pie :data="popularityChartData" :options="pieOptions" />
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="material-card">
          <h3 style="margin-bottom: 0; color: #c0392b; text-align: center;">Pelanggan Bermasalah (Denda / Batal)</h3>
          <div style="height: 25rem; position: relative;">
            <Bar :data="problematicCustomersData" :options="barOptions" />
          </div>
        </div>

        <div class="material-card">
          <h3 style="margin-bottom: 0; color: #8e44ad;">Segmentasi Loyalitas Pelanggan</h3>
          <div style="height: 25rem; position: relative;">
            <Pie :data="loyaltyChartData" :options="pieOptions" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useApi } from '../composables/useApi';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar, Line, Pie } from 'vue-chartjs';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, ChartDataLabels);

const { getDashboardStats } = useApi();
const stats = ref<any>(null);
const allRentals = ref<any[]>([]);
const pending = ref(true);
const error = ref(false);

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

const numberFormatter = (value: number) => {
  if (value >= 1000000) return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'jt';
  if (value >= 1000) return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'rb';
  return value;
};

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID').format(number || 0);
};

const barOptions = { 
  responsive: true, 
  maintainAspectRatio: false,
  layout: { padding: 0 },
  plugins: {
    legend: { labels: { padding: 5 } },
    datalabels: {
      color: 'var(--text-main)',
      align: 'end' as const,
      anchor: 'end' as const,
      formatter: (value: any) => value > 0 ? numberFormatter(value) : null,
      font: { weight: 'bold' as const, size: 12 }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grace: '15%',
      ticks: {
        precision: 0,
        callback: numberFormatter
      }
    }
  }
};

const lineOptions = { 
  responsive: true, 
  maintainAspectRatio: false,
  layout: { padding: 0 },
  plugins: {
    legend: { labels: { padding: 5 } },
    datalabels: {
      color: '#388e3c',
      align: 'top' as const,
      anchor: 'end' as const,
      formatter: (value: any) => value > 0 ? value : null,
      font: { weight: 'bold' as const, size: 12 }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grace: '15%',
      ticks: { precision: 0, stepSize: 1 }
    }
  }
};
const pieOptions = { 
  responsive: true, 
  maintainAspectRatio: false,
  layout: { padding: 20 },
  plugins: {
    legend: { labels: { padding: 20 } },
    datalabels: {
      color: '#fff',
      formatter: (value: any, ctx: any) => {
        let sum = 0;
        let dataArr = ctx.chart.data.datasets[0].data;
        dataArr.map((data: number) => { sum += data; });
        let percentage = (value * 100 / sum).toFixed(1) + "%";
        return value > 0 ? `${value}\n(${percentage})` : null;
      },
      font: { weight: 'bold' as const, size: 12 },
      textAlign: 'center' as const
    }
  }
};

const revenueChartData = computed(() => {
  return {
    labels: months,
    datasets: [{
      label: 'Pendapatan',
      backgroundColor: '#6200ea',
      data: stats.value?.charts?.revenuePerMonth || []
    }]
  };
});

const tunggakanRoomTypeChartData = computed(() => {
  const map: Record<string, number> = {};
  for (const r of allRentals.value) {
    if (r.tunggakanAmount && r.tunggakanAmount > 0) {
      const typeName = r.roomId?.roomTypeId?.name || 'Lainnya';
      map[typeName] = (map[typeName] || 0) + r.tunggakanAmount;
    }
  }
  return {
    labels: Object.keys(map).length > 0 ? Object.keys(map) : ['Tidak Ada Tunggakan'],
    datasets: [{
      backgroundColor: ['#e74c3c', '#f1c40f', '#e67e22', '#c0392b', '#d35400'],
      data: Object.keys(map).length > 0 ? Object.values(map) : [1]
    }]
  };
});

const overstayVsTunggakanChartData = computed(() => {
  let overstay = 0;
  let tunggakan = 0;
  for (const r of allRentals.value) {
    if (r.currentStatusText === 'Overstay' || r.uiStatus === 'Overstay') overstay++;
    if (r.tunggakanAmount && r.tunggakanAmount > 0) tunggakan++;
  }
  
  if (overstay === 0 && tunggakan === 0) {
    return { labels: ['Tidak Ada Kasus'], datasets: [{ backgroundColor: ['#2ecc71'], data: [1] }] };
  }
  
  return {
    labels: ['Tunggakan (Belum Bayar)', 'Overstay (Lewat Tanggal)'],
    datasets: [{
      backgroundColor: ['#e74c3c', '#e67e22'],
      data: [tunggakan, overstay]
    }]
  };
});

const rentalsChartData = computed(() => {
  return {
    labels: months,
    datasets: [{
      label: 'Jumlah Penyewaan',
      borderColor: '#388e3c',
      backgroundColor: 'rgba(56, 142, 60, 0.2)',
      data: stats.value?.charts?.rentalsPerMonth || [],
      fill: true
    }]
  };
});

const popularityChartData = computed(() => {
  let popData = stats.value?.charts?.kebayaPopularity || [];
  popData.sort((a: any, b: any) => b.count - a.count);
  
  if (popData.length > 4) {
    const top4 = popData.slice(0, 4);
    const others = popData.slice(4).reduce((sum: number, curr: any) => sum + curr.count, 0);
    popData = [...top4, { label: 'Lainnya', count: others }];
  }

  return {
    labels: popData.map((d: any) => d.label),
    datasets: [{
      backgroundColor: ['#6200ea', '#3700b3', '#03dac6', '#cf6679', '#95a5a6'],
      data: popData.map((d: any) => d.count)
    }]
  };
});

const topValueCustomersData = computed(() => {
  const data = stats.value?.charts?.topValueCustomers || [];
  return {
    labels: data.map((d: any) => d.label),
    datasets: [{
      label: 'Total Pendapatan',
      backgroundColor: '#f39c12',
      data: data.map((d: any) => d.revenue)
    }]
  };
});

const loyaltyChartData = computed(() => {
  const data = stats.value?.charts?.customerLoyalty || [];
  return {
    labels: data.map((d: any) => d.label),
    datasets: [{
      backgroundColor: ['#e74c3c', '#f1c40f', '#2ecc71'],
      data: data.map((d: any) => d.count)
    }]
  };
});

const depositChartData = computed(() => {
  const data = stats.value?.charts?.depositStatus || [];
  return {
    labels: data.map((d: any) => d.label),
    datasets: [{
      backgroundColor: ['#27ae60', '#c0392b'],
      data: data.map((d: any) => d.count)
    }]
  };
});

const problematicCustomersData = computed(() => {
  const data = stats.value?.charts?.problematicCustomers || [];
  return {
    labels: data.map((d: any) => d.label),
    datasets: [{
      label: 'Poin Masalah (Batal / Denda)',
      backgroundColor: '#e74c3c',
      data: data.map((d: any) => d.count)
    }]
  };
});

onMounted(async () => {
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--base-font-size')) || 18;
  ChartJS.defaults.font.size = rootFontSize;
  ChartJS.defaults.font.family = "'Arial', 'Calibri', sans-serif";
  ChartJS.defaults.color = "#212121";

  try {
    stats.value = await getDashboardStats();
    const res = await fetch('http://localhost:3001/api/rentals');
    allRentals.value = await res.json();
  } catch (e) {
    error.value = true;
  } finally {
    pending.value = false;
  }
});
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}
.full-width-card {
  width: 100%;
  margin: 0 auto;
  margin-bottom: 1.25rem;
}
.half-width-card {
  width: 50%;
  margin: 0 auto;
  margin-bottom: 1.25rem;
}

@media (max-width: 48rem) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .half-width-card {
    width: 100%;
  }
}
</style>
