# React Hooks

`useState`, `useEffect`和`useContext`这三个常用的 Hooks,都是通过`resolveDispatcher`初始化`dispatcher`，然后通过`dispatcher`调用对应的方法。

[dispatcher](./ReactFiberHooks.md)。

Hooks 仅在 FunctionComponent 中会生效，在[updateFunctionComponent](./ReactFiberBeginWork.md#updateFunctionComponent)中声明了 FunctionComponent 的更新方式。

```javascript
export function useState<S>(initialState: (() => S) | S) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}

export function useEffect(
  create: () => (() => void) | void,
  inputs: Array<mixed> | void | null,
) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, inputs);
}

export function useContext<T>(
  Context: ReactContext<T>,
  unstable_observedBits: number | boolean | void,
) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useContext(Context, unstable_observedBits);
}
```
