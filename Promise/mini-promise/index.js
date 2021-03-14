const PENDING = 'pending'
const ONFULFILLED = 'onFulfilled'
const ONREJECTED = 'onRejected'

// 1. 定义 status 状态
// 2. onFulfilled, onRejected 的数组
// 3. 定义 resolve reject 方法
// 4. executor 执行
function Promise (executor) {
  this.status = PENDING
  this.value = undefined
  this.onFulfilledQueue = []
  this.onRejectedQueue = []

  // resolve 做到事情
  // 1. 修改this 实例的状态
  // 2. 修改this 这里的data
  // 3. 遍历执行 this onFulfilledQueue 上挂载的方法
  const resolve = (value) => {
    if (value instanceof Promise) {
      return value.then(resolve, reject)
    }
    setTimeout(() => { // 异步执行所有的回调函数
      if (this.status === PENDING) {
        this.status = ONFULFILLED
        this.value = value
        for (let i = 0; i < this.onFulfilledQueue.length; i++) {
          this.onFulfilledQueue[i](value)
        }
      }
    })
  }
  const reject = (reason) => {
    setTimeout(() => { // 异步执行所有的回调函数
      if (this.status === PENDING) {
        this.status = ONREJECTED
        this.value = reason
        for (let i = 0; i < this.onRejectedQueue.length; i++) {
          this.onRejectedQueue[i](reason)
        }
      }
    })
  }

  try {
    executor(resolve, reject)
  } catch (reason) {
    reject(reason)
  }
}

// 1. 参数校验
// 2. 根据 statue, 执行 onFulfilled, onRejected 或者把 执行onFulfilled, onRejected的行为保存在数组
// 3. 把 onFulfilled，onRejected 的返回值, 使用 resolvePromise 包裹成 promise
Promise.prototype.then = function (onFulfilled, onRejected) {
  const self = this
  let _promise
  onFulfilled = typeof onFulfilled === 'function'
    ? onFulfilled
    : function (v) {
      return v
    }
  onRejected = typeof onRejected === 'function'
    ? onRejected
    : function (r) {
      throw r
    }

  // 执行到 then, 并不确定 promise 状态已经是 resolved
  if (self.status === ONFULFILLED) {
    // then() 执行后，返回一个promise, promise 的值
    _promise = new Promise((resolve, reject) => {
      setTimeout(() => { // 异步执行onResolved
        try {
          // 执行 onFulfilled()，拿到结果 x
          // onFulfilled是用户传入的，那onFulfilled返回值, 可能性可就多了
          const x = onFulfilled(self.data)
          // 如果 x 是简单值，直接 resolve(x);
          // resolve(x);
          // 需要使用 resolvePromise 方法封装
          resolvePromise(_promise, x, resolve, reject)
        } catch (reason) {
          reject(reason)
        }
      })
    })
    return _promise
  }

  if (self.status === ONREJECTED) {
    _promise = new Promise((resolve, reject) => {
      setTimeout(() => { // 异步执行onRejected
        try {
          const x = onRejected(self.data)
          resolvePromise(_promise, x, resolve, reject)
        } catch (reason) {
          reject(reason)
        }
      })
    })
    return _promise
  }

  if (self.status === PENDING) {
    // 这里之所以没有异步执行，是因为这些函数必然会被resolve或reject调用，而resolve或reject函数里的内容已是异步执行，构造函数里的定义
    _promise = new Promise((resolve, reject) => {
      // 先定义一个方法，把方法 挂载到 onResolvedCallback 数组上
      // 方法里面 就是 调用传入的 onFulfilled
      self.onResolvedCallback.push((value) => {
        try {
          const x = onFulfilled(value)
          resolvePromise(_promise, x, resolve, reject)
        } catch (r) {
          reject(r)
        }
      })

      self.onRejectedCallback.push((reason) => {
        try {
          const x = onRejected(reason)
          resolvePromise(_promise, x, resolve, reject)
        } catch (r) {
          reject(r)
        }
      })
    })
    return _promise
  }
}

// 1. 普通值
// 2. promise 值
// 3. thenable 的值，执行 then
function resolvePromise (_promise, x, resolve, reject) {
  // 为了防止循环引用
  if (_promise === x) {
    return reject(new TypeError('Chaining cycle detected for promise!'))
  }
  // 如果 x 是 promise
  if (x instanceof Promise) {
    x.then(function (data) {
      resolve(data)
    }, function (e) {
      reject(e)
    })
    return
  }

  // 如果 x 是 object 类型或者是 function
  if ((x !== null) && ((typeof x === 'object') || (typeof x === 'function'))) {
    // 拿x.then可能会报错
    try {
      // 先拿到 x.then
      const then = x.then
      var called
      if (typeof then === 'function') {
        // 这里的写法，是 then.call(this, onFulfilled, onRejected)
        then.call(x, (y) => {
          // called 是干什么用的呢？
          // 有一些 promise 实现的不是很规范，瞎搞的，比如说，onFulfilled, onRejected 本应执行一个，
          // 但是有些then实现里面，onFulfilled, onRejected都会执行
          // 为了 onFulfilled 和 onRejected 只能调用一个, 设置一个 called 标志位
          if (called) {
            return
          }
          called = true
          return resolvePromise(_promise, y, resolve, reject)
        }, (r) => {
          if (called) {
            return
          }
          called = true
          return reject(r)
        })
      } else {
        resolve(x)
      }
    } catch (e) {
      if (called) {
        return
      }
      return reject(e)
    }
  } else {
    resolve(x)
  }
}
Promise.all = function (arr) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(arr)) {
      throw new Error('argument must be a array')
    }
    const dataArr = []
    let num = 0
    for (let i = 0; i < arr.length; i++) {
      const p = arr[i]
      p.then((data) => {
        dataArr.push(data)
        num++
        if (num === arr.length) {
          return resolve(data)
        }
      }).catch((e) => {
        return reject(e)
      })
    }
  })
}
Promise.retry = function (getData, times, delay) {
  return new Promise((resolve, reject) => {
    function attemp () {
      getData().then((data) => {
        resolve(data)
      }).catch((err) => {
        if (times === 0) {
          reject(err)
        } else {
          times--
          setTimeout(attemp, delay)
        }
      })
    }
    attemp()
  })
}

module.exports = Promise
