/**
 * @param {string} s
 * @return {string}
 */
const longestPalindrome = function (s) {
  const len = s.length
  const dp = []
  let result = ''
  for (let l = 0; l < len; l++) {
    for (let i = 0; l + i < len; i++) {
      if (!dp[i]) {
        dp[i] = []
      }
      const j = i + l
      if (l === 0) {
        dp[i][j] = true
      } else if (l === 1) {
        dp[i][j] = s.charAt(i) === s.charAt(j)
      } else {
        dp[i][j] = s.charAt(i) === s.charAt(j) && dp[i + 1][j - 1]
      }
      if (dp[i][j] && l + 1 > result.length) {
        result = s.substring(i, i + l + 1)
      }
    }
  }
  return result
}

console.log(longestPalindrome('babad'))
