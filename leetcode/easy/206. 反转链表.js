/**
 * https://leetcode-cn.com/problems/reverse-linked-list/
 *
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @return {ListNode}
 */
const reverseList = function (head) {
  if (!head || head.next === null) return head
  const last = reverseList(head.next)

  head.next.next = head
  head.next = null

  return last
}
