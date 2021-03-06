const internal = require('../internal')
const utils = require('../utils')

/**
 * Promise.race
 *
 * @param {Array<Promise>} iterable
 * @returns
 */
function race (iterable) {
  const self = this
  if (!utils.isArray(iterable)) {
    return this.reject(new TypeError('parameter must be an array'))
  }

  const len = iterable.length

  let called = false
  // 如果参数长度为0 则说明为空数组
  if (!len) {
    return this.resolve([])
  }

  let i = 0
  const promise = new this(internal.noop)

  function resolver (value) {
    self.resolve(value).then(function (value) {
      if (!called) {
        called = true
        internal.handlers.resolve(promise, value)
      }
    }, function (error) {
      if (!called) {
        called = true
        internal.handlers.reject(promise, error)
      }
    })
  }

  while (i++ < len) {
    resolver(iterable[i])
  }
  return promise
}

module.exports = race
