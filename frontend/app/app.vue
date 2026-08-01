<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useHead } from '#imports';

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/config');
    const data = await res.json();
    if (data && data.baseFontSize) {
      const userMin = Math.max(1, data.baseFontSize);
      const scaledRoot = userMin / 0.75;
      document.documentElement.style.setProperty('--base-font-size', `${scaledRoot}px`);
    } else {
      const defaultRoot = 18 / 0.75;
      document.documentElement.style.setProperty('--base-font-size', `${defaultRoot}px`);
    }
    
    if (data && data.appFaviconUrl) {
      useHead({
        link: [
          {
            rel: 'icon',
            href: 'http://localhost:3001' + data.appFaviconUrl
          }
        ]
      });
    }
  } catch (err) {
    const defaultRoot = 18 / 0.75;
    document.documentElement.style.setProperty('--base-font-size', `${defaultRoot}px`);
  }
});
</script>
