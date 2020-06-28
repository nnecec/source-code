# Phase 3

经过 Phase 2 初始化`ReactDOMRoot`实例之后，调用`updateContainer`方法，更新`Container`。

> [updateContainer](../ReactFiberReconciler.md#updateContainer)

在`updateContainer`中，首先获取`container.current`即 fiber。然后计算`currentTime`和`expirationTime`。

---

> [requestEventTime](../ReactFiberWorkLoop.md#requestEventTime)

通过`requestEventTime`计算并返回`eventTime`。

在控制台获取一个`now()`时间，本例中为 17287028.655，计算返回的值则为

eventTime = 6903063.415000001。

---

> [requestUpdateLane](../ReactFiberWorkLoop.md#requestUpdateLane)

---

> [updateContainer](../ReactFiberReconciler.md#updateContainer)

在计算出过期时间后，回到`updateContainer`中，执行`enqueueUpdate(current, update)`和`scheduleUpdateOnFiber(current, lane, eventTime)`。
