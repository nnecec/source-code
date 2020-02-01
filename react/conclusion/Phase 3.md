# Phase 3

经过 Phase 2 构建`ReactDOMRoot`实例之后，调用`updateContainer`方法。

> [updateContainer](../ReactFiberReconciler.md#updateContainer)

在`updateContainer`中，首先获取`container.current`即 fiber。然后计算`currentTime`和`expirationTime`。

---

> [requestCurrentTimeForUpdate](../ReactFiberWorkLoop.md#requestCurrentTimeForUpdate)

通过`requestCurrentTimeForUpdate`计算并返回`currentTime`。

在控制台获取一个`now()`时间，本例中为 17287028.655，通过`msToExpirationTime`计算返回的值则为

currentTime = 1073741821 - ((17287028.655 / 10) | 0) = 1072013119

之后再通过`currentTime`和 fiber 计算得出`expirationTime`。

---

> [computeExpirationForFiber](../ReactFiberWorkLoop.md#computeExpirationForFiber)

在计算`expirationTime`时，会判断任务优先级。过期时间越大的，优先级越高。会有以下几种情况：

- 需要立即响应的，返回`Sync`，即最大值减 1(1073741823)
- 用户操作，需要即时响应的

  通过`computeInteractiveExpiration`计算，代入之前得到的`currentTime`可以得到：

  expirationTime = 1073741821 - (((1073741821 - 1072013119 + 150 / 10) | 0) + 1) \* 10 = 1056454641

  在计算中，`ceiling`函数的作用是将每个间隔的时间内的任务，处理返回同一个过期时间，在这里是每 10ms 的任务处理成同一优先级。

- 低优先级，可以异步响应的

  通过`computeAsyncExpiration`计算，代入`currentTime`可以得到：

  expirationTime = 1073741821 - (((1073741821 - 1072013119 + 5000 / 25) | 0) + 1) \* 25 = 1030519246

- 搁置： 返回 Never = 1

为什么需要根据当前时间去计算，并且按照规定的间隔时间处理返回同一个`expirationTime`？

为了将这个时间间隔内的任务打包，生成同一`expirationTime`，并据此在同一优先级去执行这一批次的任务。

---

> [scheduleRootUpdate](../ReactFiberReconciler.md#scheduleRootUpdate)

在计算出过期时间后，回到`updateContainer`中，获取`context`和`update`。
