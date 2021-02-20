const then = require('./function/then')
const all = require('./function/all')
const race = require('./function/race')
const resolve = require('./function/resolve')
const reject = require('./function/reject')
const internal = require('./internal')

/**
 * Promise 构造函数
 *
 * @param {Function} resolver
 */
function Promise (resolver) {
  if (typeof resolver !== 'function') {
    throw new TypeError('resolver must be a function')
  }

  this._state = internal.PENDING // promise 当前状态
  this._value = undefined // promise 当前值
  this._subscribers = [] // promise 当前注册的回调队列

  if (!process.browser) {
    this.handled = internal.UNHANDLED
  }
  // 如果调用 Promise 的不是来自 Promise 内部
  // 构造 Promise 实例
  if (resolver !== internal.noop) {
    internal.safelyResolveThenable(this, resolver)
  }
}

Promise.prototype.then = then

/**
 * Promise.catch
 *
 * @param {*} onRejected
 * @returns
 */
Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected)
}

/**
 * Promise.finally
 *
 * @param {*} callback
 * @returns
 */
Promise.prototype.finally = function (callback) {
  if (typeof callback !== 'function') {
    return this
  }

  const constructor = this.constructor

  return this.then(function (value) {
    constructor.resolve(callback()).then(function () {
      return value
    })
  }, function (reason) {
    constructor.resolve(callback()).then(function () {
      throw reason
    })
  })
}

Promise.all = all
Promise.race = race
Promise.resolve = resolve
Promise.reject = reject

module.exports = Promise
