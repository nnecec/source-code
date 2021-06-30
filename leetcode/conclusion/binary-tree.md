# Binary Tree

```ts
/* 二叉树遍历框架 */
traverse(root: TreeNode) {
  // 前序遍历
  traverse(root.left)
  // 中序遍历
  traverse(root.right)
  // 后序遍历
}
```
