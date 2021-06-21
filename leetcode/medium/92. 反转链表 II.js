/**
 * https://leetcode-cn.com/problems/reverse-linked-list-ii/
 *
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @param {number} left
 * @param {number} right
 * @return {ListNode}
 */
const reverseBetween = function (head, left, right) {
  if (left === 1) {
    return reverseN(head, right)
  }
  head.next = reverseBetween(head.next, left - 1, right - 1)
  return head
}

let successor = null

// 反转前 N 个节点
const reverseN = function (head, right) {
  if (right === 1) {
    successor = head.next
    return head
  }

  // n 减小到1时，执行上一行代码，将第n+1个节点赋值给 successor
  const last = reverseN(head.next, right - 1)
  head.next.next = head
  head.next = successor

  return last
}
