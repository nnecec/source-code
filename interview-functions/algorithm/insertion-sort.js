/**
 *
 * 插入排序是一种简单的排序算法，一次构建一个项目的最终排序数组(或列表)。
 * 与快速排序、堆排序或合并排序等更高级的算法相比，它在大型列表中的效率要低得多。
 *
 * 从第一位开始遍历列表并排序，在开始下一位时，与已排序的列表再次比较
 *
 * 复杂度
 *
 * Best Average Worst Memory	Stable	Comments
 * n    n2      n2    1       Yes
 *
 */
function insertionSort (originArray) {
  for (let i = 0; i < originArray.length; i++) {
    for (let j = i; j >= 0; j--) {
      if (originArray[j + 1] < originArray[j]) {
        const cache = originArray[j + 1]
        originArray[j + 1] = originArray[j]
        originArray[j] = cache
      }
    }
  }
  return originArray
}

console.log(insertionSort([6, 5, 3, 1, 8, 7, 2, 4]))
