<template>
  <RouterView v-slot="{ Component, route }">
    <component :is="Component" v-if="route.meta.public" />
    <div v-else class="flex min-h-screen bg-neutral-light">
      <Sidebar />
      <div class="flex flex-col flex-1 min-w-0">
        <Header />
        <main class="flex-1">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </main>
      </div>
    </div>
  </RouterView>

  <ToastHost />
</template>

<script setup>
import { watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import ToastHost from './components/ui/ToastHost.vue'
import { closeSidebar } from './lib/ui.js'

const route = useRoute()
watch(() => route.fullPath, closeSidebar)
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
