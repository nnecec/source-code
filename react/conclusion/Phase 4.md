# Phase 4

> [enqueueUpdate](../ReactUpdateQueue.md#enqueueUpdate)

<!-- TODO: 代码含义  -->

---

> [scheduleUpdateOnFiber](../ReactFiberWorkLoop.md#scheduleUpdateOnFiber)

`scheduleWork`等于调用`scheduleUpdateOnFiber`。

根据 current fiber 和`expirationTime`调度 fiber 上的更新工作。

---

> [markUpdateTimeFromFiberToRoot](../ReactFiberWorkLoop.md#markUpdateTimeFromFiberToRoot)

通过`markUpdateTimeFromFiberToRoot`更新 fiber 的父 fiber 及其兄弟 fiber 的`expirationTime`和`childExpirationTime`，返回更新后的 root fiber。

更新规则是，如果传入的`expirationTime`大于当前的`childExpirationTime`，则将当前的时间更新。

---

如果`expirationTime`与`Sync`相等，即是同步任务：

- 如果当前在 unbatchedUpdates 阶段，且还没到 rendering 阶段时，调用`renderRoot`渲染，并且如果有返回值，会一直循环调用来渲染子树

- 否则则是更新阶段，调用 `scheduleCallbackForRoot`，并传入`ImmediatePriority`

如果是异步任务：

- 调用 `scheduleCallbackForRoot`，传入对应的`priorityLevel`

---

> [performSyncWorkOnRoot](../ReactFiberWorkLoop.md#performSyncWorkOnRoot)

首次同步渲染的入口，根据 expirationTime 进入 commitRoot 或 renderRoot

---

> [ensureRootIsScheduled](../ReactFiberWorkLoop.md#ensureRootIsScheduled)

除了首次渲染外，其他渲染的入口。

---

> [performSyncWorkOnRoot](../ReactFiberWorkLoop.md#performSyncWorkOnRoot)

同步更新会调用该方法。

> [performConcurrentWorkOnRoot](../ReactFiberWorkLoop.md#performConcurrentWorkOnRoot)

异步更新会调用该方法。

在这两个方法中：

- 如果在这个过期时间中没有剩余的工作，则立即结束。在一个 root 节点上有多个 callback 时，早的 callback 清空了所有的工作，则出现了该情况；

- 在同步模式下，如果有等待提交的工作，则执行 `commitRoot`；

- 如果 root 与`work-in-progress root`不同，或`expirationTime`与`renderExpirationTime`不同，说明当前进度已经被打断，则丢弃现有堆栈并准备一个新堆栈。否则会从上次离开的地方继续；

- 如果已经有一个 work-in-progress fiber，意味着在该 root 中仍有工作；

  调用`performUnitOfWork`完成工作：

  1. 执行 beginWork 进行节点操作
  2. 创建子节点 next，如果有就返回
  3. 如果 next 不存在，说明当前节点向下遍历子节点已经到底了，说明这个子树侧枝已经遍历完，执行 `completeUnitOfWork`
  4. `completeUnitOfWork`处理一些 effect tag，一直往上返回直到 root 节点或者在某一个节点发现有 sibling 兄弟节点为止。如果到了 root 那么返回也是 null，代表整棵树的遍历已经结束了，可以 commit 了，如果遇到兄弟节点就返回该节点，因为这个节点可能也会存在子节点，需要通过 `beginWork`进行操作。

---
