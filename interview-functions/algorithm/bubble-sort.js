/**
 *
 * 冒泡排序，又被称为下沉排序
 * 它反复遍历要排序的列表，比较每对相邻项目，如果顺序错误，则交换它们。
 * 循环列表，直到不需要交换，这表示列表已经排序。
 *
 * 遍历列表，将第i位与第i+1位比对，如不符合条件则调换位置，如此冒泡上去
 *
 * 复杂度
 *
 * Best Average Worst Memory	Stable	Comments
 * n    n2      n2    1       Yes
 *
 */
function bubbleSort (originArray) {
  const len = originArray.length
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len; j++) {
      if (originArray[j] > originArray[j + 1]) {
        const cache = originArray[j + 1]
        originArray[j + 1] = originArray[j]
        originArray[j] = cache
      }
    }
  }
  return originArray
}

console.log(
  bubbleSort([
    15,
    8,
    5,
    12,
    10,
    1,
    16,
    9,
    11,
    7,
    20,
    3,
    2,
    6,
    17,
    18,
    4,
    13,
    14,
    19
  ])
)
