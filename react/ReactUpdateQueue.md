# ReactUpdateQueue

## createUpdate

构建 Update 实例。

```javascript
export const UpdateState = 0;
export const ReplaceState = 1;
export const ForceUpdate = 2;
export const CaptureUpdate = 3;

export function createUpdate(expirationTime) {
  let update = {
    expirationTime,
    suspenseConfig,

    tag: UpdateState,
    payload: null,
    callback: null,

    next: null
  };
  update.next = update;

  return update;
}
```

## enqueueUpdate

`updateQueue`结构如下：

```javascript
updateQueue: {
  shared: {
    pending: {
      payload: any,
      next: Update,
      ...
    }
  }
}
```

```javascript
export function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue;
  if (updateQueue === null) {
    // Only occurs if the fiber has been unmounted.
    return;
  }

  const sharedQueue = updateQueue.shared;
  const pending = sharedQueue.pending;
  if (pending === null) {
    // This is the first update. Create a circular list.
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  sharedQueue.pending = update;
}
```
