/**
 * https://leetcode-cn.com/problems/valid-palindrome/
 *
 * @param {string} s
 * @return {boolean}
 */
const isPalindrome1 = function (s) {
  const filterS = s.replace(/[^a-zA-Z0-9]*/g, '').toLowerCase()
  let result = true
  for (let i = 0, len = filterS.length - 1; i < len / 2; i++) {
    if (filterS[i] !== filterS[len - i]) {
      result = false
    }
  }
  return result
}

const isPalindrome2 = function (s) {
  s = s.toLowerCase()
  let result = true
  for (let i = 0, j = s.length - 1; i < j;) {
    if (!isValid(s[i])) {
      i++
      continue
    }
    if (!isValid(s[j])) {
      j--
      continue
    }
    console.log(s[i], s[j])
    if (s[i] !== s[j]) {
      result = false
      break
    } else {
      i++
      j--
    }
  }
  return result
}

function isValid (s) {
  return /[a-zA-Z0-9]/.test(s)
}

console.log(isPalindrome1('A man, a plan, a canal: Panama'))
