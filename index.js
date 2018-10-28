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
    const cleanup = () => {
      const { current } = cleanup
      if (current) {
        current()
        cleanup.current = null
      }
    }
    const effect = () => {
      const { current } = effect
      if (current) {
        cleanup.current = current()
        effect.current = null
      }
    }
    effect.current = rawEffect

    currentInstance._effectStore[id] = {
      effect,
      cleanup,
      deps
    }

    currentInstance.$on('hook:mounted', effect)
    currentInstance.$on('hook:destroyed', cleanup)
    currentInstance.$on('hook:updated', effect)
  } else {
    const record = currentInstance._effectStore[id]
    const { effect, cleanup, deps: prevDeps = [] } = record
    record.deps = deps
    if (!deps || deps.some((d, i) => d !== prevDeps[i])) {
      cleanup()
      effect.current = rawEffect
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
