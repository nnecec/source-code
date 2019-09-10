# ReactLazy

传入一个为方法的参数，标记并返回 LazyComponent。

```javascript
import type { LazyComponent, Thenable } from "shared/ReactLazyComponent";

import { REACT_LAZY_TYPE } from "shared/ReactSymbols";
import warning from "shared/warning";

export function lazy<T, R>(ctor: () => Thenable<T, R>): LazyComponent<T> {
  let lazyType = {
    $$typeof: REACT_LAZY_TYPE,
    _ctor: ctor,
    // React uses these fields to store the result.
    _status: -1,
    _result: null
  };

  return lazyType;
}
```

在`beginWork`过程中，遇到`LazyComponent`组件时会调用`mountLazyComponent`。

## mountLazyComponent

```javascript
function mountLazyComponent(
  _current,
  workInProgress,
  elementType,
  updateExpirationTime,
  renderExpirationTime,
) {
  if (_current !== null) {
    // An lazy component only mounts if it suspended inside a non-
    // concurrent tree, in an inconsistent state. We want to treat it like
    // a new mount, even though an empty version of it already committed.
    // Disconnect the alternate pointers.
    _current.alternate = null;
    workInProgress.alternate = null;
    // Since this is conceptually a new fiber, schedule a Placement effect
    workInProgress.effectTag |= Placement;
  }

  const props = workInProgress.pendingProps;
  // We can't start a User Timing measurement with correct label yet.
  // Cancel and resume right after we know the tag.
  cancelWorkTimer(workInProgress);
  // 如果 _status === Uninitialized，通过 Promise.then 获取组件，如果报错则抛出错误。
  let Component = readLazyComponentType(elementType);
  // 将 component 赋值给 type
  workInProgress.type = Component;
  // 分别处理 (function/forward ref/memo)，并获得 tag
  const resolvedTag = (workInProgress.tag = resolveLazyComponentTag(Component));
  startWorkTimer(workInProgress);
  // 如果有 defaultProps，将 defaultProps 的值复制给 props
  const resolvedProps = resolveDefaultProps(Component, props);
  let child;
  switch (resolvedTag) {
    case FunctionComponent: {
      child = updateFunctionComponent(
        null,
        workInProgress,
        Component,
        resolvedProps,
        renderExpirationTime,
      );
      break;
    }
    case ClassComponent: {
      child = updateClassComponent(
        null,
        workInProgress,
        Component,
        resolvedProps,
        renderExpirationTime,
      );
      break;
    }
    case ForwardRef: {
      child = updateForwardRef(
        null,
        workInProgress,
        Component,
        resolvedProps,
        renderExpirationTime,
      );
      break;
    }
    case MemoComponent: {
      child = updateMemoComponent(
        null,
        workInProgress,
        Component,
        resolveDefaultProps(Component.type, resolvedProps), // The inner type can have defaults too
        updateExpirationTime,
        renderExpirationTime,
      );
      break;
    }
    default: {
      let hint = '';
    }
  }
  return child;
}
```
