const internal = require('../internal')

/**
 * Promise.resolve 的入参可能有以下几种情况：
 *
 * 1. 无参数 [直接返回一个resolved状态的 Promise 对象]
 * 2. 普通数据对象 [直接返回一个resolved状态的 Promise 对象]
 * 3. 一个Promise实例 [直接返回当前实例]
 * 4. 一个thenable对象(thenable对象指的是具有then方法的对象) [转为 Promise 对象，并立即执行thenable对象的then方法。]
 *
 * @param {*} value
 */
function resolve (value) {
  const Constructor = this
  if (value && typeof value === 'object' && value.constructor === Constructor) {
    return value
  }
  const promise = new Constructor(internal.noop)
  return internal.handlers.resolve(promise, value)
}

module.exports = resolve
