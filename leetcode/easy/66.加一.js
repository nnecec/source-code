/**
 * https://leetcode-cn.com/problems/plus-one/submissions/
 * 
 * @param {number[]} digits
 * @return {number[]}
 */
var plusOne = function (digits) {
  const length = digits.length
  if (digits[length - 1] !== 9) {
    digits[length - 1]++
    return digits
  } else {
    for (let i = length - 1; i >= 0; i--) {
      let num = digits[i] = (digits[i] + 1) % 10
      if (num !== 0) {
        return digits
      }
    }

    return [1, ...digits]
  }
};