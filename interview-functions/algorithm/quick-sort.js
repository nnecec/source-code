/**
 *
 * 快速排序是一种分而治之的算法。
 * 快速排序首先将一个大数组分成两个较小的子数组:低元素和高元素。
 * 然后快速排序可以递归地对子数组排序 这些步骤是: 从数组中选择一个元素，称为枢轴。
 * 分区:对数组重新排序，使所有值小于轴的元素位于轴之前，而所有值大于轴的元素位于轴之后(两者的值相等)。
 * 分区后，枢轴处于其最终位置。这称为分区操作。
 * 递归地将上述步骤应用于具有较小值的元素子阵列，并分别应用于具有较大值的元素子阵列。
 * 快速排序算法的动画可视化。水平线是轴值。
 *
 * 复杂度
 *
 * Best     Average  Worst  Memory	Stable	Comments
 * nlog(n)  nlog(n)	 n2	    log(n)	No	    快速排序通常使用O(log(n))堆栈空间就地完成
 *
 */
function quickSort (originArray) {
  if (originArray.length <= 1) {
    return originArray
  }

  const leftArray = []
  const rightArray = []
  const centerElement = originArray.shift()
  const centerArray = [centerElement]

  while (originArray.length) {
    const firstElement = originArray.shift()

    if (firstElement === centerElement) {
      centerArray.push(firstElement)
    } else if (firstElement < centerArray) {
      leftArray.push(firstElement)
    } else if (firstElement > centerArray) {
      rightArray.push(firstElement)
    }
  }

  const leftArraySorted = quickSort(leftArray)
  const rightArraySorted = quickSort(rightArray)
  return leftArraySorted.concat(centerArray, rightArraySorted)
}

// console.log(quickSort([15, 8, 5, 12, 10, 1, 16, 9, 11, 7, 20, 3, 2, 6, 17, 18, 4, 13, 14, 19]))

// https://www.cnblogs.com/onepixel/p/7674659.html
