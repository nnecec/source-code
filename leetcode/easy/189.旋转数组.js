/**
 * https://leetcode-cn.com/problems/rotate-array/
 *
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]} nums
 */
var rotate1 = function (nums, k) {
  while (k--) {
    const last = nums.pop()
    nums.unshift(last)
  }
  return nums
}

console.log(rotate1([1, 2, 3, 4, 5, 6, 7], 3)) // [5,6,7,1,2,3,4]

var rotate2 = function (nums, k) {
  const len = nums.length
  nums = nums.slice(len - k, len).concat(nums.slice(0, len - k))
}

console.log(rotate2([1, 2, 3, 4, 5, 6, 7], 3)) // [5,6,7,1,2,3,4]
