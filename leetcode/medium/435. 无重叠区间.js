/**
 * https://leetcode-cn.com/problems/non-overlapping-intervals/
 *
 * @param {number[][]} intervals
 * @return {number}
 */
const eraseOverlapIntervals = function (intervals) {
  return overlapIntervals(intervals).length
}

const overlapIntervals = function (intervals) {
  const newIntervals = intervals.sort((a, b) => a[1] - b[1])

  let prev = newIntervals[0]

  const result = []

  for (let i = 1; i < newIntervals.length; i++) {
    const next = newIntervals[i]
    if (next[0] < prev[1]) {
      result.push(i)
    } else {
      prev = next
    }
  }
  return result
}

console.log(overlapIntervals([[1, 2], [2, 3], [3, 4], [1, 3]]))
