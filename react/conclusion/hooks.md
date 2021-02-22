# hooks

在`beginWork`中，如果遇到`FunctionComponent`则通过调用`renderWithHooks`接入 hooks。

> beginWork -> updateFunctionComponent -> renderWithHooks

```javascript
export function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes
): any {
  renderLanes = nextRenderLanes;
  currentlyRenderingFiber = workInProgress;

  ReactCurrentDispatcher.current =
    current === null || current.memoizedState === null
      ? HooksDispatcherOnMount
      : HooksDispatcherOnUpdate;
  // ...
}
```

通过判断是`mount`还是`update`，为 dispatcher 赋予不同的值，所以在`mount`时调用的 hook 和`update`时调用的 hook 其实是不同的函数。

在 `React/ReactHooks` 中可以看到，hooks 方法都是通过`ReactCurrentDispatcher`获取`dispatcher`，然后通过`dispatcher`调用对应的 hook，如`useState`, `useEffect`等。

```javascript
function resolveDispatcher() {
  const dispatcher = ReactCurrentDispatcher.current;
  return dispatcher;
}

export function useState<S>(initialState: (() => S) | S) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}

export function useEffect(
  create: () => (() => void) | void,
  inputs: Array<mixed> | void | null
) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, inputs);
}
```

## memoizedState

hook 与 `FunctionComponent` fiber 都存在 `memoizedState` 属性，但`memoizedState`意义不同：

- `fiber.memoizedState`: `FunctionComponent`对应 fiber 保存的 hooks 链表。
- `hook.memoizedState`: hooks 链表中保存的单一 hook 对应的数据。

`hook.memoizedState`存储的值根据 hook 的不同而不同：

- useState: 保存 state 的值
- useReducer: 保存 state 的值
- useEffect: 保存 useEffect 回调函数、依赖项等的链表数据结构 effect。effect 链表也会保存在`fiber.updateQueue`中。
- useRef: 保存{current: value}
- useMemo: 保存[callback(), deps]
- useCallback: 保存[callback, depA]

有些 hook 是没有 memoizedState 的，比如:

useContext

## useState/useReducer

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

## useEffect

> mountEffect

```js
function mountEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null
): void {
  return mountEffectImpl(
    PassiveEffect | PassiveStaticEffect,
    HookPassive,
    create,
    deps
  );
}
function mountEffectImpl(fiberFlags, hookFlags, create, deps): void {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  currentlyRenderingFiber.flags |= fiberFlags;
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    undefined,
    nextDeps
  );
}
function updateEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null
): void {
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}
function updateEffectImpl(fiberFlags, hookFlags, create, deps): void {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destroy = undefined;

  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
        return;
      }
    }
  }

  currentlyRenderingFiber.flags |= fiberFlags;

  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    destroy,
    nextDeps
  );
}
```

可以看到`useEffect`初始化时，如果

类似 `update-state.md` 中的 `updateQueue.firstBaseUpdate`，`useEffect`也会为`updateQueue`，增加`lastEffect`属性:

所以，`useEffect`添加的方法会挂载到`fiber.updateQueue.lastEffect`上，等待`commit`阶段执行。

```js
function pushEffect(tag, create, destroy, deps) {
  const effect: Effect = {
    tag,
    create,
    destroy,
    deps,
    // Circular
    next: (null: any),
  };
  let componentUpdateQueue: null | FunctionComponentUpdateQueue = (currentlyRenderingFiber.updateQueue: any);
  // 如果当前没有 effect 则创建一个环形链表并将 lastEffect 指向最新的 effect
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = (componentUpdateQueue: any);
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      // 将 lastEffect 指向最新的 effect ，最新的 effect 指向第一个effect
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
}
```

## useRef

> mountRef/updateRef

```js
function mountRef<T>(initialValue: T): {| current: T |} {
  const hook = mountWorkInProgressHook();
  const ref = { current: initialValue };
  hook.memoizedState = ref;
  return ref;
}
function updateRef<T>(initialValue: T): {| current: T |} {
  const hook = updateWorkInProgressHook();
  return hook.memoizedState;
}
```

由此可见，`useRef`就是简单的存取值的方法。

## useMemo/useCallback

> mountMemo/updateMemo/mountCallback/updateCallback

```js
function mountMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null
): T {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

function updateMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null
): T {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps: Array<mixed> | null = prevState[1];
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        return prevState[0];
      }
    }
  }
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}
function mountCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  hook.memoizedState = [callback, nextDeps];
  return callback;
}

function updateCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps: Array<mixed> | null = prevState[1];
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        return prevState[0];
      }
    }
  }
  hook.memoizedState = [callback, nextDeps];
  return callback;
}
```

`useMemo`和`useCallback`非常类似，在`mount`时存储对应的值`[cache, deps]`，在`update`时，将前后`deps`对比，如果发生了变化则更新`[cache, deps]`

> `areHookInputsEqual`底层通过`Object.is`对比依赖是否相等。
