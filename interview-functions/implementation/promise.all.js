Promise.all = function (promises) {
  if (!Array.isArray(promises)) {
    console.log('please input array')
    return
  }
  return new Promise((resolve, reject) => {
    if (promises.length === 0) {
      resolve([])
    } else {
      const result = []
      let index = 0
      for (let i = 0; i < promises.length; i++) {
        // 考虑到 i 可能是 thenable 对象也可能是普通值
        Promise.resolve(promises[i]).then(data => {
          result[i] = data
          if (++index === promises.length) {
            // 所有的 promises 状态都是 fulfilled，promise.all返回的实例才变成 fulfilled 态
            resolve(result)
          }
        }, err => {
          reject(err)
        })
      }
    }
  })
}
