/**
 * @param {number} n
 * @return {number}
 */
const fib = function (n) {
  const dp = {}
  const internalFib = (cache, n) => {
    if (n === 0) return 0
    if (n === 1) return 1
    if (cache[n]) return cache[n]
    cache[n] = internalFib(cache, n - 1) + internalFib(cache, n - 2)
    return cache[n]
  }

  return internalFib(dp, n)
}

console.log(fib(9))
