/**
 * https://labuladong.gitbook.io/algo-en/v/master/shu-ju-jie-gou-xi-lie/shou-ba-shou-shua-er-cha-shu-xun-lian-di-gui-si-wei/er-cha-shu-xi-lie-1#san-suan-fa-shi-jian
 *
 * https://leetcode-cn.com/problems/populating-next-right-pointers-in-each-node/submissions/
 *
 * Definition for Node.
 */
class Node {
  val: number
  left: Node | null
  right: Node | null
  next: Node | null
  constructor (val?: number, left?: Node, right?: Node, next?: Node) {
    this.val = (val === undefined ? 0 : val)
    this.left = (left === undefined ? null : left)
    this.right = (right === undefined ? null : right)
    this.next = (next === undefined ? null : next)
  }
}

function connect (root: Node | null): Node | null {
  if (root === null) return root

  connectTwoNode(root.left, root.right)
  return root
};

function connectTwoNode (node1: Node | null, node2: Node | null) {
  if (node1 === null || node2 === null) {
    return null
  }

  node1.next = node2

  connectTwoNode(node1.left, node1.right)
  connectTwoNode(node2.left, node2.right)
  connectTwoNode(node1.right, node2.left)
}
