/**
 * https://leetcode-cn.com/problems/longest-common-subsequence/
 *
 * @param {string} text1
 * @param {string} text2
 * @return {number}
 */

const twoDimensional = require('../utils/two-dimensional')

let memo = []
const longestCommonSubsequence = function (text1, text2) {
  const m = text1.length
  const n = text2.length
  memo = twoDimensional(m, n, -1)
  return dp(text1, 0, text2, 0)
}

/**
 *
 * @param {string} s1
 * @param {number} i
 * @param {string} s2
 * @param {number} j
 */
function dp (s1, i, s2, j) {
  if (i === s1.length || j === s2.length) {
    return 0
  }
  if (memo[i][j] !== -1) return memo[i][j]

  if (s1.charAt(i) === s2.charAt(j)) {
    memo[i][j] = 1 + dp(s1, i + 1, s2, j + 1)
  } else {
    memo[i][j] = Math.max(dp(s1, i + 1, s2, j), dp(s1, i, s2, j + 1))
  }
  return memo[i][j]
}

console.log(longestCommonSubsequence('abcde', 'ace'))
// console.log(longestCommonSubsequence('abc', 'abc'))
// console.log(longestCommonSubsequence('abc', 'def'))
// console.log(longestCommonSubsequence('oxcpqrsvwf', 'shmtulqrypy')) // 2 qr
// console.log(longestCommonSubsequence('ezupkr', 'ubmrapg'))
// console.log(longestCommonSubsequence('abcba', 'abcbcba'))
