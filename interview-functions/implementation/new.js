/**
 *
 * @param {Function} fn
 * @param  {...any} args
 */
function newn (fn, ...args) {
  const obj = Object.create(fn.prototype)
  const ret = fn.apply(obj, args)
  return ret && typeof ret === 'object' ? ret : obj
}

/**
 *
 * @param {Function} fn
 * @param  {...any} args
 */
function newnn (fn, ...args) {
  const F = function () {}
  F.prototype = fn.prototype
  F.prototype.constructor = F
  const obj = new F()
  const ret = fn.apply(obj, args)
  return ret && typeof ret === 'object' ? ret : obj
}
