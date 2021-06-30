function attr (obj) {
  const names = Object.getOwnPropertyNames(obj)
  while (obj) {}
}

console.log(
  attr({
    a: {
      b: {
        c: { f: 'aa' }
      },
      d: {
        e: { g: 'bb' },
        h: { i: 'cc' }
      },
      j: {
        k: 'dd'
      }
    }
  })
)
