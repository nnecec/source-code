# useEffect

> mountEffect/mountLayoutEffect

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
function mountLayoutEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null
): void {
  // useLayoutEffect 对于 useEffect 的区别仅仅是 flags 不同
  return mountEffectImpl(UpdateEffect, HookLayout, create, deps);
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
function updateLayoutEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null
): void {
  return updateEffectImpl(UpdateEffect, HookLayout, create, deps);
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
        hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps); // 如果相等则不会标记 flags，但仍会更新该hook，在 commit 阶段不会执行
        return;
      }
    }
  }

  currentlyRenderingFiber.flags |= fiberFlags; // fiber 标记上了 Passive

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
      // 将 lastEffect 指向最新的 effect ，最新的 effect.next 指向第一个effect
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
}
```

> commitRoot -> flushPassiveEffects -> flushPassiveEffectsImpl

`useEffect` 的执行需要保证所有组件 `useEffect` 的销毁函数必须都执行完后才能执行任意一个组件的 `useEffect` 的回调函数。

这是因为多个组件间可能共用同一个 `ref`。

```js
function flushPassiveEffectsImpl() {
  if (rootWithPendingPassiveEffects === null) {
    return false;
  }

  // 获取 root lanes ，重置 rootWithPendingPassiveEffects pendingPassiveEffectsLanes
  const root = rootWithPendingPassiveEffects; // 获取执行 effects 的 fiber
  const lanes = pendingPassiveEffectsLanes;
  rootWithPendingPassiveEffects = null;
  pendingPassiveEffectsLanes = NoLanes;

  const prevExecutionContext = executionContext;
  executionContext |= CommitContext;

  // 执行上一次 useEffect 的 unmount 方法
  commitPassiveUnmountEffects(root.current);
  // 执行本次 useEffect 方法
  commitPassiveMountEffects(root, root.current);

  executionContext = prevExecutionContext;
  // 执行同步任务
  flushSyncCallbackQueue();

  // 在 useEffect 中调用 循环 setState 会报错
  nestedPassiveUpdateCount =
    rootWithPendingPassiveEffects === null ? 0 : nestedPassiveUpdateCount + 1;

  return true;
}
```

先看一下如何执行`mount effects`方法的，只有首次执行了`mount`方法，才能再下一次执行`unmount`方法。

> flushPassiveEffectsImpl -> commitPassiveMountEffects_begin -> commitPassiveMountEffects_complete -> commitPassiveMountOnFiber -> commitHookEffectListMount

搜索该 fiber 有 useEffect 的最后一层子节点，再查找兄弟节点，然后再自下而上的依次查找兄弟节点，将有 `useEffect` 的 fiber 查找出来并执行`useEffect`，将返回结果存入 `effect.destroy`。

```js
function commitHookEffectListMount(tag: number, finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & tag) === tag) {
        // Mount
        const create = effect.create;
        effect.destroy = create();
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```

> flushPassiveEffectsImpl -> commitPassiveUnmountEffects_begin -> commitPassiveUnmountEffects_complete -> commitPassiveUnmountOnFiber -> commitHookEffectListUnmount

类似`mount`阶段，搜索该 fiber 有 useEffect 的最后一层子节点，再查找兄弟节点，然后再自下而上的依次查找兄弟节点，将有 `useEffect` 的 fiber 查找出来，并将`destroy`执行。

需要注意的是，在第一次自上而下查找时，同时也会将`fiber.deletions`遍历并执行`commitHookEffectListUnmount`，该操作是将需要删除的节点执行`useEffect`。删除后会重置该节点与状态有关的属性。

```js
function commitHookEffectListUnmount(
  flags: HookFlags,
  finishedWork: Fiber,
  nearestMountedAncestor: Fiber | null
) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & flags) === flags) {
        // Unmount
        const destroy = effect.destroy;
        effect.destroy = undefined;
        if (destroy !== undefined) {
          safelyCallDestroy(finishedWork, nearestMountedAncestor, destroy);
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```
