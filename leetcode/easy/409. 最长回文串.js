/**
 * @param {string} s
 * @return {number}
 */
const longestPalindrome = function (s) {
  let result = 0
  const cache = {}
  for (let i = 0; i < s.length; i++) {
    const ele = s[i]

    if (cache[ele]) {
      result = result + 2
      cache[ele] = null
    } else {
      cache[ele] = 1
    }
  }

  if (Object.values(cache).includes(1)) {
    result++
  }

  return result
}

console.log(longestPalindrome('abccccdd'))
