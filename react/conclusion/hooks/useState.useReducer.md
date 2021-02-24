# useState/useReducer

> mountState/mountReducer

```javascript
function mountState<S>(
  initialState: (() => S) | S
): [S, Dispatch<BasicStateAction<S>>] {
  const hook = mountWorkInProgressHook();
  if (typeof initialState === 'function') {
    initialState = initialState();
  }
  hook.memoizedState = hook.baseState = initialState;
  const queue = (hook.queue = {
    pending: null,
    interleaved: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: (initialState: any),
  });
  const dispatch = (queue.dispatch = dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));
  return [hook.memoizedState, dispatch];
}

function mountReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: (I) => S
): [S, Dispatch<A>] {
  const hook = mountWorkInProgressHook();
  let initialState;
  if (init !== undefined) {
    initialState = init(initialArg);
  } else {
    initialState = ((initialArg: any): S);
  }
  hook.memoizedState = hook.baseState = initialState;
  const queue = (hook.queue = {
    pending: null,
    interleaved: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: (initialState: any),
  });
  const dispatch = (queue.dispatch = dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));
  return [hook.memoizedState, dispatch];
}
```

对比 `mountState`和`mountReducer`，两者唯一区别是`mountState`的`lastRenderedReducer`赋予了默认函数`basicStateReducer`。

```js
// 如果是方法，则返回方法入参当前 state 的结果
// 如果不是则直接返回值
function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  return typeof action === 'function' ? action(state) : action;
}
```

> updateState/updateReducer

```js
function updateState<S>(
  initialState: (() => S) | S
): [S, Dispatch<BasicStateAction<S>>] {
  return updateReducer(basicStateReducer, (initialState: any));
}

function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: (I) => S
): [S, Dispatch<A>] {
  // 获取当前hook
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;

  queue.lastRenderedReducer = reducer;

  // ...同 update 与 updateQueue 类似的更新逻辑

  const dispatch: Dispatch<A> = (queue.dispatch: any);
  return [hook.memoizedState, dispatch];
}
```

> 调用 dispatch

调用修改 state 的方法`dispatch`，类似`this.setState`，执行`dispatchAction`创建`Update`，将`Update`加入`queue.pending`中，并开启调度。

```js
function dispatchAction(fiber, queue, action) {
  const eventTime = requestEventTime();
  const lane = requestUpdateLane(fiber);
  // ...创建update
  const update: Update<S, A> = {
    lane,
    action,
    eagerReducer: null,
    eagerState: null,
    next: (null: any),
  };
  F;

  // ...将update加入queue.pending

  var alternate = fiber.alternate;

  if (
    fiber === currentlyRenderingFiber ||
    (alternate !== null && alternate === currentlyRenderingFiber)
  ) {
    // 同时具备 current fiber 和 alternate fiber，意味着正在 render 阶段
    didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;

    // ...
  } else {
    if (
      fiber.lanes === NoLanes &&
      (alternate === null || alternate.lanes === NoLanes)
    ) {
      // ...fiber的updateQueue为空，优化路径
      // fiber.lanes保存fiber上存在的update的优先级。
      // fiber.lanes === NoLanes意味着fiber上不存在update。
      // 我们已经知道，通过update计算state发生在申明阶段，这是因为该hook上可能存在多个不同优先级的update，最终state的值由多个update共同决定。
      // 但是当fiber上不存在update，则调用阶段创建的update为该hook上第一个update，在申明阶段计算state时也只依赖于该update，完全不需要进入申明阶段再计算state。
      // 这样做的好处是：如果计算出的state与该hook之前保存的state一致，那么完全不需要开启一次调度。即使计算出的state与该hook之前保存的state不一致，在申明阶段也可以直接使用调用阶段已经计算出的state。
    }

    const root = scheduleUpdateOnFiber(fiber, lane, eventTime);

    // ...
  }
}
```
