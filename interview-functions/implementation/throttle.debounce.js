function throttle (func, wait) {
  let blocker = false
  return function (...args) {
    if (blocker === true) return
    blocker = true
    setTimeout(() => {
      blocker = false
      func.apply(this, args)
    }, wait)
  }
}

function debounce (func, wait) {
  let timer = null

  return function (...args) {
    clearTimeout(timer)

    timer = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}
