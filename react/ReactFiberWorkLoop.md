# ReactFiberWorkLoop

## requestEventTime

```javascript
let currentEventTime = NoWork;

export function requestEventTime() {
  // 在 RenderPhase / CommitPhase 重新生成 currentTime
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    // `now()`可以理解为`performance.now()`(https://developer.mozilla.org/zh-CN/docs/Web/API/Performance/now)
    return now();
  }
  // 其余 Phase 使用缓存的时间 提高性能
  if (currentEventTime !== NoWork) {
    return currentEventTime;
  }
  // 第一次进入 React 应用，首次生成时间
  currentEventTime = now();
  return currentEventTime;
}
```

## requestUpdateLane

获取【更新模式】

```javascript
export function requestUpdateLane(
  fiber: Fiber,
  suspenseConfig: SuspenseConfig | null
): Lane {
  // Special cases
  const mode = fiber.mode;
  if ((mode & BlockingMode) === NoMode) {
    return (SyncLane: Lane);
  } else if ((mode & ConcurrentMode) === NoMode) {
    return getCurrentPriorityLevel() === ImmediateSchedulerPriority
      ? (SyncLane: Lane)
      : (SyncBatchedLane: Lane);
  } else if (
    !deferRenderPhaseUpdateToNextBatch &&
    (executionContext & RenderContext) !== NoContext &&
    workInProgressRootRenderLanes !== NoLanes
  ) {
    return pickArbitraryLane(workInProgressRootRenderLanes);
  }

  if (currentEventWipLanes === NoLanes) {
    currentEventWipLanes = workInProgressRootIncludedLanes;
  }

  let lane;
  if (suspenseConfig !== null) {
    // Use the size of the timeout as a heuristic to prioritize shorter
    // transitions over longer ones.
    // TODO: This will coerce numbers larger than 31 bits to 0.
    const timeoutMs = suspenseConfig.timeoutMs;
    const transitionLanePriority =
      timeoutMs === undefined || (timeoutMs | 0) < 10000
        ? TransitionShortLanePriority
        : TransitionLongLanePriority;

    if (currentEventPendingLanes !== NoLanes) {
      currentEventPendingLanes =
        mostRecentlyUpdatedRoot !== null
          ? mostRecentlyUpdatedRoot.pendingLanes
          : NoLanes;
    }

    lane = findTransitionLane(
      transitionLanePriority,
      currentEventWipLanes,
      currentEventPendingLanes
    );
  } else {
    // TODO: If we're not inside `runWithPriority`, this returns the priority
    // of the currently running task. That's probably not what we want.
    const schedulerPriority = getCurrentPriorityLevel();

    if (
      // TODO: Temporary. We're removing the concept of discrete updates.
      (executionContext & DiscreteEventContext) !== NoContext &&
      schedulerPriority === UserBlockingSchedulerPriority
    ) {
      lane = findUpdateLane(InputDiscreteLanePriority, currentEventWipLanes);
    } else {
      const lanePriority = schedulerPriorityToLanePriority(schedulerPriority);
      lane = findUpdateLane(lanePriority, currentEventWipLanes);
    }
  }

  return lane;
}
```

## scheduleUpdateOnFiber

调度 Fiber 上的更新方法

```javascript
export function scheduleUpdateOnFiber(
  fiber: Fiber,
  lane: Lane,
  eventTime: number
) {
  // 判断是否是无限循环update
  checkForNestedUpdates();

  // 根据 lane 更新节点及父节点，返回 root
  const root = markUpdateLaneFromFiberToRoot(fiber, lane);
  if (root === null) {
    return null;
  }

  // 将 root 标记为需要更新
  markRootUpdated(root, lane, eventTime);

  if (root === workInProgressRoot) {
    if (
      deferRenderPhaseUpdateToNextBatch ||
      (executionContext & RenderContext) === NoContext
    ) {
      // 更新 workInProgressRootUpdatedLanes
      workInProgressRootUpdatedLanes = mergeLanes(
        workInProgressRootUpdatedLanes,
        lane
      );
    }

    // 如果 workInProgressRootExitStatus 被标记为 RootSuspendedWithDelay
    if (workInProgressRootExitStatus === RootSuspendedWithDelay) {
      markRootSuspended(root, workInProgressRootRenderLanes);
    }
  }

  // TODO: requestUpdateLanePriority also reads the priority. Pass the
  // priority as an argument to that function and this one.
  const priorityLevel = getCurrentPriorityLevel();

  if (lane === SyncLane) {
    if (
      // Check if we're inside unbatchedUpdates
      (executionContext & LegacyUnbatchedContext) !== NoContext &&
      // Check if we're not already rendering
      (executionContext & (RenderContext | CommitContext)) === NoContext
    ) {
      // Register pending interactions on the root to avoid losing traced interaction data.
      // 跟踪这些update，并计数、检测它们是否会报错
      schedulePendingInteractions(root, lane);

      // 批量更新时，render是要保持同步的，但布局的更新要延迟到批量更新的末尾才执行
      performSyncWorkOnRoot(root);
    } else {
      ensureRootIsScheduled(root, eventTime);
      schedulePendingInteractions(root, lane);
      if (executionContext === NoContext) {
        // Flush the synchronous work now, unless we're already working or inside
        // a batch. This is intentionally inside scheduleUpdateOnFiber instead of
        // scheduleCallbackForFiber to preserve the ability to schedule a callback
        // without immediately flushing it. We only do this for user-initiated
        // updates, to preserve historical behavior of legacy mode.
        flushSyncCallbackQueue();
      }
    }
  } else {
    // 如果是异步任务的话
    if (
      (executionContext & DiscreteEventContext) !== NoContext &&
      // 只有在用户阻止优先级或更高优先级的更新才被视为离散，即使在离散事件中也是如此
      (priorityLevel === UserBlockingSchedulerPriority ||
        priorityLevel === ImmediateSchedulerPriority)
    ) {
      // 这是离散事件的结果。 跟踪每个根的最低优先级离散更新，以便我们可以在需要时尽早清除它们。
      // 如果rootsWithPendingDiscreteUpdates为null，则初始化它
      if (rootsWithPendingDiscreteUpdates === null) {
        rootsWithPendingDiscreteUpdates = new Set([root]);
      } else {
        rootsWithPendingDiscreteUpdates.add(root);
      }
    }
    // Schedule other updates after in case the callback is sync.
    ensureRootIsScheduled(root, eventTime);
    schedulePendingInteractions(root, lane);
  }

  // We use this when assigning a lane for a transition inside
  // `requestUpdateLane`. We assume it's the same as the root being updated,
  // since in the common case of a single root app it probably is. If it's not
  // the same root, then it's not a huge deal, we just might batch more stuff
  // together more than necessary.
  mostRecentlyUpdatedRoot = root;
}
```

## markUpdateTimeFromFiberToRoot

找到 rootFiber 并遍历更新子节点的 childLanes。

```javascript
function markUpdateLaneFromFiberToRoot(
  sourceFiber: Fiber,
  lane: Lane,
): FiberRoot | null {
  // Update the source fiber's lanes
  sourceFiber.lanes = mergeLanes(sourceFiber.lanes, lane);
  let alternate = sourceFiber.alternate;
  if (alternate !== null) {
    alternate.lanes = mergeLanes(alternate.lanes, lane);
  }
  // 向上遍历节点直到root节点，并更新经过节点的 childLanes
  let node = sourceFiber;
  let parent = sourceFiber.return;
  while (parent !== null) {
    parent.childLanes = mergeLanes(parent.childLanes, lane);
    alternate = parent.alternate;
    if (alternate !== null) {
      alternate.childLanes = mergeLanes(alternate.childLanes, lane);
    }
    node = parent;
    parent = parent.return;
  }
  if (node.tag === HostRoot) {
    const root: FiberRoot = node.stateNode;
    return root;
  } else {
    return null;
  }
}
}
```

## ensureRootIsScheduled

```javascript
// Use this function to schedule a task for a root. There's only one task per
// root; if a task was already scheduled, we'll check to make sure the
// expiration time of the existing task is the same as the expiration time of
// the next level that the root has work on. This function is called on every
// update, and right before exiting a task.
function ensureRootIsScheduled(root: FiberRoot, currentTime: number) {
  const existingCallbackNode = root.callbackNode;

  // Check if any lanes are being starved by other work. If so, mark them as
  // expired so we know to work on those next.
  markStarvedLanesAsExpired(root, currentTime);

  // Determine the next lanes to work on, and their priority.
  const newCallbackId = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
  );
  // This returns the priority level computed during the `getNextLanes` call.
  const newCallbackPriority = returnNextLanesPriority();

  if (newCallbackId === NoLanes) {
    // Special case: There's nothing to work on.
    if (existingCallbackNode !== null) {
      cancelCallback(existingCallbackNode);
      root.callbackNode = null;
      root.callbackPriority = NoLanePriority;
      root.callbackId = NoLanes;
    }
    return;
  }

  // Check if there's an existing task. We may be able to reuse it.
  const existingCallbackId = root.callbackId;
  const existingCallbackPriority = root.callbackPriority;
  if (existingCallbackId !== NoLanes) {
    if (newCallbackId === existingCallbackId) {
      // This task is already scheduled. Let's check its priority.
      if (existingCallbackPriority === newCallbackPriority) {
        // The priority hasn't changed. Exit.
        return;
      }
      // The task ID is the same but the priority changed. Cancel the existing
      // callback. We'll schedule a new one below.
    }
    cancelCallback(existingCallbackNode);
  }

  // Schedule a new callback.
  let newCallbackNode;
  if (newCallbackPriority === SyncLanePriority) {
    // Special case: Sync React callbacks are scheduled on a special
    // internal queue
    newCallbackNode = scheduleSyncCallback(
      performSyncWorkOnRoot.bind(null, root)
    );
  } else {
    const schedulerPriorityLevel = lanePriorityToSchedulerPriority(
      newCallbackPriority
    );
    newCallbackNode = scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }

  root.callbackId = newCallbackId;
  root.callbackPriority = newCallbackPriority;
  root.callbackNode = newCallbackNode;
}
```

## performSyncWorkOnRoot

```javascript
// This is the entry point for synchronous tasks that don't go
// through Scheduler
function performSyncWorkOnRoot(root) {
  flushPassiveEffects();

  let lanes;
  let exitStatus;
  if (
    root === workInProgressRoot &&
    includesSomeLane(root.expiredLanes, workInProgressRootRenderLanes)
  ) {
    // 如果有未完成的渲染，并且至少其中一个 lane 已经过期。
    // 在渲染其余过期工作之前，需要完成渲染。
    lanes = workInProgressRootRenderLanes;
    exitStatus = renderRootSync(root, lanes);
    if (
      includesSomeLane(
        workInProgressRootIncludedLanes,
        workInProgressRootUpdatedLanes
      )
    ) {
      // The render included lanes that were updated during the render phase.
      // For example, when unhiding a hidden tree, we include all the lanes
      // that were previously skipped when the tree was hidden. That set of
      // lanes is a superset of the lanes we started rendering with.
      //
      // Note that this only happens when part of the tree is rendered
      // concurrently. If the whole tree is rendered synchronously, then there
      // are no interleaved events.
      lanes = getNextLanes(root, lanes);
      exitStatus = renderRootSync(root, lanes);
    }
  } else {
    lanes = getNextLanes(root, NoLanes);
    exitStatus = renderRootSync(root, lanes);
  }

  if (root.tag !== LegacyRoot && exitStatus === RootErrored) {
    executionContext |= RetryAfterError;

    // If an error occurred during hydration,
    // discard server response and fall back to client side render.
    if (root.hydrate) {
      root.hydrate = false;
      clearContainer(root.containerInfo);
    }

    // If something threw an error, try rendering one more time. We'll render
    // synchronously to block concurrent data mutations, and we'll includes
    // all pending updates are included. If it still fails after the second
    // attempt, we'll give up and commit the resulting tree.
    lanes = getLanesToRetrySynchronouslyOnError(root);
    if (lanes !== NoLanes) {
      exitStatus = renderRootSync(root, lanes);
    }
  }

  if (exitStatus === RootFatalErrored) {
    const fatalError = workInProgressRootFatalError;
    prepareFreshStack(root, NoLanes);
    markRootSuspended(root, lanes);
    ensureRootIsScheduled(root, now());
    throw fatalError;
  }

  // We now have a consistent tree. Because this is a sync render, we
  // will commit it even if something suspended.
  const finishedWork: Fiber = (root.current.alternate: any);
  root.finishedWork = finishedWork;
  root.finishedLanes = lanes;
  commitRoot(root);

  // Before exiting, make sure there's a callback scheduled for the next
  // pending level.
  ensureRootIsScheduled(root, now());

  return null;
}
```

## performConcurrentWorkOnRoot

```javascript
// This is the entry point for every concurrent task, i.e. anything that
// goes through Scheduler.
function performConcurrentWorkOnRoot(root, didTimeout) {
  // Since we know we're in a React event, we can clear the current
  // event time. The next update will compute a new event time.
  currentEventTime = NoTimestamp;
  currentEventWipLanes = NoLanes;
  currentEventPendingLanes = NoLanes;

  invariant(
    (executionContext & (RenderContext | CommitContext)) === NoContext,
    'Should not already be working.'
  );

  // Flush any pending passive effects before deciding which lanes to work on,
  // in case they schedule additional work.
  flushPassiveEffects();

  // Determine the next expiration time to work on, using the fields stored
  // on the root.
  let lanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
  );
  if (lanes === NoLanes) {
    return null;
  }

  // TODO: We only check `didTimeout` defensively, to account for a Scheduler
  // bug where `shouldYield` sometimes returns `true` even if `didTimeout` is
  // true, which leads to an infinite loop. Once the bug in Scheduler is
  // fixed, we can remove this, since we track expiration ourselves.
  if (didTimeout) {
    // Something expired. Flush synchronously until there's no expired
    // work left.
    markRootExpired(root, lanes);
    // This will schedule a synchronous callback.
    ensureRootIsScheduled(root, now());
    return null;
  }

  const originalCallbackNode = root.callbackNode;

  let exitStatus = renderRootConcurrent(root, lanes);

  if (
    includesSomeLane(
      workInProgressRootIncludedLanes,
      workInProgressRootUpdatedLanes
    )
  ) {
    // The render included lanes that were updated during the render phase.
    // For example, when unhiding a hidden tree, we include all the lanes
    // that were previously skipped when the tree was hidden. That set of
    // lanes is a superset of the lanes we started rendering with.
    //
    // So we'll throw out the current work and restart.
    prepareFreshStack(root, NoLanes);
  } else if (exitStatus !== RootIncomplete) {
    if (exitStatus === RootErrored) {
      executionContext |= RetryAfterError;

      // If an error occurred during hydration,
      // discard server response and fall back to client side render.
      if (root.hydrate) {
        root.hydrate = false;
        clearContainer(root.containerInfo);
      }

      // If something threw an error, try rendering one more time. We'll render
      // synchronously to block concurrent data mutations, and we'll includes
      // all pending updates are included. If it still fails after the second
      // attempt, we'll give up and commit the resulting tree.
      lanes = getLanesToRetrySynchronouslyOnError(root);
      if (lanes !== NoLanes) {
        exitStatus = renderRootSync(root, lanes);
      }
    }

    if (exitStatus === RootFatalErrored) {
      const fatalError = workInProgressRootFatalError;
      prepareFreshStack(root, NoLanes);
      markRootSuspended(root, lanes);
      ensureRootIsScheduled(root, now());
      throw fatalError;
    }

    // We now have a consistent tree. The next step is either to commit it,
    // or, if something suspended, wait to commit it after a timeout.
    const finishedWork: Fiber = (root.current.alternate: any);
    root.finishedWork = finishedWork;
    root.finishedLanes = lanes;
    finishConcurrentRender(root, finishedWork, exitStatus, lanes);
  }

  ensureRootIsScheduled(root, now());
  if (root.callbackNode === originalCallbackNode) {
    // The task node scheduled for this root is the same one that's
    // currently executed. Need to return a continuation.
    return performConcurrentWorkOnRoot.bind(null, root);
  }
  return null;
}
```

## commitRoot

```javascript
function commitRoot(root) {
  const renderPriorityLevel = getCurrentPriorityLevel();
  // 将 ImmediatePriority 更新到当前 priorityLevel 并返回第二个参数 callback 的执行结果
  runWithPriority(
    ImmediatePriority,
    commitRootImpl.bind(null, root, renderPriorityLevel)
  );
  return null;
}
```

## performUnitOfWork

从上至下遍历、操作节点，执行`beginWork`更新组件，返回 next。

```javascript
function performUnitOfWork(unitOfWork: Fiber): Fiber | null {
  // 获取当前节点 current
  const current = unitOfWork.alternate;

  let next;

  next = beginWork(current, unitOfWork, renderExpirationTime);

  // 将 unitOfWork 上待更新的 props 替换成正在用的 props
  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next === null) {
    // 执行完成后，通过 completeUnitOfWork 从下到上根据 effectTag 进行一些处理
    next = completeUnitOfWork(unitOfWork);
  }

  ReactCurrentOwner.current = null;
  return next;
}
```

## completeUnitOfWork

```javascript
function completeUnitOfWork(unitOfWork: Fiber): Fiber | null {
  // Attempt to complete the current unit of work, then move to the next
  // sibling. If there are no more siblings, return to the parent fiber.

  // 先向兄弟节点遍历，如果到头之后再向父节点遍历，直到 root 节点
  workInProgress = unitOfWork;
  do {
    // The current, flushed, state of this fiber is the alternate. Ideally
    // nothing should rely on this, but relying on it here means that we don't
    // need an additional field on the work in progress.
    const current = workInProgress.alternate;
    const returnFiber = workInProgress.return;

    // Check if the work completed or if something threw.
    // 判断节点操作是否完成，或是否报错
    if ((workInProgress.effectTag & Incomplete) === NoEffect) {
      // setCurrentDebugFiberInDEV(workInProgress);
      let next;
      // 完成节点更新
      next = completeWork(current, workInProgress, renderExpirationTime);
      stopWorkTimer(workInProgress);
      // resetCurrentDebugFiberInDEV();
      // 更新节点的 work 时长和子节点的 expirationTime
      resetChildExpirationTime(workInProgress);

      // 如果 next 存在，则代表返回了新的 work
      // 返回 next，以便执行新 work
      if (next !== null) {
        // Completing this fiber spawned new work. Work on that next.
        return next;
      }

      // 如果 父节点存在，且 effectTag 没有被赋值的话
      if (
        returnFiber !== null &&
        // Do not append effects to parents if a sibling failed to complete
        (returnFiber.effectTag & Incomplete) === NoEffect
      ) {
        // Append all the effects of the subtree and this fiber onto the effect
        // list of the parent. The completion order of the children affects the
        // side-effect order.
        if (returnFiber.firstEffect === null) {
          returnFiber.firstEffect = workInProgress.firstEffect;
        }
        if (workInProgress.lastEffect !== null) {
          if (returnFiber.lastEffect !== null) {
            returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
          }
          returnFiber.lastEffect = workInProgress.lastEffect;
        }

        // If this fiber had side-effects, we append it AFTER the children's
        // side-effects. We can perform certain side-effects earlier if needed,
        // by doing multiple passes over the effect list. We don't want to
        // schedule our own side-effect on our own list because if end up
        // reusing children we'll schedule this effect onto itself since we're
        // at the end.
        const effectTag = workInProgress.effectTag;

        // Skip both NoWork and PerformedWork tags when creating the effect
        // list. PerformedWork effect is read by React DevTools but shouldn't be
        // committed.
        if (effectTag > PerformedWork) {
          if (returnFiber.lastEffect !== null) {
            returnFiber.lastEffect.nextEffect = workInProgress;
          } else {
            returnFiber.firstEffect = workInProgress;
          }
          returnFiber.lastEffect = workInProgress;
        }
      }
    } else {
      // This fiber did not complete because something threw. Pop values off
      // the stack without entering the complete phase. If this is a boundary,
      // capture values if possible.
      const next = unwindWork(workInProgress, renderExpirationTime);

      // Because this fiber did not complete, don't reset its expiration time.

      if (next !== null) {
        // If completing this work spawned new work, do that next. We'll come
        // back here again.
        // Since we're restarting, remove anything that is not a host effect
        // from the effect tag.
        // TODO: The name stopFailedWorkTimer is misleading because Suspense
        // also captures and restarts.
        stopFailedWorkTimer(workInProgress);
        next.effectTag &= HostEffectMask;
        return next;
      }
      stopWorkTimer(workInProgress);

      if (returnFiber !== null) {
        // Mark the parent fiber as incomplete and clear its effect list.
        returnFiber.firstEffect = returnFiber.lastEffect = null;
        returnFiber.effectTag |= Incomplete;
      }
    }

    const siblingFiber = workInProgress.sibling;
    if (siblingFiber !== null) {
      // If there is more work to do in this returnFiber, do that next.
      return siblingFiber;
    }
    // Otherwise, return to the parent
    workInProgress = returnFiber;
  } while (workInProgress !== null);

  // We've reached the root.
  if (workInProgressRootExitStatus === RootIncomplete) {
    workInProgressRootExitStatus = RootCompleted;
  }
  return null;
}
```

## commitRootImpl

```javascript
function commitRootImpl(root, renderPriorityLevel) {
  flushPassiveEffects();
  // flushRenderPhaseStrictModeWarningsInDEV();

  const finishedWork = root.finishedWork;
  const expirationTime = root.finishedExpirationTime;
  if (finishedWork === null) {
    return null;
  }
  root.finishedWork = null;
  root.finishedExpirationTime = NoWork;

  // commitRoot never returns a continuation; it always finishes synchronously.
  // So we can clear these now to allow a new callback to be scheduled.
  root.callbackNode = null;
  root.callbackExpirationTime = NoWork;
  root.callbackPriority = NoPriority;
  root.nextKnownPendingLevel = NoWork;

  startCommitTimer();

  // Update the first and last pending times on this root. The new first
  // pending time is whatever is left on the root fiber.
  const remainingExpirationTimeBeforeCommit = getRemainingExpirationTime(
    finishedWork
  );
  markRootFinishedAtTime(
    root,
    expirationTime,
    remainingExpirationTimeBeforeCommit
  );

  if (root === workInProgressRoot) {
    // We can reset these now that they are finished.
    workInProgressRoot = null;
    workInProgress = null;
    renderExpirationTime = NoWork;
  } else {
    // This indicates that the last root we worked on is not the same one that
    // we're committing now. This most commonly happens when a suspended root
    // times out.
  }

  // Get the list of effects.
  let firstEffect;
  if (finishedWork.effectTag > PerformedWork) {
    // A fiber's effect list consists only of its children, not itself. So if
    // the root has an effect, we need to add it to the end of the list. The
    // resulting list is the set that would belong to the root's parent, if it
    // had one; that is, all the effects in the tree including the root.
    if (finishedWork.lastEffect !== null) {
      finishedWork.lastEffect.nextEffect = finishedWork;
      firstEffect = finishedWork.firstEffect;
    } else {
      firstEffect = finishedWork;
    }
  } else {
    // There is no effect on the root.
    firstEffect = finishedWork.firstEffect;
  }

  if (firstEffect !== null) {
    const prevExecutionContext = executionContext;
    executionContext |= CommitContext;
    let prevInteractions: Set<Interaction> | null = null;

    // Reset this to null before calling lifecycles
    ReactCurrentOwner.current = null;

    // The commit phase is broken into several sub-phases. We do a separate pass
    // of the effect list for each phase: all mutation effects come before all
    // layout effects, and so on.

    // The first phase a "before mutation" phase. We use this phase to read the
    // state of the host tree right before we mutate it. This is where
    // getSnapshotBeforeUpdate is called.
    startCommitSnapshotEffectsTimer();
    prepareForCommit(root.containerInfo);
    nextEffect = firstEffect;
    do {
      try {
        commitBeforeMutationEffects(); // getSnapshotBeforeUpdate
      } catch (error) {
        captureCommitPhaseError(nextEffect, error);
        nextEffect = nextEffect.nextEffect;
      }
    } while (nextEffect !== null);
    stopCommitSnapshotEffectsTimer();

    // The next phase is the mutation phase, where we mutate the host tree.
    startCommitHostEffectsTimer();
    nextEffect = firstEffect;
    do {
      try {
        commitMutationEffects();
      } catch (error) {
        invariant(nextEffect !== null, 'Should be working on an effect.');
        captureCommitPhaseError(nextEffect, error);
        nextEffect = nextEffect.nextEffect;
      }
    } while (nextEffect !== null);
    stopCommitHostEffectsTimer();
    resetAfterCommit(root.containerInfo);

    // The work-in-progress tree is now the current tree. This must come after
    // the mutation phase, so that the previous tree is still current during
    // componentWillUnmount, but before the layout phase, so that the finished
    // work is current during componentDidMount/Update.
    root.current = finishedWork;

    // The next phase is the layout phase, where we call effects that read
    // the host tree after it's been mutated. The idiomatic use case for this is
    // layout, but class component lifecycles also fire here for legacy reasons.
    startCommitLifeCyclesTimer();
    nextEffect = firstEffect;
    do {
      try {
        commitLayoutEffects(root, expirationTime); // 提交所有生命周期
      } catch (error) {
        invariant(nextEffect !== null, 'Should be working on an effect.');
        captureCommitPhaseError(nextEffect, error);
        nextEffect = nextEffect.nextEffect;
      }
    } while (nextEffect !== null);
    stopCommitLifeCyclesTimer();

    nextEffect = null;

    // Tell Scheduler to yield at the end of the frame, so the browser has an
    // opportunity to paint.
    requestPaint();

    executionContext = prevExecutionContext;
  } else {
    // No effects.
    root.current = finishedWork;
    // Measure these anyway so the flamegraph explicitly shows that there were
    // no effects.
    // TODO: Maybe there's a better way to report this.
    startCommitSnapshotEffectsTimer();
    stopCommitSnapshotEffectsTimer();

    startCommitHostEffectsTimer();
    stopCommitHostEffectsTimer();
    startCommitLifeCyclesTimer();
    stopCommitLifeCyclesTimer();
  }

  stopCommitTimer();

  const rootDidHavePassiveEffects = rootDoesHavePassiveEffects;

  if (rootDoesHavePassiveEffects) {
    // This commit has passive effects. Stash a reference to them. But don't
    // schedule a callback until after flushing layout work.
    rootDoesHavePassiveEffects = false;
    rootWithPendingPassiveEffects = root;
    pendingPassiveEffectsExpirationTime = expirationTime;
    pendingPassiveEffectsRenderPriority = renderPriorityLevel;
  } else {
    // We are done with the effect chain at this point so let's clear the
    // nextEffect pointers to assist with GC. If we have passive effects, we'll
    // clear this in flushPassiveEffects.
    nextEffect = firstEffect;
    while (nextEffect !== null) {
      const nextNextEffect = nextEffect.nextEffect;
      nextEffect.nextEffect = null;
      nextEffect = nextNextEffect;
    }
  }

  // Check if there's remaining work on this root
  const remainingExpirationTime = root.firstPendingTime;
  if (remainingExpirationTime !== NoWork) {
    const currentTime = requestCurrentTime();
    const priorityLevel = inferPriorityFromExpirationTime(
      currentTime,
      remainingExpirationTime
    );

    scheduleCallbackForRoot(root, priorityLevel, remainingExpirationTime);
  } else {
    // If there's no remaining work, we can clear the set of already failed
    // error boundaries.
    legacyErrorBoundariesThatAlreadyFailed = null;
  }

  onCommitRoot(finishedWork.stateNode, expirationTime);

  if (remainingExpirationTime === Sync) {
    // Count the number of times the root synchronously re-renders without
    // finishing. If there are too many, it indicates an infinite update loop.
    if (root === rootWithNestedUpdates) {
      nestedUpdateCount++;
    } else {
      nestedUpdateCount = 0;
      rootWithNestedUpdates = root;
    }
  } else {
    nestedUpdateCount = 0;
  }

  if (hasUncaughtError) {
    hasUncaughtError = false;
    const error = firstUncaughtError;
    firstUncaughtError = null;
    throw error;
  }

  if ((executionContext & LegacyUnbatchedContext) !== NoContext) {
    // This is a legacy edge case. We just committed the initial mount of
    // a ReactDOM.render-ed root inside of batchedUpdates. The commit fired
    // synchronously, but layout updates should be deferred until the end
    // of the batch.
    return null;
  }

  // If layout work was scheduled, flush it now.
  flushSyncCallbackQueue();
  return null;
}
```
