class Observer {
  constructor (initialValue) {
    this.value = initialValue
    this.status = 1
  }

  next (func) {
    if (this.status === 0) {
      return this
    }

    try {
      const result = func(this.value)
      if (typeof result === 'string') this.value = result
      return this
    } catch (err) {
      this.status = 0
      return this
    }
  }

  catch (func) {
    func(this.value)
  }
}
new Observer(1).next((val) => val + 1).next(console.log)
// new Observer(0).next(val => {
//   throw new Error('err')
// }).next(val => {
//   console.log('should not exec')
//   return 2 * val
// }).catch(console.log)
