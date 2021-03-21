/**
 * @param {number[]} nums
 * @return {boolean}
 */
const containsDuplicate = function (nums) {
  const _cache = []
  for (let i = 0, j = nums.length - 1; i < j; i++, j--) {
    const left = nums[i]
    const right = nums[j]

    if (_cache[left] || _cache[right] || left === right) {
      return true
    } else {
      _cache[left] = true
      _cache[right] = true
    }
  }
  return false
}

export default containsDuplicate
