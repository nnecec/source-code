/* eslint-disable no-labels */
/**
 * https://leetcode-cn.com/problems/implement-strstr/
 *
 * @param {string} haystack
 * @param {string} needle
 * @return {number}
 */
const strStr = function (haystack, needle) {
  if (needle === '') return 0
  h: for (let i = 0; i < haystack.length; i++) {
    n: for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] === needle[j]) {
        if (j === needle.length - 1) return i
        continue n
      }
      continue h
    }
  }

  return -1
}

console.log(strStr('hello', 'll'))
