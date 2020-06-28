# ReactDOMRoot

## createLegacyRoot

`createRoot`, `createBlockingRoot`, `createLegacyRoot`本质上都是通过`createRootImpl`构建了`root`实例。区别在于 tag 的不同。

```javascript
export function createRoot(container, options) {
  return new ReactDOMRoot(container, options);
}

function ReactDOMRoot(container, options) {
  this._internalRoot = createRootImpl(container, ConcurrentRoot, options);
}

export function createLegacyRoot(container, options) {
  return new ReactDOMBlockingRoot(container, LegacyRoot, options);
}

export function createBlockingRoot(container, options) {
  return new ReactDOMBlockingRoot(container, BlockingRoot, options);
}

function ReactDOMBlockingRoot(container, tag, options) {
  this._internalRoot = createRootImpl(container, tag, options);
}

export type RootTag = 0 | 1 | 2;

export const LegacyRoot = 0;
export const BlockingRoot = 1;
export const ConcurrentRoot = 2;
```

## createRootImpl

```javascript
function createRootImpl(container, tag, options) {
  // 获取 服务端渲染 标记
  const hydrate = options != null && options.hydrate === true;
  const hydrationCallbacks =
    (options != null && options.hydrationOptions) || null;
  // 创建 root 实例
  const root = createContainer(container, tag, hydrate, hydrationCallbacks);
  markContainerAsRoot(root.current, container);
  if (hydrate && tag !== LegacyRoot) {
    const doc =
      container.nodeType === DOCUMENT_NODE
        ? container
        : container.ownerDocument;
    eagerlyTrapReplayableEvents(doc);
  }
  return root;
}
```

## ReactDOMRoot 和 ReactDOMBlockingRoot

prototype 上定义了 4 个方法。`render`方法通过调用`updateContainer`渲染接受到的组件

```javascript
ReactDOMRoot.prototype.render = ReactDOMBlockingRoot.prototype.render = function (
  children,
  callback
) {
  const root = this._internalRoot;
  updateContainer(children, root, null, null);
};

ReactDOMRoot.prototype.unmount = ReactDOMBlockingRoot.prototype.unmount = function (
  callback
) {
  const root = this._internalRoot;
  const container = root.containerInfo;
  updateContainer(null, root, null, () => {
    unmarkContainerAsRoot(container);
  });
};
```
