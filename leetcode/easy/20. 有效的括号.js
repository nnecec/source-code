/**
 * https://leetcode-cn.com/problems/valid-parentheses/
 *
 * 用栈的思路，遇到 左括号 则压入栈
 * 遇到 右括号 则查询最近的左括号 是否匹配
 *
 * @param {string} s
 * @return {boolean}
 */
const isValid = function (s) {
  const left = []
  for (const c of s) {
    if (['(', '[', '{'].includes(c)) {
      left.push(c)
    } else {
      if (getLeft(c) === left[left.length - 1]) {
        left.pop()
      } else {
        return false
      }
    }
  }

  if (left.length) {
    return false
  }
  return true
}

function getLeft (right) {
  if (right === ')') return '('
  if (right === ']') return '['
  if (right === '}') return '{'
}

console.log(isValid('([])'))
