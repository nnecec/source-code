class LazyMan {
  constructor () {
    this.queue = []
    setTimeout(() => {
      this.next()
    }, 0)
  }

  next () {
    const fn = this.queue.shift()
    fn && fn()
  }

  eat () {
    this.queue.push(() => {
      console.log('task: eat')
      this.next()
    })
    return this
  }

  sleep (millisecond) {
    this.queue.push(() => {
      setTimeout(() => {
        console.log(`task: sleep ${millisecond}`)
        this.next()
      }, millisecond)
    })
    return this
  }
}

new LazyMan().eat().sleep(2000).eat().sleep(2000)
