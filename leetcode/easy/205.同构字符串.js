/**
 * https://leetcode-cn.com/problems/isomorphic-strings/
 *
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
const isIsomorphic = function (s, t) {
  const sDict = {}
  const tDict = {}
  let result = true

  for (const index in s) {
    const sWord = s[index]
    const tWord = t[index]
    if (!sDict[sWord] && !tDict[tWord]) {
      sDict[sWord] = t[index]
      tDict[tWord] = s[index]
    }

    if (sDict[sWord] !== t[index] || tDict[tWord] !== s[index]) {
      result = false
    }
  }

  return result
}

console.log(isIsomorphic('egg', 'add'))
