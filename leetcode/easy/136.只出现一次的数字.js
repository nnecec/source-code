/**
 * https://leetcode-cn.com/problems/single-number/
 *
 * @param {number[]} nums
 * @return {number}
 */
var singleNumber = function (nums) {
  const temp = {}

  for (const num of nums) {
    if (!temp[num]) {
      temp[num] = 1
    } else {
      delete temp[num]
    }
  }

  return Object.keys(temp)[0]
}
