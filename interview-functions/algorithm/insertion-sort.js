
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
