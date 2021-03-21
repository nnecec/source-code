/**
 * https://leetcode-cn.com/problems/two-sum/
 *
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
const twoSum = function (nums, target) {
  const cache = {}
  for (let i = 0; i < nums.length; i++) {
    if (cache[nums[i]] !== undefined) {
      return [cache[nums[i]], i]
    }
    cache[nums[i]] = i
  }

  for (let i = 0; i < nums.length; i++) {
    const num = nums[i]
    const other = target - nums[i]

    if (cache[other] !== undefined && cache[num] !== cache[other]) {
      return [cache[num], cache[other]]
    }
  }
}

console.log(twoSum([3, 3], 6))
