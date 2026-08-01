<template>
  <div>
    <h1 style="color: var(--primary-color); margin-bottom: 1.875rem;">Timeline Kalender</h1>
    <p style="color: var(--text-muted); margin-bottom: 1.25rem;">Lihat dan kelola ketersediaan ruangan secara visual berdasarkan tanggal dan waktu booking berjalan.</p>
    
    <div class="material-card" style="margin-bottom: 1.875rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <button class="btn" style="background: var(--surface-bg); color: var(--text-main); border: 1px solid var(--surface-border);" @click="prevMonth">◀ Bulan Sebelumnya</button>
        <h2 style="margin: 0; color: var(--primary-color);">{{ monthName }} {{ currentYear }}</h2>
        <button class="btn" style="background: var(--surface-bg); color: var(--text-main); border: 1px solid var(--surface-border);" @click="nextMonth">Bulan Selanjutnya ▶</button>
      </div>

      <div style="display: flex; gap: 0.9375rem; margin-bottom: 1.25rem; flex-wrap: wrap; background: #f9f9f9; padding: 0.9375rem; border-radius: 0.5rem; border: 1px solid var(--surface-border);">
        <input type="text" v-model="searchQuery" class="input" style="flex: 1; min-width: 12.5rem; margin-bottom: 0;" placeholder="Cari Room atau Penghuni..." />
        <select v-model="filterRoomTypeId" class="input" style="flex: 1; min-width: 12.5rem; margin-bottom: 0;">
          <option value="">Semua Tipe Room</option>
          <option v-for="rt in roomTypes" :key="rt._id" :value="rt._id">{{ rt.name }}</option>
        </select>
        <select v-model="sortBy" class="input" style="flex: 1; min-width: 12.5rem; margin-bottom: 0;">
          <option value="roomNumber">Urutkan: Nomor Room</option>
          <option value="type">Urutkan: Tipe Room</option>
        </select>
      </div>

      <div v-if="loading" style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
        Memuat kalender...
      </div>
      <div v-else style="overflow-x: auto; width: 100%; border: 1px solid var(--surface-border); border-radius: 0.5rem; background: white;">
        <table style="width: 100%; min-width: 50rem; border-collapse: collapse;">
          <thead>
            <tr style="background: var(--surface-bg);">
              <th style="padding: 0.9375rem; border-right: 1px solid var(--surface-border); border-bottom: 1px solid var(--surface-border); min-width: 12.5rem; position: sticky; left: 0; background: var(--surface-bg); z-index: 2; text-align: left;">Room</th>
              <th v-for="day in daysInMonth" :key="day" style="padding: 0.625rem; border-right: 1px solid var(--surface-border); border-bottom: 1px solid var(--surface-border); min-width: 3.125rem; text-align: center; font-size: 0.9em; color: var(--text-muted);">
                {{ day }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="room in paginatedRooms" :key="room._id" style="border-bottom: 1px solid var(--surface-border);">
              <td style="padding: 0.625rem 0.9375rem; border-right: 1px solid var(--surface-border); position: sticky; left: 0; background: white; z-index: 1;">
                <strong>{{ room.roomNumber }}</strong><br>
                <span style="font-size: 0.8em; color: #666;">{{ room.roomTypeId?.name }}</span>
              </td>
              <!-- Render timeline cells -->
              <td v-for="day in daysInMonth" :key="day" style="padding: 0; border-right: 1px solid var(--surface-border); position: relative; height: 3.75rem; background: #fafafa;">
                <div v-for="(rental, i) in getRentalsForDay(room._id, day)" :key="rental._id"
                     :style="getRentalStyle(rental, day)"
                     class="timeline-bar"
                     :title="getRentalTitle(rental)">
                  <span style="display: block; font-size: 0.7em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 0.3125rem;">
                    {{ rental.customerIds[0]?.name }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="!loading" style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.25rem; flex-wrap: wrap; gap: 0.625rem;">
        <div style="display: flex; align-items: center; gap: 0.625rem;">
          <span style="color: var(--text-muted); font-size: 0.9em;">Tampilkan:</span>
          <select v-model="itemsPerPage" class="input" style="margin-bottom: 0; padding: 0.3125rem; width: auto; font-size: 0.9em;" @change="currentPage = 1">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span style="color: var(--text-muted); font-size: 0.9em;">Data per halaman</span>
        </div>
        
        <div v-if="totalPages > 1" style="display: flex; align-items: center; gap: 0.9375rem;">
          <span style="color: var(--text-muted); font-size: 0.9em;">Halaman {{ currentPage }} dari {{ totalPages }}</span>
          <div style="display: flex; gap: 0.3125rem;">
            <button class="btn" :disabled="currentPage === 1" @click="currentPage--" style="padding: 0.3125rem 0.625rem;">Sebelumnya</button>
            <button class="btn" :disabled="currentPage === totalPages" @click="currentPage++" style="padding: 0.3125rem 0.625rem;">Selanjutnya</button>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 1.25rem; display: flex; gap: 1.25rem; font-size: 0.9em; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 0.3125rem;">
          <div style="width: 0.9375rem; height: 0.9375rem; background: rgba(39, 174, 96, 0.8); border-radius: 0.125rem;"></div> Lunas / Active (Harian)
        </div>
        <div style="display: flex; align-items: center; gap: 0.3125rem;">
          <div style="width: 0.9375rem; height: 0.9375rem; background: rgba(142, 68, 173, 0.8); border-radius: 0.125rem;"></div> Lunas / Active (Bulanan)
        </div>
        <div style="display: flex; align-items: center; gap: 0.3125rem;">
          <div style="width: 0.9375rem; height: 0.9375rem; background: rgba(243, 156, 18, 0.8); border-radius: 0.125rem;"></div> Belum DP / Tunggakan DP
        </div>
        <div style="display: flex; align-items: center; gap: 0.3125rem;">
          <div style="width: 0.9375rem; height: 0.9375rem; background: rgba(231, 76, 60, 0.8); border-radius: 0.125rem;"></div> Tunggakan Bulanan
        </div>
        <div style="display: flex; align-items: center; gap: 0.3125rem;">
          <div style="width: 0.9375rem; height: 0.9375rem; background: rgba(192, 57, 43, 0.8); border-radius: 0.125rem;"></div> Overstay Harian
        </div>
        <div style="display: flex; align-items: center; gap: 0.3125rem;">
          <div style="width: 0.9375rem; height: 0.9375rem; background: rgba(149, 165, 166, 0.8); border-radius: 0.125rem;"></div> Selesai
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

useHead({
  title: 'Timeline Kalender - Sistem Manajemen Kosan'
});

const loading = ref(true);
const rooms = ref<any[]>([]);
const roomTypes = ref<any[]>([]);
const rentals = ref<any[]>([]);

const searchQuery = ref('');
const filterRoomTypeId = ref('');
const sortBy = ref('roomNumber');
const currentPage = ref(1);
const itemsPerPage = ref(10);

const currentDate = ref(new Date());

const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());

const monthName = computed(() => {
  return currentDate.value.toLocaleString('id-ID', { month: 'long' });
});

const daysInMonth = computed(() => {
  const dt = new Date(currentYear.value, currentMonth.value + 1, 0);
  return dt.getDate();
});

const filteredAndSortedRooms = computed(() => {
  let result = rooms.value;

  if (filterRoomTypeId.value) {
    result = result.filter(r => r.roomTypeId?._id === filterRoomTypeId.value);
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(r => {
      const roomMatch = r.roomNumber.toLowerCase().includes(q);
      const tenantMatch = rentals.value.some(rental => {
        if (rental.roomId?._id !== r._id && rental.roomId !== r._id) return false;
        return rental.customerIds?.some((c: any) => c.name.toLowerCase().includes(q));
      });
      return roomMatch || tenantMatch;
    });
  }

  result = [...result].sort((a, b) => {
    if (sortBy.value === 'type') {
      const typeA = a.roomTypeId?.name || '';
      const typeB = b.roomTypeId?.name || '';
      return typeA.localeCompare(typeB) || a.roomNumber.localeCompare(b.roomNumber);
    }
    return a.roomNumber.localeCompare(b.roomNumber);
  });

  return result;
});

const totalPages = computed(() => Math.ceil(filteredAndSortedRooms.value.length / itemsPerPage.value) || 1);
const paginatedRooms = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredAndSortedRooms.value.slice(start, start + itemsPerPage.value);
});

watch([searchQuery, filterRoomTypeId, sortBy], () => {
  currentPage.value = 1;
});

const prevMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1);
};
const nextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1);
};

const fetchData = async () => {
  loading.value = true;
  try {
    const [roomsRes, typesRes, rentalsRes] = await Promise.all([
      fetch('http://localhost:3001/api/rooms'),
      fetch('http://localhost:3001/api/rooms/types'),
      fetch('http://localhost:3001/api/rentals')
    ]);
    rooms.value = await roomsRes.json();
    roomTypes.value = await typesRes.json();
    const allRentals = await rentalsRes.json();
    rentals.value = allRentals.filter((r: any) => r.status !== 'Cancelled');
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

const getRentalsForDay = (roomId: string, day: number) => {
  const cellDate = new Date(currentYear.value, currentMonth.value, day);
  cellDate.setHours(12, 0, 0, 0);

  return rentals.value.filter(r => {
    const rId = r.roomId?._id || r.roomId;
    if (rId !== roomId) return false;

    const start = new Date(r.rentalStartTime);
    start.setHours(0, 0, 0, 0);
    
    let end: Date;
    if (r.rentalType === 'Long-Stay') {
      end = new Date('2099-12-31T23:59:59Z'); 
    } else {
      if (r.expectedReturnDate) {
        end = new Date(r.expectedReturnDate);
        end.setHours(23, 59, 59, 999);
      } else {
        end = new Date('2099-12-31T23:59:59Z');
      }
    }
    
    if (r.status === 'Completed' && r.rentalEndTime) {
      end = new Date(r.rentalEndTime);
      end.setHours(23, 59, 59, 999);
    }
    
    if (cellDate >= start && cellDate <= end) {
      const isStartDay = cellDate.getFullYear() === start.getFullYear() && cellDate.getMonth() === start.getMonth() && cellDate.getDate() === start.getDate();
      const isFirstDayOfMonth = day === 1 && start < cellDate;
      
      return isStartDay || isFirstDayOfMonth;
    }
    
    return false;
  });
};

const getRentalStyle = (rental: any, startDay: number) => {
  const cellDate = new Date(currentYear.value, currentMonth.value, startDay);
  cellDate.setHours(12, 0, 0, 0);

  const start = new Date(rental.rentalStartTime);
  start.setHours(0, 0, 0, 0);
  
  let end: Date;
  if (rental.rentalType === 'Long-Stay') {
    end = new Date(currentYear.value, currentMonth.value, daysInMonth.value, 23, 59, 59);
  } else {
    end = new Date(rental.expectedReturnDate || '2099-12-31T23:59:59Z');
    end.setHours(23, 59, 59, 999);
  }
  
  if (rental.status === 'Completed' && rental.rentalEndTime) {
    end = new Date(rental.rentalEndTime);
    end.setHours(23, 59, 59, 999);
  }

  const monthEnd = new Date(currentYear.value, currentMonth.value, daysInMonth.value, 23, 59, 59);
  let effectiveEnd = end > monthEnd ? monthEnd : end;

  const msPerDay = 1000 * 60 * 60 * 24;
  
  let durationDays = 1;
  let offsetStart = cellDate;
  
  if (effectiveEnd >= offsetStart) {
    durationDays = Math.max(1, Math.ceil((effectiveEnd.getTime() - offsetStart.getTime()) / msPerDay));
  }

  let bgColor = 'rgba(39, 174, 96, 0.8)';
  
  if (rental.rentalType === 'Long-Stay') {
    bgColor = 'rgba(142, 68, 173, 0.8)'; 
  }
  
  if (rental.status === 'Completed') {
    bgColor = 'rgba(149, 165, 166, 0.8)';
  } else if (rental.currentStatusText?.includes('Belum') || rental.currentStatusText?.includes('DP Parsial') || rental.currentStatusText === 'Tunggakan DP') {
    bgColor = 'rgba(243, 156, 18, 0.8)';
  } else if (rental.currentStatusText === 'Overstay') {
    bgColor = 'rgba(192, 57, 43, 0.8)';
  } else if (rental.currentStatusText === 'Tunggakan' || rental.tunggakanAmount > 0) {
    bgColor = 'rgba(231, 76, 60, 0.8)';
  }

  return {
    position: 'absolute' as any,
    left: '0.125rem',
    top: '0.3125rem',
    height: '2.5rem',
    width: `calc(${durationDays * 100}% - 0.25rem)`,
    background: bgColor,
    borderRadius: '0.25rem',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    zIndex: 10,
    boxShadow: '0 0.125rem 0.25rem rgba(0,0,0,0.1)',
    cursor: 'pointer'
  };
};

const getRentalTitle = (rental: any) => {
  return `Penghuni: ${rental.customerIds[0]?.name}\nStatus: ${rental.currentStatusText}\nTipe: ${rental.rentalType}`;
};
</script>

<style scoped>
.timeline-bar:hover {
  filter: brightness(1.1);
  transform: scaleY(1.05);
  transition: all 0.2s;
}
</style>
