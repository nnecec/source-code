/**
 * https://leetcode-cn.com/problems/contains-duplicate-ii/
 *
 * @param {number[]} nums
 * @param {number} k
 * @return {boolean}
 */
const containsNearbyDuplicate = function (nums, k) {
  const _cache = {}
  for (let i = 0; i < nums.length; i++) {
    const num = nums[i]

    if (_cache[num] === undefined) {
      _cache[num] = i
    } else {
      if (i - _cache[num] <= k) {
        return true
      } else {
        _cache[num] = i
      }
    }
  }
  return false
}

console.log(containsNearbyDuplicate([1, 0, 1, 1], 1))
