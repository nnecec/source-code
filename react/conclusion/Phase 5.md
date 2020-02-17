# Phase 5

> [beginWork](../ReactFiberBeginWork.md#beginWork)

在 Phase 4 中，通过 `scheduleUpdateOnFiber -> workLoop -> performUnitOfWork` 调用到 `beginWork`。

在`beginWork`中，首先判断是否是首次渲染。

如果不是首次渲染，再判断旧的 props 与 新 props 是否相等：

- 如果不相等，则`didReceiveUpdate`标记为`true`
- 否则判断本次是否达到渲染优先级：如果`renderExpirationTime`大于`updateExpirationTime`为`false`
- 其他情况`didReceiveUpdate`标记为`false`

`didReceiveUpdate`用来标记是否需要更新。

然后根据不同的`workInProgress.tag`调用不同的更新方法。

下面是根据不同的 tag 调用不同的构建方法。

## mountIndeterminateComponent

> [mountIndeterminateComponent](../ReactFiberBeginWork.md#mountIndeterminateComponent)

## mountLazyComponent

> [mountLazyComponent](../ReactFiberBeginWork.md#mountLazyComponent)

## updateFunctionComponent

> [updateFunctionComponent](../ReactFiberBeginWork.md#updateFunctionComponent)

## updateClassComponent

> [updateClassComponent](../ReactFiberBeginWork.md#updateClassComponent)

## updateHostRoot

> [updateHostRoot](../ReactFiberBeginWork.md#updateHostRoot)

## updateHostComponent

> [updateHostComponent](../ReactFiberBeginWork.md#updateHostComponent)

## updateHostText

> [updateHostText](../ReactFiberBeginWork.md#updateHostText)

## updateSuspenseComponent

> [updateSuspenseComponent](../ReactFiberBeginWork.md#updateSuspenseComponent)

## updatePortalComponent

> [updatePortalComponent](../ReactFiberBeginWork.md#updatePortalComponent)

## updateForwardRef

> [updateForwardRef](../ReactFiberBeginWork.md#updateForwardRef)

## updateFragment

> [updateFragment](../ReactFiberBeginWork.md#updateFragment)
