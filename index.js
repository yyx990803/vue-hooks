let currentInstance = null
let isMounting = false
let callIndex = 0

export function useState(initial) {
  if (!currentInstance) {
    throw new Error(`useState must be called in a function passed to withHooks.`)
  }
  const id = ++callIndex
  const state = currentInstance.state
  const updater = newValue => {
    state[id] = newValue
  }
  if (isMounting) {
    currentInstance.$set(state, id, initial)
  }
  return [state[id], updater]
}

export function useEffect(rawEffect, deps) {
  if (!currentInstance) {
    throw new Error(`useEffect must be called in a function passed to withHooks.`)
  }
  const id = ++callIndex
  if (isMounting) {
    const injectedCleanup = () => {
      const { current } = injectedCleanup
      if (current) {
        current()
        injectedCleanup.current = null
      }
    }
    const injectedEffect = () => {
      injectedCleanup()
      const { current } = injectedEffect
      if (current) {
        injectedCleanup.current = current()
      }
    }
    injectedEffect.current = rawEffect

    currentInstance._effectStore[id] = {
      effect: injectedEffect,
      deps
    }

    currentInstance.$on('hook:mounted', injectedEffect)
    currentInstance.$on('hook:destroyed', injectedCleanup)
    if (!deps) {
      currentInstance.$on('hook:updated', injectedEffect)
    }
  } else {
    const { effect, deps: prevDeps = [] } = currentInstance._effectStore[id]
    if (!deps || deps.some((d, i) => d !== prevDeps[i])) {
      effect.current = rawEffect
    } else {
      effect.current = null
    }
  }
}

export function withHooks(render) {
  return {
    data() {
      return {
        state: {}
      }
    },
    created() {
      this._effectStore = []
    },
    render(h) {
      callIndex = 0
      currentInstance = this
      isMounting = !this._vnode
      const ret = render(h, this.$props)
      currentInstance = null
      return ret
    }
  }
}
