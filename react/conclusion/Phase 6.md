# Phase 6

Phase 5 各种情况最后都会调用`reconcileChildren`，该方法即是 diff 算法的入口方法。

通过`ChildReconciler`调用到其中的`reconcileChildFibers`方法，

> [reconcileChildFibers](../ReactChildFiber.md#reconcileChildFibers)

`ChildReconciler`调用后返回`reconcileChildFibers`方法。

`reconcileChildFibers`根据`newChild`类型的不同从而经过不同的处理。

---

如果 newChild 是 ReactElement。



---

如果 newChild 是 TextNode。

如果存在 currentFiber 且为文本节点则从 currentFiber 下一个兄弟节点删除，并将新的 TextNode 赋值。可以减少一次删除创建节点的操作。如果不是文本节点，表示无法复用，则从头开始删除节点，创建 TextFiber 并返回。

这里的删除并不是立即删除，而是将节点打上标记，在 commit 阶段进行删除。
