const internal = require('../internal')

function resolve (value) {
  const Constructor = this
  if (value && typeof value === 'object' && value.constructor === Constructor) {
    return value
  }
  const promise = new Constructor(internal.noop)
  return internal.handlers.resolve(promise, value)
}

module.exports = resolve
