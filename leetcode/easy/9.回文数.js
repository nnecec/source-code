/**
 * @param {number} x
 * @return {boolean}
 */
const isPalindrome = function (x) {
  return x === parseInt(x.toString().split('').reverse().join(''))
}

console.log(isPalindrome(121))
