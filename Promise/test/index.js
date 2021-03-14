'use strict'

const Promise = require('../mini-promise')
// const Promise = require('../index')
// const Promise = require('es6-promise').Promise
// const Promise = require('bluebird')
// const Promise = require('lie')

const adapter = {}

adapter.deferred = () => {
  const pending = {}
  pending.promise = new Promise((resolver, reject) => {
    pending.resolve = resolver
    pending.reject = reject
  })
  return pending
}
adapter.resolved = (value) => Promise.resolve(value)
adapter.rejected = (reason) => Promise.reject(reason)

describe('Promises/A+ Tests', () => {
  require('promises-aplus-tests').mocha(adapter)
})
