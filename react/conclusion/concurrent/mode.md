```js
export function requestUpdateLane(fiber: Fiber): Lane {
  // Special cases
  const mode = fiber.mode;
  if ((mode & ConcurrentMode) === NoMode) {
    return (SyncLane: Lane);
  } else if ((mode & ConcurrentMode) === NoMode) {
    return getCurrentUpdateLanePriority() === SyncLanePriority
      ? (SyncLane: Lane)
      : (SyncBatchedLane: Lane);
  } else if (
    !deferRenderPhaseUpdateToNextBatch &&
    (executionContext & RenderContext) !== NoContext &&
    workInProgressRootRenderLanes !== NoLanes
  ) {

    return pickArbitraryLane(workInProgressRootRenderLanes);
  }

  // 异步模式

  if (currentEventWipLanes === NoLanes) {
    currentEventWipLanes = workInProgressRootIncludedLanes;
  }

  const isTransition = requestCurrentTransition() !== NoTransition;
  if (isTransition) {
    if (currentEventTransitionLane === NoLane) {
      currentEventTransitionLane = claimNextTransitionLane();
    }
    return currentEventTransitionLane;
  }

  const updateLanePriority = getCurrentUpdateLanePriority();
  if (updateLanePriority !== NoLanePriority) {
    return findUpdateLane(updateLanePriority);
  }

  const eventLanePriority = getCurrentEventPriority();
  return findUpdateLane(eventLanePriority);
}
```
