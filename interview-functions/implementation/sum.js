function createSum () {
  const queue = []

  return function _sum (...args) {
    if (args.length) {
      queue.push(...args)
      return _sum
    }
    return queue.reduce((a, b) => a + b)
  }
}
