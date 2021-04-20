/**
 * https://leetcode-cn.com/problems/contains-duplicate-iii/
 *
 * @param {number[]} nums
 * @param {number} k
 * @param {number} t
 * @return {boolean}
 */
const containsNearbyAlmostDuplicate = function (nums, k, t) {
  let i = 0
  let _k = 1

  while (_k <= k) {
    const j = i + _k
    if (Math.abs(nums[i] - nums[j]) <= t && Math.abs(i - j) <= k) {
      return true
    }
    i += 1

    if (j === nums.length) {
      i = 0
      _k += 1
    }
  }
  return false
}

console.log(containsNearbyAlmostDuplicate([4, 1, -1, 6, 5], 3, 1))
