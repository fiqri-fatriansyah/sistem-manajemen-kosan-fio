<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/config');
    const data = await res.json();
    if (data && data.baseFontSize) {
      document.documentElement.style.setProperty('--base-font-size', `${Math.max(18, data.baseFontSize)}px`);
    } else {
      document.documentElement.style.setProperty('--base-font-size', '18px');
    }
  } catch (err) {
    document.documentElement.style.setProperty('--base-font-size', '18px');
  }
});
</script>
