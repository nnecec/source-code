const immediate = require('immediate')

const PENDING = 0
const FULFILLED = 1
const REJECTED = 2
const UNHANDLED = -1
const handlers = {}

/**
 *
 *
 * @param {*} self
 * @param {Function} resolver 构建Promise传入的 function
 */
function safelyResolveThenable (self, thenable) {
  let called = false // 标记该promise是否被调用过
  function onError (value) { //
    if (called) {
      return
    }
    called = true
    handlers.reject(self, value)
  }

  function onSuccess (value) {
    if (called) {
      return
    }
    called = true
    handlers.resolve(self, value)
  }

  function tryToUnwrap () {
    thenable(onSuccess, onError)
  }

  const result = tryCatch(tryToUnwrap)
  if (result.status === 'error') {
    onError(result.value)
  }
}
/**
 * 执行 then 状态对应的方法 func
 *
 * @param {Promise} promise then 内部新建的 promise，用于返回值
 * @param {Function} func
 * @param {any} value func 的参数
 */
function unwrap (promise, func, value) {
  immediate(function () {
    let returnValue
    try { // 捕获报错
      returnValue = func(value) // 对当前 then 中的值调用 resolver 方法获得 returnValue
    } catch (e) {
      return handlers.reject(promise, e)
    }

    // 如果返回值 与 promise 一样，则说明 promise 返回了自身，不允许返回自身所以报错
    if (returnValue === promise) {
      handlers.reject(promise, new TypeError('Cannot resolve promise with itself'))
    } else {
      handlers.resolve(promise, returnValue)
    }
  })
}

/**
 *  执行 resolve 处理
 *
 * @param {Promise} self
 * @param {any} value
 * @returns
 */
handlers.resolve = function (self, value) {
  // Promise 执行的方法都需要经过 try..catch
  const result = tryCatch(getThen, value)

  // 如果有 error，则进入 reject
  if (result.status === 'error') {
    return handlers.reject(self, result.value)
  }
  // TODO: what & why ?
  const thenable = result.value

  if (thenable) {
    safelyResolveThenable(self, thenable)
  } else {
    // promise 的状态修改为 Fulfilled 当前值修改为 value
    self._state = FULFILLED
    self._value = value

    let i = 0
    const len = self._subscribers.length

    while (i < len) {
      self._subscribers[i].callFulfilled(value)
      i++
    }
  }
  return self
}

handlers.reject = function (self, error) {
  self._state = REJECTED
  self._value = error
  if (!process.browser) {
    if (self.handled === UNHANDLED) {
      immediate(function () {
        if (self.handled === UNHANDLED) {
          process.emit('unhandledRejection', error, self)
        }
      })
    }
  }
  let i = 0
  const len = self._subscribers.length
  while (i < len) {
    self._subscribers[i].callRejected(error)
    i++
  }
  return self
}

/**
 * try...catch 调用 func 及其参数 value
 *
 * @param {Function} func
 * @param {any} value
 * @returns
 */
function tryCatch (func, value) {
  const out = {}
  try {
    out.value = func(value)
    out.status = 'success'
  } catch (e) {
    out.status = 'error'
    out.value = e
  }
  return out
}

function getThen (obj) {
  // Make sure we only access the accessor once as required by the spec
  const then = obj && obj.then

  if (obj && (typeof obj === 'object' || typeof obj === 'function') && typeof then === 'function') {
    return function applyThen () {
      then.apply(obj, arguments)
    }
  }
}

module.exports = {
  PENDING: PENDING,
  FULFILLED: FULFILLED,
  REJECTED: REJECTED,
  UNHANDLED: UNHANDLED,
  noop: function () { },
  handlers: handlers,
  unwrap: unwrap,
  safelyResolveThenable: safelyResolveThenable
}
