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
