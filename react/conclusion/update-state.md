# 状态更新

> https://react.iamkasong.com/state/prepare.html

在 React 中，有如下方法可以触发状态更新（排除 SSR）：

- ReactDOM.render - HostRoot
- this.setState - ClassComponent
- this.forceUpdate - ClassComponent
- useState - FunctionComponent
- useReducer - FunctionComponent

每次状态更新都会创建一个保存更新状态相关内容的对象，叫做`Update`。在`render`阶段的`beginWork`中会根据`Update`计算新的 state。

在执行更新方法后，最后都会调用到`scheduleUpdateOnFiber`(参考 03)开始调度更新。

对于`HostRoot`和`ClassComponent`，拥有相同结构的`Update`，对于`FunctionComponent`则拥有自己的一套结构

```js
const update: Update<*> = {
  eventTime,
  lane, // 优先级相关字段

  tag: UpdateState, // 更新的类型，包括UpdateState | ReplaceState | ForceUpdate | CaptureUpdate
  payload: null, // 更新挂载的数据，不同类型组件挂载的数据不同
  callback: null,

  next: null,
};
// FunctionComponent
const update: Update<S, A> = {
  lane,
  action,
  eagerReducer: null,
  eagerState: null,
  next: (null: any),
};
```

触发更新时，将`Update`通过`enqueueUpdate`方法添加到 `fiber.updateQueue.shared.pending` 上，多个`Update`会以链表结构储存，通过`next`属性链接。

```js
const queue: UpdateQueue<State> = {
  baseState: fiber.memoizedState, // 本次更新前该Fiber节点的state，Update基于该state计算更新后的state
  // 本次更新前该Fiber节点已保存的Update,以链表形式存在，链表头为firstBaseUpdate，链表尾为lastBaseUpdate。之所以在更新产生前该Fiber节点内就存在Update，是由于某些Update优先级较低所以在上次render阶段由Update计算state时被跳过。
  firstBaseUpdate: null,
  lastBaseUpdate: null,

  shared: {
    pending: null, // 触发更新时，产生的Update会保存在shared.pending中形成单向环状链表。
    interleaved: null,
    lanes: NoLanes,
  },
  effects: null,
};
```

假设有一个 fiber 刚经历 commit 阶段完成渲染。

该 fiber 上有两个由于优先级过低所以在上次的 render 阶段并没有处理的`Update`。他们会成为下次更新的`baseUpdate`

```js
// 称其为 u1 和 u2，其中 u1.next === u2。
fiber.updateQueue.firstBaseUpdate === u1;
fiber.updateQueue.lastBaseUpdate === u2;
// u1.next === u2;

// 用-->表示链表的指向：
// fiber.updateQueue.baseUpdate: u1 --> u2

// 现在在fiber上触发两次状态更新，这会产生两个新Update。
// 称其为u3和u4。
fiber.updateQueue.shared.pending === u3;
// u3.next === u4;
// u4.next === u3;

// 由于shared.pending是环状链表，用图表示为：

// fiber.updateQueue.shared.pending:   u3 --> u4
//                                      ^      |
//                                      |______|

// 更新调度完成后进入render阶段。

// 此时shared.pending的环被剪开并连接在updateQueue.lastBaseUpdate后面：

// fiber.updateQueue.baseUpdate: u1 --> u2 --> u3 --> u4
```

接下来遍历`updateQueue.baseUpdate`链表，以`fiber.updateQueue.baseState`为初始`state`，依次与遍历到的每个`Update`计算并产生新的`state`（该操作类比 Array.prototype.reduce）。

在遍历时如果有优先级低的`Update`会被跳过。

当遍历完成后获得的`state`，就是该 Fiber 节点在本次更新的`state`（源码中叫做`memoizedState`）。

`render`阶段的`Update`操作由`processUpdateQueue`完成

`state`的变化在 render 阶段产生与上次更新不同的 JSX 对象，通过 Diff 算法产生`flags`，在`commit`阶段渲染在页面上。

渲染完成后`workInProgress Fiber`树变为`current Fiber`树，整个更新流程结束。

> 更新优先级
> https://react.iamkasong.com/state/priority.html