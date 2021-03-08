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
