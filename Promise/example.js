const Promise = require('./index')

new Promise((resolve, reject) => {
  console.log('--promise start--')
  setTimeout(
    () => {
      resolve(333)
    },
    1_000
  )
}).then(
  (data) => {
    console.log('example: result1', data)
    return 1
  },
  (data1) => {
    console.log('example: error1', data1)
    throw Error('error1')
  }
).then(
  (data) => {
    console.log('example: result2', data)
    return 2
  },
  (data1) => {
    console.log('example: error2', data1)
  }
).then(
  (data) => {
    console.log('example: result3', data)
    return 3
  },
  (data1) => {
    console.log('example: error3', data1)
    return 'error3'
  }
).finally((data) => {
  console.log(data)
})
