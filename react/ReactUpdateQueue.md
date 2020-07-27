# ReactUpdateQueue

## createUpdate

构建 Update 实例。

- 用来记录组件的状态变化
- 存放在 UpdateQueue 中
- 多个 Update 可以同时存在

```javascript
export const UpdateState = 0;
export const ReplaceState = 1;
export const ForceUpdate = 2;
export const CaptureUpdate = 3;

export function createUpdate(
  eventTime: number,
  lane: Lane,
  suspenseConfig: null | SuspenseConfig
): Update<*> {
  const update: Update<*> = {
    eventTime,
    lane,
    suspenseConfig,

    tag: UpdateState,
    payload: null,
    callback: null,

    next: null,
  };
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
export type UpdateQueue<State> = {|
  baseState: State,
  firstBaseUpdate: Update<State> | null,
  lastBaseUpdate: Update<State> | null,
  shared: SharedQueue<State>,
  effects: Array<Update<State>> | null,
|};

export function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue;
  if (updateQueue === null) {
    // Only occurs if the fiber has been unmounted.
    return;
  }

  const sharedQueue: SharedQueue<State> = (updateQueue: any).shared;
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
