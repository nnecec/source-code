/**
 * https://labuladong.gitbook.io/algo-en/v/master/shu-ju-jie-gou-xi-lie/shou-ba-shou-shua-er-cha-shu-xun-lian-di-gui-si-wei/er-cha-shu-xi-lie-1#san-suan-fa-shi-jian
 *
 * https://leetcode-cn.com/problems/flatten-binary-tree-to-linked-list/
 *
 * Definition for a binary tree node.
 */

class TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
  constructor (val?: number, left?: TreeNode | null, right?: TreeNode | null) {
    this.val = (val === undefined ? 0 : val)
    this.left = (left === undefined ? null : left)
    this.right = (right === undefined ? null : right)
  }
}

/**
 Do not return anything, modify root in-place instead.
 */
function flatten (root: TreeNode | null): void {
  if (root === null) return null

  flatten(root.left)
  flatten(root.right)

  const right = root.right

  root.right = root.left
  root.left = null

  let p = root
  while (p.right !== null) {
    p = p.right
  }
  p.right = right
};
