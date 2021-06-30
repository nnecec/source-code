/**
 * @param {string} s
 * @return {number}
 */
const lengthOfLongestSubstring = function (s) {
  if (!s.length) return 0
  let result = 1
  for (let i = 0; i < s.length; i++) {
    let j = i + 1
    while (!s.slice(i, j).includes(s[j]) && j < s.length) {
      if (j - i + 1 > result) {
        result = j - i + 1
      }
      j++
    }
  }
  console.log(result)
  return result
}

lengthOfLongestSubstring('auaud')
