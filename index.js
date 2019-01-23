let currentInstance = null
let isMounting = false
let callIndex = 0

function ensureCurrentInstance() {
  if (!currentInstance) {
    throw new Error(
      `invalid hooks call: hooks can only be called in a function passed to withHooks.`
    )
  }
}

export function useState(initial) {
  ensureCurrentInstance()
  const id = ++callIndex
  const state = currentInstance.$data._state
  const updater = newValue => {
    state[id] = newValue
  }
  if (isMounting) {
    currentInstance.$set(state, id, initial)
  }
  return [state[id], updater]
}

export function useEffect(rawEffect, deps) {
  ensureCurrentInstance()
  const id = ++callIndex
  if (isMounting) {
    const cleanup = () => {
      const { current } = cleanup
      if (current) {
        current()
        cleanup.current = null
      }
    }
    const effect = function() {
      const { current } = effect
      if (current) {
        cleanup.current = current.call(this)
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
    if (!deps || deps.length > 0) {
      currentInstance.$on('hook:updated', effect)
    }
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

export function useRef(initial) {
  ensureCurrentInstance()
  const id = ++callIndex
  const { _refsStore: refs } = currentInstance
  return isMounting ? (refs[id] = { current: initial }) : refs[id]
}

export function useData(initial) {
  const id = ++callIndex
  const state = currentInstance.$data._state
  if (isMounting) {
    currentInstance.$set(state, id, initial)
  }
  return state[id]
}

export function useMounted(fn) {
  useEffect(fn, [])
}

export function useDestroyed(fn) {
  useEffect(() => fn, [])
}

export function useUpdated(fn, deps) {
  const isMount = useRef(true)
  useEffect(() => {
    if (isMount.current) {
      isMount.current = false
    } else {
      return fn()
    }
  }, deps)
}

export function useWatch(getter, cb, options) {
  ensureCurrentInstance()
  if (isMounting) {
    currentInstance.$watch(getter, cb, options)
  }
}

export function useComputed(getter) {
  ensureCurrentInstance()
  const id = ++callIndex
  const store = currentInstance._computedStore
  if (isMounting) {
    store[id] = getter()
    currentInstance.$watch(getter, val => {
      store[id] = val
    }, { sync: true })
  }
  return store[id]
}

export function withHooks(render) {
  return {
    data() {
      return {
        _state: {}
      }
    },
    created() {
      this._effectStore = {}
      this._refsStore = {}
      this._computedStore = {}
    },
    render(h) {
      callIndex = 0
      currentInstance = this
      isMounting = !this._vnode
      const ret = render(h, this.$attrs, this.$props)
      currentInstance = null
      return ret
    }
  }
}

export function hooks (Vue) {
  Vue.mixin({
    beforeCreate() {
      const { hooks, data } = this.$options
      if (hooks) {
        this._effectStore = {}
        this._refsStore = {}
        this._computedStore = {}
        this.$options.data = function () {
          const ret = data ? data.call(this) : {}
          ret._state = {}
          return ret
        }
      }
    },
    beforeMount() {
      const { hooks, render } = this.$options
      if (hooks && render) {
        this.$options.render = function(h) {
          callIndex = 0
          currentInstance = this
          isMounting = !this._vnode
          const hookProps = hooks(this.$props)
          Object.assign(this._self, hookProps)
          const ret = render.call(this, h)
          currentInstance = null
          return ret
        }
      }
    }
  })
}
