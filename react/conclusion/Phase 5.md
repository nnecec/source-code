# Phase 5

> [beginWork](../ReactFiberBeginWork.md#beginWork)

在 Phase 4 中，通过 `renderRoot -> performUnitOfWork` 调用到 `beginWork`。

在`beginWork`中，如果`memoizedProps`与`newProps`不相等，则 `didReceiveUpdate`标记为`true`。

否则如果`renderExpirationTime`大于`updateExpirationTime`，为`false`。

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
