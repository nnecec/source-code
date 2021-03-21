/**
 * https://leetcode-cn.com/problems/permutations/submissions/
 *
 * @param {number[]} nums
 * @return {number[][]}
 */
const permute = function (nums) {
  if (nums.length === 0) {
    return []
  }
  const result = []
  const track = []

  function backtrack (nums, track) {
    if (nums.length === track.length) {
      result.push(track)
      return
    }

    for (const num of nums) {
      if (track.includes(num)) {
        continue
      }
      track.push(num)
      backtrack(nums, [...track])
      track.pop()
    }
  }

  backtrack(nums, track)
  return result
}

console.log(permute([1, 2, 3]))
