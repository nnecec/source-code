/**
 * @param {number[]} nums
 * @return {number}
 */
var majorityElement = function (nums) {
  const arr = []
  for (const num of nums) {
    arr[num] = arr[num] ? arr[num] + 1 : 1
    if (arr[num] > nums.length / 2) {
      return num
    }
  }
}

console.log(majorityElement([2, 2, 1, 1, 1, 2, 2]))
