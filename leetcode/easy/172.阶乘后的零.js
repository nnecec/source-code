/**
 * https://leetcode-cn.com/problems/factorial-trailing-zeroes/
 *
 * 只有 5*2 会产生 0
 *
 * @param {number} n
 * @return {number}
 */
const trailingZeroes = function (n) {
  let count = 0
  while (n >= 5) {
    count += parseInt(n / 5)
    n = parseInt(n / 5)
  }
  return count
}

console.log(trailingZeroes(10))
