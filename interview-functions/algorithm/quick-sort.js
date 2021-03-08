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
