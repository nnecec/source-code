# Phase 7

在 Phase 4 中，流程进入到`scheduleUpdateOnFiber`->`performSyncWorkOnRoot`->`renderRoot`->`performUnitOfWork`->`beginWork`中。

在 Phase 6 中，获取到`reconcileChildren` diff 之后返回的`child`。

回到`scheduleUpdateOnFiber`，根据 Phase 6 返回的结果，进入到对应的`commitRoot`的流程中。

## commitRoot

> [commitRoot](../ReactFiberWorkLoop.md#commitRoot)

