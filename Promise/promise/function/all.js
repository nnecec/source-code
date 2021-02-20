const internal = require('../internal')
const utils = require('../utils')

/**
 * Promise.all
 *
 * @param {Array<Promise>} iterable
 * @returns
 */
function all (iterable) {
  const self = this
  // 如果参数不是数组则抛错
  if (!utils.isArray(iterable)) {
    return this.reject(new TypeError('parameter must be an array'))
  }

  const len = iterable.length

  let called = false
  // 如果参数长度为0 则说明为空数组
  if (!len) {
    return this.resolve([])
  }

  const values = new Array(len) // 最后输出的值
  let resolved = 0 // resolve 的数量
  let i = 0
  const promise = new this(internal.noop)

  function allResolver (value, i) {
    self.resolve(value).then(function (value) {
      values[i] = value
      if (++resolved === len && !called) {
        called = true
        internal.handlers.resolve(promise, values)
      }
    }, function (error) {
      if (!called) {
        called = true
        internal.handlers.reject(promise, error)
      }
    })
  }

  while (i++ < len) {
    allResolver(iterable[i], i)
  }
  return promise
}

module.exports = all
