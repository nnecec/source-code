/**
 * @param {number[]} nums
 * @return {number}
 *
 * https://leetcode-cn.com/problems/maximum-subarray/solution/hua-jie-suan-fa-53-zui-da-zi-xu-he-by-guanpengchn/
 */
const maxSubArray = function (nums) {
  let sum = 0
  let max = nums[0]

  for (const num of nums) {
    if (sum > 0) {
      sum += num
    } else {
      sum = num
    }

    max = Math.max(sum, max)
  }

  return max
}

const maxSubArray2 = function (nums) {
  let pre = 0
  let result = nums[0]

  for (const num of nums) {
    pre = Math.max(pre + num, num)
    result = Math.max(pre, result)
  }
  return result
}
