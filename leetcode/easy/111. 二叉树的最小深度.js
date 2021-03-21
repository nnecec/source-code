/**
 * https://leetcode-cn.com/problems/minimum-depth-of-binary-tree/
 *
 *
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number}
 */
const minDepth = function (root) {
  if (root === null) return 0

  let depth = 1

  const queue = [root]

  while (queue.length) {
    const len = queue.length
    // 将当前队列向四处扩散
    for (let i = 0; i < len; i++) {
      const current = queue.shift()
      // 判断是当前否是叶子节点
      if (current.left == null && current.right == null) {
        return depth
      }
      // 如果不是叶子结点，就将其相邻节点加入队列
      if (current.left) {
        queue.push(current.left)
      }
      if (current.right) {
        queue.push(current.right)
      }
    }
    depth++
  }
}
