function instanceofn (child, parent) {
  if (typeof child !== 'object' || child === null) return false

  let childProto = Object.getPrototypeOf(child)
  const parentPrototype = parent.prototype

  while (childProto !== null) {
    if (childProto === parentPrototype) {
      return true
    }
    childProto = Object.getPrototypeOf(childProto)
  }
  return false
}
