import { reactive } from 'vue'

/** State UI global (sidebar mobile, dsb.) */
export const ui = reactive({
  sidebarOpen: false,
})

export const closeSidebar = () => (ui.sidebarOpen = false)
export const toggleSidebar = () => (ui.sidebarOpen = !ui.sidebarOpen)
