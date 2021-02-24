function deepCopy (target) {
  if (target === null || typeof target !== 'object') return target

  const copied = Array.isArray(target) ? [] : {}

  for (const index in target) {
    copied[index] = deepCopy(target[index])
  }
  return copied
}

console.log(deepCopy({ a: 1, b: null, c: 'ddd', d: { dd: 'lover' } }))
