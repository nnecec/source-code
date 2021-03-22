/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
const isSubsequence = function (s, t) {
  let last = 0
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (c === s[last]) {
      last++
    }
  }
  return last === s.length
}

// console.log(isSubsequence('abc', 'ahbgdc'))

// 进阶
// 使用

const isSubsequenceMemoed = function (s, t) {
  const memo = {}
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (!memo[c]) {
      memo[c] = []
    }
    memo[c] = [i]
  }

  let j = 0

  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (!memo[c]) {
      return false
    }
    const pos = leftBound(memo[c], j)
    if (pos === memo[c].length) return false
    j = memo[c][pos] + 1
  }

  return true
}

function leftBound (arr, tar) {
  let low = 0
  let high = arr.length
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2)
    if (tar > arr[mid]) {
      low = mid + 1
    } else {
      high = mid
    }
  }
  return low
}

console.log(leftBound([0, 2, 6], 4))
