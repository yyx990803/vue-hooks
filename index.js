import Vue from 'vue'

let currentInstance = null
let isMounting = false
let callIndex = 0

export function useState(initial) {
  const id = ++callIndex
  const state = currentInstance.state
  const updater = newValue => {
    state[id] = newValue
  }
  if (isMounting) {
    Vue.set(state, id, initial)
    return [initial, updater]
  } else {
    return [state[id], updater]
  }
}

export function useEffect(rawEffect, deps) {
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
        injectedCleanup.cleanup = current()
      }
    }
    injectedEffect.current = rawEffect

    currentInstance._effectStore[id] = {
      effect: injectedEffect,
      cleanup: injectedCleanup,
      deps
    }

    injectEffect('mounted', injectedEffect)
    injectEffect('destroyed', injectedCleanup)
    if (!deps) {
      injectEffect('updated', injectedEffect)
      injectEffect('beforeUpdate', injectedCleanup)
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

function injectEffect(key, fn) {
  const { $options } = currentInstance
  const existing = $options[key]
  if (existing) {
    $options[key] = [].concat($options[key], fn)
  } else {
    $options[key] = [fn]
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
      currentInstance = this
      isMounting = !this._vnode
      const ret = render(h, this.$props)
      currentInstance = null
      isMounting = false
      callIndex = 0
      return ret
    }
  })
}
