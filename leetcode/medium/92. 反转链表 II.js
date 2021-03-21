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

const reverseN = function (head, right) {
  if (!head || !head.next) return head

  if (right === 1) {
    successor = head.next
    return head
  }

  const last = reverseN(head.next, right - 1)
  head.next.next = head
  head.next = successor

  return last
}
