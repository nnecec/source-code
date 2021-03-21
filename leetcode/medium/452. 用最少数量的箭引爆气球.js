/**
 * https://leetcode-cn.com/problems/minimum-number-of-arrows-to-burst-balloons/
 *
 * @param {number[][]} points
 * @return {number}
 */
const findMinArrowShots = function (points) {
  return overlapIntervals(points)
}

const overlapIntervals = function (intervals) {
  const newIntervals = intervals.sort((a, b) => a[1] - b[1])
  console.log(newIntervals)

  let end = newIntervals[0][1]

  let count = 1

  for (let i = 1; i < newIntervals.length; i++) {
    const start = newIntervals[i][0]
    if (start > end) {
      count++
      end = newIntervals[i][1]
    }
  }
  return count
}

console.log(findMinArrowShots([[10, 16], [2, 8], [1, 6], [7, 12]]))
