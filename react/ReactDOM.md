# ReactDOM.render

## render

react-dom 的`render`方法是目前渲染组件的方法，服务端的渲染方法将由`hydrate`替代。可以看到两者仅有一个参数的区别。

```javascript
const ReactDOM = {
  hydrate(element, container, callback) {
    return legacyRenderSubtreeIntoContainer(
      null,
      element,
      container,
      true,
      callback
    );
  },

  render(element, container, callback) {
    return legacyRenderSubtreeIntoContainer(
      null,
      element,
      container,
      false,
      callback
    );
  }
};
```

## legacyRenderSubtreeIntoContainer

ReactDOM 中的 `render`, `hydrate`, `unstable_renderSubtreeIntoContainer`, `unmountComponentAtNode`都是`legacyRenderSubtreeIntoContainer`的加壳方法，返回的是`ReactWork`对象。

在`legacyRenderSubtreeIntoContainer`中，通过`legacyCreateRootFromDOMContainer`方法一连串的调用，创建并返回了`ReactRoot`实例并赋值给 root。

ReactRoot 就是整个 React 应用的入口，然后调用实例的`render`方法逐步渲染内部组件。

在经过该方法处理后 container 的结构变为

```javascript
container = {
  _reactRootContainer: { // legacyCreateRootFromDOMContainer
    _internalRoot: { // ReactRoot
      containerInfo: {},
      current: { // createFiberRoot
        // Fiber
      },
      ...
    }
  }
}
```

之后调用组件`render`，其实都是调用`updateContainer`方法，区别在于是否传了`parentComponent`参数。

```javascript
function legacyRenderSubtreeIntoContainer(
  parentComponent, // 当前组件的父组件，第一次渲染时为 null
  children, // 要插入 DOM 中的组件
  container, // 要插入的容器，如document.getElementById('app')
  forceHydrate, // 是否 hydrate (hydrate=false  render=true)
  callback, // 完成后的回调函数
) {
  let root = container._reactRootContainer;
  if (!root) { // 如果没有 root 则说明是第一次构建
  // 通过 legacyCreateRootFromDOMContainer 初次构建 ReactRoot 并缓存到 _reactRootContainer 属性上
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
      container,
      forceHydrate,
    );
    fiberRoot = root._internalRoot;
    if (typeof callback === 'function') {
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(root._internalRoot);
        originalCallback.call(instance);
      };
    }
    // 初次构建无需经过 batch 处理
    unbatchedUpdates(() => {
      updateContainer(children, fiberRoot, parentComponent, callback);
    });
  } else { // 在不是第一次构建的情况下
    fiberRoot = root._internalRoot;
    if (typeof callback === 'function') {
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }
    // Update
    updateContainer(children, fiberRoot, parentComponent, callback);
  }
  return getPublicRootInstance(root._internalRoot); // 返回根容器 Fiber 实例
```

### legacyCreateRootFromDOMContainer

```javascript
function legacyCreateRootFromDOMContainer(container, forceHydrate) {
  const shouldHydrate =
    forceHydrate || shouldHydrateDueToLegacyHeuristic(container); // 初始化 shouldHydrate

  // 如果是客户端渲染，则将 container 的 child 清空
  if (!shouldHydrate) {
    let warned = false;
    let rootSibling;
    while ((rootSibling = container.lastChild)) {
      container.removeChild(rootSibling);
    }
  }

  return createLegacyRoot(
    // createLegacyRoot -> ReactDOMRoot.md
    container,
    shouldHydrate
      ? {
          hydrate: true
        }
      : undefined
  );
}
```
