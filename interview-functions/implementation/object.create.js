function create (obj) {
  const F = function () {}
  F.prototype = obj
  return new F()
}
