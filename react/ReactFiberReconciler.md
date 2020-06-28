# ReactFiberReconciler

## createContainer

根据`containerInfo`创建 root 对象，`containerInfo`属性引用`ReactDOM.render(<div/>, container)`的第二个参数。通过另外两个参数配置 root。

```javascript
// 参数来自 ReactRoot 构造函数
export function createContainer(
  containerInfo,
  tag,
  hydrate,
  hydrationCallbacks
) {
  return createFiberRoot(containerInfo, tag, hydrate, hydrationCallbacks); // createFiberRoot -> ReactFiberRoot.js
}
```

## getPublicRootInstance

```javascript
export const HostComponent = 5;

export function getPublicRootInstance(container) {
  const containerFiber = container.current;
  if (!containerFiber.child) {
    return null;
  }
  switch (containerFiber.child.tag) {
    case HostComponent:
      return getPublicInstance(containerFiber.child.stateNode);
    default:
      return containerFiber.child.stateNode;
  }
}
```

## updateContainer

更新容器内的显示内容。

```javascript
export function updateContainer(
  element, // 需要渲染的 element
  container, // element 的 root 容器
  parentComponent, // ReactDOM.render 传入的 parentComponent
  callback
) {
  const current = container.current; // Fiber 对象
  const eventTime = requestEventTime(); // 获取当前时间
  const suspenseConfig = requestCurrentSuspenseConfig();
  const lane = requestUpdateLane(current, suspenseConfig);

  const context = getContextForSubtree(parentComponent);
  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }

  const update = createUpdate(eventTime, lane, suspenseConfig);
  // Caution: React DevTools currently depends on this property
  // being called "element".
  update.payload = { element }; // element 是需要渲染的 JSX，挂载在 update.payload 上，赋予了时间的先后顺序。

  callback = callback === undefined ? null : callback;
  if (callback !== null) {
    update.callback = callback;
  }

  enqueueUpdate(current, update); // 将 update 置入更新队列
  scheduleWork(current, expirationTime);

  return expirationTime;
}
```
