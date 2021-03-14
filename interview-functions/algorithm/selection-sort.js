/**
 *
 * 选择排序，在列表中寻找最小值/最大值/等并依次从前往后排列。
 * 它具有O(N2)时间复杂性，使得它在大型列表中效率低下，并且通常比类似的插入排序性能更差。
 * selection sort以其简单著称，在某些情况下，它比更复杂的算法具有性能优势，特别是在辅助内存有限的情况下。
 *
 * 复杂度
 *
 * Best Average Worst Memory	Stable	Comments
 * n2   n2      n2    1       No
 *
 */
function selectionSort (originArray) {
  for (let i = 0; i < originArray.length; i++) {
    let minFlag = i
    for (let j = i + 1; j < originArray.length; j++) {
      if (originArray[minFlag] > originArray[j]) {
        minFlag = j
      }
    }

    if (minFlag !== i) {
      const cache = originArray[i]
      originArray[i] = originArray[minFlag]
      originArray[minFlag] = cache
    }
  }
  return originArray
}
console.log(selectionSort([8, 5, 2, 6, 9, 3, 5, 4, 8, 7]))
