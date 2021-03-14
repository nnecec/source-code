const PENDING = 'PENDING'
const FULFILLED = 'FULFILLED'
const REJECTED = 'REJECTED'

function resolve () {

}
function reject () { }
function unwrap (promise, resolver, value) {
  setTimeout(() => {
    let returnValue
    try {
      returnValue = resolver(value)
    } catch (reason) {
      return reject(promise, reason)
    }

    resolve(promise, returnValue)
  })
}
function noop () { }

class Promise {
  constructor (handler) {
    this.state = PENDING
    this.value = undefined

    this.queue = []
  }

  then (onFulfilled, onRejected) {
    const _promise = new Promise(noop)
    if (this.state !== PENDING) {
      const resolver = this.state === FULFILLED ? onFulfilled : onRejected
      unwrap(_promise, resolver, this.value)
    } else {
      this.queue.push(new Subscriber(_promise, onFulfilled, onRejected))
    }
  }
}

class Subscriber {
  constructor (promise, onFulfilled, onRejected) {
    this.promise = promise
    this.onFulfilled = onFulfilled
    this.onRejected = onRejected
  }

  callFulfilled (value) {
    resolve(this.promise, this.onFulfilled, value)
  }

  callRejected (value) {
    reject(this.promise, this.onRejected, value)
  }
}
