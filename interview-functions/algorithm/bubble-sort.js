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

console.log(bubbleSort([15, 8, 5, 12, 10, 1, 16, 9, 11, 7, 20, 3, 2, 6, 17, 18, 4, 13, 14, 19]))
