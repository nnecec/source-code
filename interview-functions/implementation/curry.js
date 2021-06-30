const curry = (fn, arr = []) => {
  return (...args) =>
    ((arg) => arg.length === fn.length ? fn(...arg) : curry(fn, arg))([
      ...arr,
      ...args
    ])
}

const sum = (a, b, c) => a + b + c
const curriedSum = curry(sum)
const res = curriedSum(1)(2)(3)
console.log(res) // 6
