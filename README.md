# vue-hooks

POC for using [React Hooks](https://reactjs.org/docs/hooks-intro.html) in Vue. Totally experimental, don't use this in production.

[Live Demo](https://codesandbox.io/s/jpqo566289)

### React-style Hooks

``` js
import Vue from "vue"
import { withHooks, useState, useEffect } from "vue-hooks"

// a custom hook...
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)
  const handleResize = () => {
    setWidth(window.innerWidth)
  };
  useEffect(() => {
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])
  return width
}

const Foo = withHooks(h => {
  // state
  const [count, setCount] = useState(0)

  // effect
  useEffect(() => {
    document.title = "count is " + count
  })

  // custom hook
  const width = useWindowWidth()

  return h("div", [
    h("span", `count is: ${count}`),
    h(
      "button",
      {
        on: {
          click: () => setCount(count + 1)
        }
      },
      "+"
    ),
    h("div", `window width is: ${width}`)
  ])
})

// just so you know this is Vue...
new Vue({
  el: "#app",
  render(h) {
    return h("div", [h(Foo), h(Foo)])
  }
})
```

### Vue-style Hooks

API that maps Vue's existing API.

``` js
import {
  withHooks,
  useData,
  useComputed,
  useWatch,
  useMounted
} from "vue-hooks"

const Foo = withHooks(h => {
  const data = useData({
    count: 0
  })

  const double = useComputed(() => data.count * 2)

  useWatch(() => data.count, (val, prevVal) => {
    console.log(`count is: ${val}`)
  })

  useMounted(() => {
    console.log('mounted!')
  })

  return h('div', [
    h('div', `count is ${data.count}`),
    h('div', `double count is ${double}`),
    h('button', { on: { click: () => {
      // still got that direct mutation!
      data.count++
    }}}, 'count++')
  ])
})
```

### Usage in Normal Vue Components

``` js
import { hooks, useData, useComputed } from 'vue-hooks'

Vue.use(hooks)

new Vue({
  template: `
    <div @click="data.count++">
      {{ data.count }} {{ double }}
    </div>
  `,
  hooks() {
    const data = useData({
      count: 0
    })

    const double = useComputed(() => data.count * 2)

    return {
      data,
      double
    }
  }
})
```
