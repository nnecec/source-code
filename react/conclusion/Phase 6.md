# Phase 6

> [deep-in-react](https://github.com/crazylxr/deep-in-react/blob/master/analysis/%E8%AF%A6%E8%A7%A3%20Diff%20%E8%BF%87%E7%A8%8B.md)

Phase 5 各种情况最后都会调用`reconcileChildren`，该方法即是 diff 算法的入口方法。

通过`ChildReconciler`调用到其中的`reconcileChildFibers`方法，

> [ChildReconciler](../ReactFiberBeginWork.md#ChildReconciler)

---

```javascript
function reconcileSingleTextNode
```

如果 newChild 是 TextNode。

如果存在 currentFiber 且为文本节点则从 currentFiber 下一个兄弟节点删除，并将新的 TextNode 赋值。可以减少一次删除创建节点的操作。如果不是文本节点，表示无法复用，则从头开始删除节点，创建 TextFiber 并返回。

这里的删除并不是立即删除，而是将节点打上标记，在 commit 阶段进行删除。并且在此可以看到，标记是记录在 effectTag 属性上的。

---

```javascript
function reconcileSingleElement
```

如果 newChild 是 ReactElement。

进入一个循环来遍历子节点的兄弟节点，如果遇到 key 相同且类型相同，则认为可以复用该节点。如果 key 相同但类型不同，或者是 key 不同，则都是删除所有子节点。

---

```javascript
function reconcileChildrenArray
```

如果 newChild 是 Array。遍历新的 fiber 数组，首先获取 old fiber 的 key。

如果 newChild 是 string 或者 number，即 TextNode，那么都是没有 key 的。

如果老的节点有 key 的话，就不能复用，直接返回 null。老的节点 key 为 null 的话，代表老的节点是 TextNode，就可以复用。

如果 newChild 是 object，且不为 null。则判断 key 和 type 是否相同，如相同则可以复用。

当 newChildren 遍历完成时，说明有删除的节点，将剩余的节点删除。

当 oldChildren 遍历完成时，说明有新增的节点，则将剩余的 newChild 创建。

当以上两种情况都没发生时，说明有移动的节点。

将剩余节点遍历。首先将剩余节点信息暂存到一个 map 中。遍历剩余的节点，并在 map 中寻找 key 相同的节点以复用。如果找不到就创建新的。

---

总结：

1. 第一遍历新数组，新老数组相同 index 进行对比，通过 updateSlot方法找到可以复用的节点，直到找到不可以复用的节点就退出循环。
2. 第一遍历完之后，删除剩余的老节点，追加剩余的新节点的过程。如果是新节点已遍历完成，就将剩余的老节点批量删除；如果是老节点遍历完成仍有新节点剩余，则将新节点直接插入。
3. 把所有老数组元素按 key 或 index 放 Map 里，然后遍历新数组，插入老数组的元素，这是移动的情况。
