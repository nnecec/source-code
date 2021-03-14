# Type

## FiberRootNode

```javascript
type FiberRoot = {
  // The type of root (legacy, batched, concurrent, etc.)
  tag: RootTag,

  // Any additional information from the host associated with this root.
  containerInfo: any,
  // Used only by persistent updates.
  pendingChildren: any,
  // The currently active root fiber. This is the mutable root of the tree.
  current: Fiber, // 对应的 fiber

  pingCache:
    | WeakMap<Thenable, Set<ExpirationTime>>
    | Map<Thenable, Set<ExpirationTime>>
    | null,

  finishedExpirationTime: ExpirationTime,
  // A finished work-in-progress HostRoot that's ready to be committed.
  finishedWork: Fiber | null, // 已结束状态的 work-in-progress HostRoot 等待被 commit
  // Timeout handle returned by setTimeout. Used to cancel a pending timeout, if
  // it's superseded by a new one.
  timeoutHandle: TimeoutHandle | NoTimeout, // 如果被一个新的取代，则用来取消 pending timeout
  // Top context object, used by renderSubtreeIntoContainer
  context: Object | null, // renderSubtreeIntoContainer 的 context 对象
  pendingContext: Object | null,
  // Determines if we should attempt to hydrate on the initial mount
  +hydrate: boolean,
  // List of top-level batches. This list indicates whether a commit should be
  // deferred. Also contains completion callbacks.
  // TODO: Lift this into the renderer
  firstBatch: Batch | null,
  // Node returned by Scheduler.scheduleCallback
  callbackNode: *,
  // Expiration of the callback associated with this root
  callbackExpirationTime: ExpirationTime, // 与该 root 相关的回调 expirationTime
  // The earliest pending expiration time that exists in the tree
  firstPendingTime: ExpirationTime, // 最早的挂起 expirationTime
  // The latest pending expiration time that exists in the tree
  lastPendingTime: ExpirationTime,
  // The time at which a suspended component pinged the root to render again
  pingTime: ExpirationTime, // 暂停的组件 再次渲染的时间
  interactionThreadID: number,
  memoizedInteractions: Set<Interaction>,
  pendingInteractionMap: PendingInteractionMap,
};
```

## FiberNode

Fiber Reconciler 作为 React 的默认调度器，核心数据结构就是由 FiberNode 组成的 Node Tree

```javascript
export type Fiber = {|
  // 作为静态数据结构的属性
  tag: WorkTag, //  FiberNode 组件类型 -> ReactWorkTags.js 如FunctionComponent, ClassComponent, HostComponent
  key: null | string,
  elementType: any, // 约等于 type
  // 异步加载的组件解析后的类型
  type: any, // FunctionComponent=function , ClassComponent = Class, HostComponent = div
  // Node储存空间，通过 stateNode 绑定如 FiberNode 对应的 Dom、FiberRoot、ReactComponent 实例
  // 比如，
  // DOM组件对应DOM节点实例
  // ClassComponent对应Class实例
  // FunctionComponent没有实例，所以stateNode值为null
  // state更新了或props更新了均会更新到stateNode上
  stateNode: any,

  // 用于连接其他Fiber节点形成Fiber树
  // 指向该对象在Fiber节点树中的parent，用来在处理完该节点后返回
  return: Fiber | null,
  // 指向自己的第一个子节点
  child: Fiber | null,
  // 指向自己的兄弟结构
  sibling: Fiber | null,
  index: number,
  ref: null | (((handle: mixed) => void) & { _stringRef: ?string }) | RefObject,

  // 动态工作单元
  // 即将到来的新 props，即 nextProps
  pendingProps: any, // This type will be more specific once we overload the tag.
  // 上一次渲染完成后的 props，即 props
  memoizedProps: any, // The props used to create the output.

  // fiber 对应的组件产生的 Update 会存在队列里
  updateQueue: UpdateQueue<any> | null,
  // 上一次渲染处理之后的 state
  memoizedState: any,
  // 一个列表，存储该Fiber依赖的contexts，events
  dependencies: Dependencies | null,

  // 用来描述当前Fiber和他子树的`Bitfield`
  // 共存的模式表示这个子树是否默认是异步渲染的, Fiber被创建的时候他会继承父Fiber, 其他的标识也可以在创建的时候被设置, 但是在创建之后不应该再被修改，特别是他的子Fiber创建之前
  // mode有 ConcurrentMode 和 StrictMode
  // 用来描述当前Fiber和其他子树的Bitfield
  // 共存的模式表示这个子树是否默认是 异步渲染的

  // Fiber刚被创建时，会继承父Fiber
  // 其他标识也可以在创建的时候被设置，但是创建之后不该被修改，特别是它的子Fiber创建之前
  mode: TypeOfMode, // constant -> TypeOfMode

  // Effect
  flags: Flags,
  subtreeFlags: Flags,
  // diff阶段标记的需要删除的节点
  deletions: Array<Fiber> | null,

  // 单链表 用来快速查找下一个side effect
  nextEffect: Fiber | null,
  // 子树中第一个和最后一个 side-effect，
  firstEffect: Fiber | null,
  lastEffect: Fiber | null,

  // 调度优先级
  lanes: Lanes,
  childLanes: Lanes,

  // 在 fiber 树更新的过程中，都会有一个跟其对应的 fiber 镜像
  // 我们称他为`current <==> workInProgress`
  // 在渲染完成之后他们会交换位置
  alternate: Fiber | null,
|};
```

## Update

```javascript
type Update = {
  expirationTime: ExpirationTime,

  tag: 0 | 1 | 2 | 3, // UpdateState = 0 ReplaceState = 1 ForceUpdate = 2 CaptureUpdate = 3
  payload: any, // 更新内容，比如`setState`接收的第一个参数
  callback: (() => mixed) | null,

  next: Update<State> | null, // 指向下一个更新
  nextEffect: Update<State> | null, // 指向下一个 side effect
};
```

## UpdateQueue

```javascript
type UpdateQueue = {
  baseState: State, // 每次操作完更新之后的 state

  // 第一个和最后一个 Update
  firstUpdate: Update<State> | null,
  lastUpdate: Update<State> | null,

  // 第一个和最后一个 捕获类型的 Update
  firstCapturedUpdate: Update<State> | null,
  lastCapturedUpdate: Update<State> | null,

  // 第一个和最后一个 side effect
  firstEffect: Update<State> | null,
  lastEffect: Update<State> | null,

  // 第一个和最后一个捕获产生的 side effect
  firstCapturedEffect: Update<State> | null,
  lastCapturedEffect: Update<State> | null,
};
```

## Hook

```javascript
type Hook = {
  memoizedState: any,

  baseState: any,
  baseUpdate: Update<any, any> | null,
  queue: UpdateQueue<any, any> | null,

  next: Hook | null,
};
```
