function binarySearch (nums, target) {
  let start = 0
  let end = nums.length - 1

  while (end >= start) {
    const middle = start + Math.floor((end - start) / 2)
    const centerElement = nums[middle]
    if (centerElement === target) {
      return middle
    } else if (centerElement < target) {
      start = middle + 1
    } else if (centerElement > target) {
      end = middle - 1
    }
  }
  return -1
}

console.log(binarySearch([-1, 0, 3, 5, 9, 12], 9))
