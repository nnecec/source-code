const internal = require('../internal')

function reject (reason) {
  const Constructor = this
  const promise = new Constructor(internal.noop)
  return internal.handlers.reject(promise, reason)
}

module.exports = reject
