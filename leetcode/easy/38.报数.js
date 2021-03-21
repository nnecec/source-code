/**
 * @param {number} n
 * @return {string}
 */
var countAndSay = function (n) {
  if (n === 1) {
    return '1'
  }

  const prev = countAndSay(n - 1)

  let cache = '' // 最终输出的值
  let count = 0 //  n个x 的n
  let now = prev[0] // n个x 的x
  for (let i = 0; i < prev.length; i++) {
    if (prev[i] === now) {
      count++
    } else {
      cache = cache + count + now
      count = 1
      now = prev[i]
    }
    if (i === prev.length - 1) cache += count + now;
  }
  return cache
};
