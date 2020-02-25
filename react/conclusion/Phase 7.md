# Phase 7

在 Phase 4 中，流程进入到`scheduleUpdateOnFiber`->`performSyncWorkOnRoot`/`performConcurrentWorkOnRoot`->`workLoopSync`/`workLoopConcurrent`->`performUnitOfWork`->`beginWork`中。

在 Phase 6 中，获取到`reconcileChildren` diff 之后更新的`workInProgress`，并更新到`next`变量上。

函数 `performUnitOfWork` 从 `workInProgress` 树接收一个 fiber 节点，并通过调用 `beginWork` 函数启动工作。这个函数将启动所有 fiber 执行工作所需要的活动。函数 `beginWork` 始终返回指向要在循环中处理的下一个子节点的指针或 null。

回到`beginWork`中，如果`next`为`null`时，说明这一分支的节点已经遍历到最后一个节点，调用 `completeUnitOfWork` 结束这一分支的工作，并回溯到父节点

## completeUnitOfWork

> [completeUnitOfWork](../ReactFiberWorkLoop.md#completeUnitOfWork)
