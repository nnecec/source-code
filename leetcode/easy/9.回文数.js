/**
 * https://leetcode-cn.com/problems/palindrome-number/
 *
 * @param {number} x
 * @return {boolean}
 */
const isPalindrome = function (x) {
  if (x < 0) return false
  let revertedX = 0
  let remainder = x
  do {
    revertedX = revertedX * 10 + remainder % 10
    remainder = parseInt(remainder / 10)
  } while (remainder > 0)

  return revertedX === x
}

console.log(isPalindrome(121))
