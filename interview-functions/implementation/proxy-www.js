const www = new Proxy(
  new URL('https://www'),
  {
    get: function get (target, prop) {
      const o = Reflect.get(target, prop)
      if (typeof o === 'function') {
        return o.bind(target)
      }
      if (typeof prop !== 'string') {
        return o
      }
      if (prop === 'then') {
        return Promise.prototype.then.bind(fetch(target))
      }
      target = new URL(target)
      target.hostname += `.${prop}`
      return new Proxy(target, { get })
    }
  }
)

www.baidu.com.then((response) => {
  console.log(response.status)
  // ==> 200
})
