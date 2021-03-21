/**
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */
const coinChange = function (coins, amount) {
  const cache = {}
  function dp (n) {
    if (n === 0) return 0
    if (n < 0) return -1
    if (cache[n]) return cache[n]

    let result = Infinity
    for (const coin of coins) {
      const rest = dp(n - coin)
      if (rest === -1) {
        continue
      }

      result = Math.min(result, 1 + rest)
    }
    cache[n] = result === Infinity ? -1 : result
    return cache[n]
  }

  return dp(amount)
}

console.log(coinChange([2], 3))
