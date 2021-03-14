```js
export function flushPassiveEffects(): boolean {
  // Returns whether passive effects were flushed.
  if (pendingPassiveEffectsRenderPriority !== NoLanePriority) {
    const priorityLevel =
      pendingPassiveEffectsRenderPriority > DefaultLanePriority
        ? DefaultLanePriority
        : pendingPassiveEffectsRenderPriority;
    pendingPassiveEffectsRenderPriority = NoLanePriority;
    const previousLanePriority = getCurrentUpdateLanePriority();
    try {
      setCurrentUpdateLanePriority(priorityLevel);
      return flushPassiveEffectsImpl();
    } finally {
      setCurrentUpdateLanePriority(previousLanePriority);
    }
  }
  return false;
}

function flushPassiveEffectsImpl() {
  if (rootWithPendingPassiveEffects === null) {
    return false;
  }
  // 在 layout 完成 rootWithPendingPassiveEffects = true 触发

  const root = rootWithPendingPassiveEffects;
  const lanes = pendingPassiveEffectsLanes;
  // 重置为 null
  rootWithPendingPassiveEffects = null;
  pendingPassiveEffectsLanes = NoLanes;

  const prevExecutionContext = executionContext;
  executionContext |= CommitContext;
  const prevInteractions = pushInteractions(root);

  // 执行useEffect销毁函数
  commitPassiveUnmountEffects(root.current);
  // 执行useEffect创建函数
  commitPassiveMountEffects(root, root.current);

  // TODO: Move to commitPassiveMountEffects
  if (enableProfilerTimer && enableProfilerCommitHooks) {
    const profilerEffects = pendingPassiveProfilerEffects;
    pendingPassiveProfilerEffects = [];
    for (let i = 0; i < profilerEffects.length; i++) {
      const fiber = ((profilerEffects[i]: any): Fiber);
      commitPassiveEffectDurations(root, fiber);
    }
  }

  executionContext = prevExecutionContext;

  flushSyncCallbackQueue();

  // If additional passive effects were scheduled, increment a counter. If this
  // exceeds the limit, we'll fire a warning.
  nestedPassiveUpdateCount =
    rootWithPendingPassiveEffects === null ? 0 : nestedPassiveUpdateCount + 1;

  return true;
}
```
