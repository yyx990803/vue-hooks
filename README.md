# vue-hooks

POC for using [React Hooks](https://reactjs.org/docs/hooks-intro.html) in Vue. Totally experimental, don't use this in production.

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
