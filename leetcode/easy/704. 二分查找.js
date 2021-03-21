/**
 * https://leetcode-cn.com/problems/binary-search/
 * F
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
const search = function (nums, target) {
  let left = 0
  let right = nums.length - 1

  while (left <= right) {
    const mid = Math.floor(left + (right - left) / 2)
    console.log(nums[mid], target)
    if (nums[mid] === target) {
      return mid
    } else if (nums[mid] < target) {
      left = mid + 1
    } else if (nums[mid] > target) {
      right = mid - 1
    }
  }

  return -1
}

console.log(search([-1, 0, 3, 5, 9, 12], 9))
