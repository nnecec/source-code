/* eslint-disable no-extend-native */
Function.prototype.bindd = function () {
  const context = Array.prototype.shift.call(arguments)
  const args = arguments
  const self = this
  return function () {
    const realArgs = args.concat(Array.prototype.slice.call(arguments))
    self.apply(context, realArgs)
  }
}

Function.prototype.binddd = function () {
  const context = Array.prototype.shift.call(arguments)
  const args = arguments
  const self = this
  const fNop = function () {}
  const fBound = function () {
    const realArgs = args.concat(Array.prototype.slice.call(arguments))
    return self.apply(this instanceof fNop ? this : context, realArgs)
  }
  fNop.prototype = this.prototype
  fBound.prototype = new fNop()
  return fBound
}

// call
// 实现apply只要把下一行中的...args换成args即可
Function.prototype.calll = function (context = window, ...args) {
  const func = this
  const fn = Symbol('fn')
  context[fn] = func

  const res = context[fn](...args) // 重点代码，利用this指向，相当于context.caller(...args)

  delete context[fn]
  return res
}
