const Promise = require('./index')

new Promise((resolve, reject) => {
  // resolve({ test: 1 })
  // resolve({ test: 2 })
  reject(3)
}).then((data) => {
  console.log('example: result1', data)
  return 1
}, (data1) => {
  console.log('example: error1', data1)
  throw Error('error1')
}).then((data) => {
  console.log('example: result2', data)
  return 2
}, (data1) => {
  console.log('example: error2', data1)
}).then((data) => {
  console.log('example: result3', data)
  return 3
}, (data1) => {
  console.log('example: error3', data1)
})
