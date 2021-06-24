/**
 * https://leetcode-cn.com/problems/invert-binary-tree/
 *
 * Definition for a binary tree root.
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

function invertTree (root: TreeNode | null): TreeNode | null {
  if (root === null) {
    return null
  }

  // 调换左右节点
  const cache = root.left
  root.left = root.right
  root.right = cache

  // 对每个子节点进行同样的处理
  invertTree(root.left)
  invertTree(root.right)
  return root
};
