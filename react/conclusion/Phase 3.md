# Phase 3

经过 Phase 2 初始化`ReactDOMRoot`实例之后，调用`updateContainer`方法，更新`Container`。

> [updateContainer](../ReactFiberReconciler.md#updateContainer)

在`updateContainer`中，首先获取`container.current`即 fiber。然后计算`eventTime`，获取`lane`。初始化`update`并将其加入到更新队列中，然后调度该 fiber 上的更新。

---

> [requestEventTime](../ReactFiberWorkLoop.md#requestEventTime)

通过`requestEventTime`计算并返回`eventTime`。

在控制台获取一个`now()`时间，本例中为 17287028.655

---

> [requestUpdateLane](../ReactFiberWorkLoop.md#requestUpdateLane)

<!-- TODO: complete -->

根据操作的 priorityLevel 返回对应的`lane`。

---

> [updateContainer](../ReactFiberReconciler.md#updateContainer)

在计算出`eventTime`, `lane`后，初始化一份`Update`对象并将需要渲染的`element`挂载到该`Update`上。接着执行`enqueueUpdate(current, update)`和`scheduleUpdateOnFiber(current, lane, eventTime)`。
