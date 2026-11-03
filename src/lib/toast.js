import { reactive } from 'vue'

const state = reactive({ items: [] })
let id = 0

export const useToast = () => {
  function push(message, type = 'success') {
    const item = { id: ++id, message, type }
    state.items.push(item)
    setTimeout(() => remove(item.id), 3500)
  }

  function remove(itemId) {
    const i = state.items.findIndex((t) => t.id === itemId)
    if (i > -1) state.items.splice(i, 1)
  }

  return {
    state,
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
    remove,
  }
}
