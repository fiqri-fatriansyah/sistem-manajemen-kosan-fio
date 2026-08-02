<template>
  <div class="layout-container">
    <button class="burger-btn" :class="{ 'fused': isSidebarOpen }" @click="isSidebarOpen = !isSidebarOpen">
      ☰
    </button>
    
    <div v-if="isSidebarOpen && isMobile" class="sidebar-overlay" @click="isSidebarOpen = false"></div>
    <aside class="sidebar" :class="{ 'closed': !isSidebarOpen }">
      <div class="brand" style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.625rem; padding: 3.75rem 0.625rem 1.25rem 0.625rem;">
        <img v-if="appConfig.appLogoUrl" :src="'' + appConfig.appLogoUrl" style="max-width: 80%; max-height: 5rem; object-fit: contain;" />
        <span style="font-size: 1rem; font-weight: bold; line-height: 1.2; word-wrap: break-word; width: 100%;">{{ appConfig.appName || 'Kosan Fio' }}</span>
      </div>
      <nav>
        <NuxtLink to="/" class="nav-link" exact>Utama</NuxtLink>
        <NuxtLink to="/penyewaan" class="nav-link">Penyewaan</NuxtLink>
        <NuxtLink to="/inventaris" class="nav-link">Inventaris</NuxtLink>
        <NuxtLink to="/pengeluaran" class="nav-link">Pengeluaran</NuxtLink>
        <NuxtLink to="/kalender" class="nav-link">Kalender</NuxtLink>
        <NuxtLink to="/pelanggan" class="nav-link">Pelanggan</NuxtLink>
        <NuxtLink to="/dasbor" class="nav-link">Dasbor</NuxtLink>
        <NuxtLink to="/acara" class="nav-link">Acara & Libur</NuxtLink>
        <NuxtLink to="/pengaturan" class="nav-link">Pengaturan</NuxtLink>
      </nav>
    </aside>
    <main class="main-content">
      <div style="padding-top: 0.3125rem;">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const appConfig = ref<any>({});
const isSidebarOpen = ref(true);
const isMobile = ref(false);

onMounted(async () => {
  try {
    const res = await fetch('/api/config');
    appConfig.value = await res.json();
    if (appConfig.value.appName) {
      document.title = appConfig.value.appName;
    }
  } catch (err) {
    console.error(err);
  }

  const checkMobile = () => {
    isMobile.value = window.innerWidth <= 768;
    if (isMobile.value) isSidebarOpen.value = false;
    else isSidebarOpen.value = true;
  };
  checkMobile();
  window.addEventListener('resize', checkMobile);
});
</script>

<style scoped>
nav {
  display: flex;
  flex-direction: column;
}
</style>
