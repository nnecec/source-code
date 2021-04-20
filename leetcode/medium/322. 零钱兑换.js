/**
 * https://leetcode-cn.com/problems/coin-change/
 *
 * coins = [1, 2, 5], amount = 11
 *
 * 将求 amount 的情况 拆分为，用 coin 依次减掉 amount ，再对剩余的 amount - coin 求值，知道无法求值，输出最小的
 *
 * 11-5
 * 6-5
 * 1-1
 *
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */
const coinChange = function (coins, amount) {
  const cache = {}
  function dp (n) {
    console.log(n)
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

const coinChangeNoMemo = function (coins, amount) {
  function dp (n) {
    if (n === 0) return 0
    if (n < 0) return -1

    let result = Infinity
    for (const coin of coins) {
      const rest = dp(n - coin)
      console.log(rest)
      if (rest === -1) {
        continue
      }
      result = Math.min(result, 1 + rest)
    }
    result = result === Infinity ? -1 : result
    return result
  }

  return dp(amount)
}

console.log(coinChangeNoMemo([7, 6, 2], 17))
