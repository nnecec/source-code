/**
 * https://leetcode-cn.com/problems/palindrome-linked-list/
 *
 * https://labuladong.gitbook.io/algo-en/v/master/shu-ju-jie-gou-xi-lie/shou-ba-shou-shua-lian-biao-ti-mu-xun-lian-di-gui-si-wei/pan-duan-hui-wen-lian-biao
 *
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
let left = null
/**
 * @param {ListNode} head
 * @return {boolean}
 */
const isPalindrome = function (head) {
  left = head
  return traverse(head)
}

function traverse (right) {
  if (right === null) return true
  let res = traverse(right.next)
  // 直到最后一个节点的 next === null
  // 执行下面的代码，此时 right 为最后一个节点， left 为缓存的第一个节点
  // 比较完成后，再进入上一个traverse 方法，right 变为上次调用的参数，即倒数第二个节点， left 在最后一个节点运算后向后移动了一个next ，此时变为 第二个和倒数第二个对比
  // 以此类推，太强了。

  res = res && (right.val === left.val)
  left = left.next
  return res
}
