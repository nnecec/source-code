function curry (func, args = []) {
  const len = func.length

  return function () {
    const _args = [].slice.apply(arguments)
    args.push(..._args)

    if (args.length < len) {
      return curry.call(this, func, args)
    }

    return func.apply(this, args)
  }
}
