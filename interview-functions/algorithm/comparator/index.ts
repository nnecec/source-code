export default class Comparator {
  compare: Function
  /**
     * @param {function(a: *, b: *)} [compareFunction]
     */
  constructor (compareFunction) {
    this.compare = compareFunction || Comparator.defaultCompareFunction
  }

  /**
   * 默认数字比较
   *
   * @param {(string|number)} a
   * @param {(string|number)} b
   * @returns {number}
   */
  static defaultCompareFunction (a: string | number, b: string | number): number {
    if (a === b) {
      return 0
    }

    return a < b ? -1 : 1
  }

  equal (a, b) {
    return this.compare(a, b) === 0
  }

  lessThan (a, b) {
    return this.compare(a, b) < 0
  }

  greaterThan (a, b) {
    return this.compare(a, b) > 0
  }

  lessThanOrEqual (a, b) {
    return this.lessThan(a, b) || this.equal(a, b)
  }

  greaterThanOrEqual (a, b) {
    return this.greaterThan(a, b) || this.equal(a, b)
  }

  reverse () {
    const compareOriginal = this.compare
    this.compare = (a, b) => compareOriginal(b, a)
  }
}
