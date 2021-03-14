# Diff

一个 DOM 节点在某一时刻最多会有 4 个节点和他相关。

- `current Fiber`。如果该 DOM 节点已在页面中，`current Fiber` 代表该 DOM 节点对应的 Fiber 节点。
- `workInProgress Fiber`。如果该 DOM 节点将在本次更新中渲染到页面中，`workInProgress Fiber` 代表该 DOM 节点对应的 Fiber 节点。
- DOM 节点本身。
- JSX 对象。即 `ClassComponent` 的 `render` 方法的返回结果，或 `FunctionComponent` 的调用结果。JSX 对象中包含描述 DOM 节点的信息。

`Diff` 算法的本质是对比 1 和 4，生成 2。

为了降低算法复杂度，React 的 `Diff` 会预设三个限制：

1. 只对同级元素进行 `Diff`。如果一个 `DOM` 节点在前后两次更新中跨越了层级，那么 React 不会尝试复用他。
2. 两个不同类型的元素会产生出不同的树。如果元素由 `div` 变为 `p`，React 会销毁 `div` 及其子孙节点，并新建 `p` 及其子孙节点。
3. 开发者可以通过 `key` 来表示哪些子元素在不同的渲染下能保持稳定。

## 源码入口

`beginWork`不同的`tag`最后都会调用`reconcileChildren`，该方法即是 diff 算法的入口方法。

通过 `ChildReconciler` 调用到它的`reconcileChildFibers`方法。

当 `newChild` 类型为 `object`、`number`、`string`，代表同级只有一个节点

当 `newChild` 类型为 `Array`，同级有多个节点

```javascript
function reconcileChildFibers(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any,
  lanes: Lanes
): Fiber | null {
  // ...

  const isObject = typeof newChild === 'object' && newChild !== null;
  if (isObject) {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE:
        return placeSingleChild(
          reconcileSingleElement(
            returnFiber,
            currentFirstChild,
            newChild,
            lanes
          )
        );
      case REACT_PORTAL_TYPE:
        return placeSingleChild(
          reconcileSinglePortal(returnFiber, currentFirstChild, newChild, lanes)
        );
      case REACT_LAZY_TYPE:
      // reconcileChildFibers
    }
  }

  if (typeof newChild === 'string' || typeof newChild === 'number') {
    // reconcileSingleTextNode
  }

  if (isArray(newChild)) {
    // reconcileChildrenArray
  }

  if (getIteratorFn(newChild)) {
    // reconcileChildrenIterator
  }

  return deleteRemainingChildren(returnFiber, currentFirstChild);
}
```

### 工具方法

```javascript
// 复用 fiber 节点
function useFiber(fiber: Fiber, pendingProps: mixed): Fiber {
  // We currently set sibling to null and index to 0 here because it is easy
  // to forget to do before returning it. E.g. for the single child case.
  const clone = createWorkInProgress(fiber, pendingProps);
  clone.index = 0;
  clone.sibling = null;
  return clone;
}

// 删除 currentFirstChild 的兄弟节点
// 这里的删除并不是立即删除，而是将节点打上标记，在 commit 阶段进行删除。并且在此可以看到，标记是记录在 deletions，flags 属性上的。
function deleteRemainingChildren(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null
): null {
  if (!shouldTrackSideEffects) {
    // mount
    // Noop.
    return null;
  }

  let childToDelete = currentFirstChild;
  while (childToDelete !== null) {
    deleteChild(returnFiber, childToDelete);
    childToDelete = childToDelete.sibling;
  }
  return null;
}

function placeChild(
  newFiber: Fiber,
  lastPlacedIndex: number,
  newIndex: number
): number {
  newFiber.index = newIndex;
  if (!shouldTrackSideEffects) {
    // Noop.
    return lastPlacedIndex;
  }
  const current = newFiber.alternate;

  // update
  if (current !== null) {
    const oldIndex = current.index;
    // 移动了的节点
    if (oldIndex < lastPlacedIndex) {
      // 重新挂载 DOM
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    } else {
      // 没有移动
      return oldIndex;
    }
  } else {
    // 新增插入
    newFiber.flags |= Placement;
    return lastPlacedIndex;
  }
}
```

### 文本/数字 节点

```javascript
function reconcileSingleTextNode(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  textContent: string,
  lanes: Lanes
): Fiber {
  // 符合复用条件: 旧 fiber 的tag 也是 HostText
  if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
    // 复用已有的文本节点，并删除多余节点
    deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
    const existing = useFiber(currentFirstChild, textContent);
    existing.return = returnFiber;
    return existing;
  }
  // 不符合复用条件
  // 删除内部节点，创建 TextFiber
  deleteRemainingChildren(returnFiber, currentFirstChild);
  const created = createFiberFromText(textContent, returnFiber.mode, lanes);
  created.return = returnFiber;
  return created;
}
```

### ReactElement 节点

> extends React.Component 元素

从代码可以看出，React 通过先判断 `key` 是否相同（没有赋值的 `key` 值为 `null`）

- 如果 `key` 相同 且 `type` 相同时， `DOM` 节点才能复用。因为是单个节点 diff，所以通过`deleteRemainingChildren`删除多余的 `sibling` 节点。
- 当 `child !== null` 且 `key` 相同且 `type` 不同时，说明已经找到 fiber 对应的旧 fiber，但 `type` 都已经发生变化不可复用了。执行 `deleteRemainingChildren` 将 `child` 及其兄弟 fiber 都标记删除。
- 当 `child !== null` 且 `key` 不同时仅将 child 标记删除，继续查找能复用的。

```javascript
function reconcileSingleElement(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  element: ReactElement,
  lanes: Lanes
): Fiber {
  const key = element.key;
  let child = currentFirstChild; // fiber.child
  // 判断是否存在对应DOM节点
  while (child !== null) {
    // 比较key是否相同
    if (child.key === key) {
      const elementType = element.type;
      if (elementType === REACT_FRAGMENT_TYPE) {
        if (child.tag === Fragment) {
          // Fragment 可以复用
          deleteRemainingChildren(returnFiber, child.sibling);
          const existing = useFiber(child, element.props.children);
          existing.return = returnFiber;
          return existing;
        }
      } else {
        // 比较 type 是否相同
        if (child.elementType === elementType) {
          // 可以复用
          deleteRemainingChildren(returnFiber, child.sibling);
          const existing = useFiber(child, element.props);
          existing.ref = coerceRef(returnFiber, child, element);
          existing.return = returnFiber;
          return existing;
        }
      }
      deleteRemainingChildren(returnFiber, child); // 当key相同，type 不同，会认为已经把这个节点重新覆盖了，不再查找剩下的是否可以复用，直接删除所有的child，并退出循环
      break;
    } else {
      // 当key不同，直接删除该child，继续检查剩下的sibling是否有能够复用的
      deleteChild(returnFiber, child);
    }
    child = child.sibling; // 遍历 child
  }

  // 当没找到可复用的节点时，重新创建
  // mount 也是该流程
  if (element.type === REACT_FRAGMENT_TYPE) {
    const created = createFiberFromFragment(
      element.props.children,
      returnFiber.mode,
      lanes,
      element.key
    );
    created.return = returnFiber;
    return created;
  } else {
    // createFiberFromElement 通过 ReactElement 创建 fiber 节点
    // 根据 type 类型 创建对应 fiber 节点
    const created = createFiberFromElement(element, returnFiber.mode, lanes);
    created.ref = coerceRef(returnFiber, currentFirstChild, element);
    created.return = returnFiber;
    return created;
  }
}
```

### 数组 节点

- 节点类型及`key`没有变化，其他属性有更新，执行更新逻辑
- 节点新增，执行新增逻辑
- 节点减少，执行删除逻辑
- 节点发生移动

由于 oldChildren 以 fiber 链表形式储存，Diff 算法的整体逻辑会经历两轮遍历：

1. 第一轮遍历：处理更新的节点。
2. 第二轮遍历：处理剩下的不属于更新的节点。

第一轮遍历结束后有以下几种情况：

1. 如果因为 `key` 无法复用跳出循环，则 `oldChildren` 和 `newChildren` 都没有遍历完毕。
2. 如果是遍历完成，那么 `oldChildren` 和 `newChildren` 至少有一个已经遍历完了

开始第二轮遍历时(暂时给第一次遍历能复用的结果命名为 `first`)

- 如果 `oldChildren` 和 `newChildren` 都遍历完了，则 diff 结束
- 如果 `oldChildren` 遍历完了，将剩下的 `newChildren` 依次构建并由第一次遍历的最后一位依次添加
- 如果 `newChildren` 遍历完了，将剩下的 `oldChildren` 标记 `Deletion`
- 如果都没有遍历完

  将 `oldChildren` 以 key/index 做键，fiber 做值，生成 `existingChildren`。

  再遍历剩下的 `newChildren`，对比如果发现可以复用则可以添加到`lastPlacedIndex`，只需要比较遍历到的可复用 `oldFiber` 在上次更新时是否也在 `lastPlacedIndex` 对应的 `oldFiber` 后面，就能知道两次更新中这两个节点的相对位置改变没有。

  ```js
  abcd -> acdb // 遍历新 children， a-c-d 标记不用改变 到 b 时标记移动

  abcd -> dabc // 遍历新 children, d 标记不用改变， a-b-c 标记移动
  ```

```js
function reconcileChildrenArray(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: Array<*>,
  lanes: Lanes
): Fiber | null {
  let resultingFirstChild: Fiber | null = null;
  let previousNewFiber: Fiber | null = null;

  let oldFiber = currentFirstChild;
  // 最后一个可复用的节点在oldFiber中的位置索引
  // lastPlacedIndex初始为0，每遍历一个可复用的节点，如果oldIndex >= lastPlacedIndex，则lastPlacedIndex = oldIndex
  let lastPlacedIndex = 0;

  let newIdx = 0; // newChildren 已经处理到哪个位置了
  let nextOldFiber = null; // 下一个需要比对的 oldFiber，在循环结束时会赋值给 oldFiber

  /**
   * 第一轮遍历步骤如下：
   * let i = 0，遍历newChildren，将 newChildren[i] 与oldFiber比较，判断DOM节点是否可复用。
   *
   * 如果可复用，i++，继续比较newChildren[i]与oldFiber.sibling，可以复用则继续遍历。
   *
   * 如果不可复用，分两种情况：
   * 1. key不同导致不可复用，立即跳出整个遍历，第一轮遍历结束。 -> updateSlot => null
   * 2. key相同type不同导致不可复用，会将oldFiber标记为DELETION，并继续遍历 -> updateSlot => !null
   *
   * 如果newChildren遍历完或者oldFiber遍历完（即 oldFiber !== null && newIdx < newChildren.length），跳出遍历，第一轮遍历结束。
   */
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    // 对比同 index 的 oldFiber 和 newFiber
    if (oldFiber.index > newIdx) {
      nextOldFiber = oldFiber;
      oldFiber = null;
    } else {
      nextOldFiber = oldFiber.sibling;
    }
    // 根据key是否相等以及newChild类型判断是否复用节点并更新内容
    // updateSlot 比较 oldFiber 和 newChild 的 key 是否相等，相等的话可以复用，不相等的话返回 null。
    const newFiber = updateSlot(
      returnFiber,
      oldFiber,
      newChildren[newIdx],
      lanes
    );

    // 当不可复用，跳过该次对比
    // 即在 updateSlot 的比对中，遇到 key 不同会跳出遍历
    if (newFiber === null) {
      if (oldFiber === null) {
        oldFiber = nextOldFiber;
      }
      break;
    }
    // key 相同 可以复用
    // mount: false / update: true
    if (shouldTrackSideEffects) {
      // 删除剩下的 oldFiber
      if (oldFiber && newFiber.alternate === null) {
        deleteChild(returnFiber, oldFiber);
      }
    }
    // placeChild 方法用于将 newFiber 节点挂载到 DOM 树上，不是真正的挂载，而是设置 Placement 标记位
    lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
    if (previousNewFiber === null) {
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;

    // 处理下一个 oldFiber
    oldFiber = nextOldFiber;
  }

  // 当跳出第一次遍历后
  // newChildren 先遍历完毕，即没有需要更新的节点，将老的剩下的节点删除，退出方法
  if (newIdx === newChildren.length) {
    deleteRemainingChildren(returnFiber, oldFiber);
    return resultingFirstChild;
  }

  // oldChildren 先遍历完毕，还剩下新的节点需要插入，将剩下的 newChildren 创建节点， 退出方法
  if (oldFiber === null) {
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx], lanes);
      if (newFiber === null) {
        continue;
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
    return resultingFirstChild;
  }

  // 当不符合以上条件时，即oldChildren 和 newChildren 都有剩余时
  // 遍历 oldChildren 将 oldFiber 插入到对应的 key/index(没有传key) 中，最后返回集合 existingChildren<Map>
  const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

  // 遍历剩下的 newChildren
  for (; newIdx < newChildren.length; newIdx++) {
    // 类似 updateSlot, 将 oldFiber[key] 与 newFiber[key] 比对 判断是否能复用
    const newFiber = updateFromMap(
      existingChildren,
      returnFiber,
      newIdx,
      newChildren[newIdx],
      lanes
    );
    // 找到能复用的节点
    if (newFiber !== null) {
      if (shouldTrackSideEffects) {
        if (newFiber.alternate !== null) {
          // 删除对应的 oldFiber
          existingChildren.delete(
            newFiber.key === null ? newIdx : newFiber.key
          );
        }
      }
      //
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
  }

  // 删除剩下的 oldFiber
  if (shouldTrackSideEffects) {
    existingChildren.forEach((child) => deleteChild(returnFiber, child));
  }

  return resultingFirstChild;
}

function updateSlot(
  returnFiber: Fiber,
  oldFiber: Fiber | null,
  newChild: any,
  lanes: Lanes
): Fiber | null {
  const key = oldFiber !== null ? oldFiber.key : null;

  // 如果 key 不为 null，那么就代表老节点不是 TextNode，而新节点又是 TextNode，所以返回 null，不能复用，反之则可以复用
  if (typeof newChild === 'string' || typeof newChild === 'number') {
    if (key !== null) {
      return null;
    }
    return updateTextNode(returnFiber, oldFiber, '' + newChild, lanes);
  }

  // 如果是 react element， 判断 key 和 元素的类型是否相等来判断是否可以复用
  if (typeof newChild === 'object' && newChild !== null) {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE: {
        if (newChild.key === key) {
          return updateElement(returnFiber, oldFiber, newChild, lanes);
        } else {
          return null;
        }
      }
      case REACT_PORTAL_TYPE: {
        if (newChild.key === key) {
          return updatePortal(returnFiber, oldFiber, newChild, lanes);
        } else {
          return null;
        }
      }
      case REACT_LAZY_TYPE: {
        if (enableLazyElements) {
          const payload = newChild._payload;
          const init = newChild._init;
          return updateSlot(returnFiber, oldFiber, init(payload), lanes);
        }
      }
    }

    // 如果 key 不为 null，那么就代表老节点不是Array，而新节点又是 Array，所以返回 null，不能复用，反之则可以复用
    if (isArray(newChild) || getIteratorFn(newChild)) {
      if (key !== null) {
        return null;
      }
      return updateFragment(returnFiber, oldFiber, newChild, lanes, null);
    }
  }

  return null;
}

// 标记需要重新排放位置的节点，并移动 lastPlacedIndex 标记
function placeChild(
  newFiber: Fiber,
  lastPlacedIndex: number,
  newIndex: number
): number {
  newFiber.index = newIndex;
  if (!shouldTrackSideEffects) {
    // Noop.
    return lastPlacedIndex;
  }
  const current = newFiber.alternate;
  // update 阶段
  if (current !== null) {
    const oldIndex = current.index;
    // 如果 oldIndex < lastPlacedIndex 该可复用节点之前插入的位置索引小于这次更新需要插入的位置索引，代表该节点需要向右移动
    if (oldIndex < lastPlacedIndex) {
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    } else {
      // 如果 oldIndex >= lastPlacedIndex 代表该可复用节点不需要移动，并将 lastPlacedIndex = oldIndex;
      return oldIndex;
    }
  } else {
    newFiber.flags |= Placement;
    return lastPlacedIndex;
  }
}
```

```js
// Demo1
在Demo中我们简化下书写，每个字母代表一个节点，字母的值代表节点的key


// 之前
abcd

// 之后
acdb

===第一轮遍历开始===
a（之后）vs a（之前）
key不变，可复用
此时 a 对应的oldFiber（之前的a）在之前的数组（abcd）中索引为0
所以 lastPlacedIndex = 0;

继续第一轮遍历...

c（之后）vs b（之前）
key改变，不能复用，跳出第一轮遍历
此时 lastPlacedIndex === 0;
===第一轮遍历结束===

===第二轮遍历开始===
newChildren === cdb，没用完，不需要执行删除旧节点
oldFiber === bcd，没用完，不需要执行插入新节点

将剩余oldFiber（bcd）保存为map

// 当前oldFiber：bcd
// 当前newChildren：cdb

继续遍历剩余newChildren

key === c 在 oldFiber中存在
const oldIndex = c（之前）.index;
此时 oldIndex === 2;  // 之前节点为 abcd，所以c.index === 2
比较 oldIndex 与 lastPlacedIndex;

如果 oldIndex >= lastPlacedIndex 代表该可复用节点不需要移动
并将 lastPlacedIndex = oldIndex;
如果 oldIndex < lastplacedIndex 该可复用节点之前插入的位置索引小于这次更新需要插入的位置索引，代表该节点需要向右移动

在例子中，oldIndex 2 > lastPlacedIndex 0，
则 lastPlacedIndex = 2;
c节点位置不变

继续遍历剩余newChildren

// 当前oldFiber：bd
// 当前newChildren：db

key === d 在 oldFiber中存在
const oldIndex = d（之前）.index;
oldIndex 3 > lastPlacedIndex 2 // 之前节点为 abcd，所以d.index === 3
则 lastPlacedIndex = 3;
d节点位置不变

继续遍历剩余newChildren

// 当前oldFiber：b
// 当前newChildren：b

key === b 在 oldFiber中存在
const oldIndex = b（之前）.index;
oldIndex 1 < lastPlacedIndex 3 // 之前节点为 abcd，所以b.index === 1
则 b节点需要向右移动
===第二轮遍历结束===

最终acd 3个节点都没有移动，b节点被标记为移动

// Demo2

// 之前
abcd

// 之后
dabc

===第一轮遍历开始===
d（之后）vs a（之前）
key改变，不能复用，跳出遍历
===第一轮遍历结束===

===第二轮遍历开始===
newChildren === dabc，没用完，不需要执行删除旧节点
oldFiber === abcd，没用完，不需要执行插入新节点

将剩余oldFiber（abcd）保存为map

继续遍历剩余newChildren

// 当前oldFiber：abcd
// 当前newChildren dabc

key === d 在 oldFiber中存在
const oldIndex = d（之前）.index;
此时 oldIndex === 3; // 之前节点为 abcd，所以d.index === 3
比较 oldIndex 与 lastPlacedIndex;
oldIndex 3 > lastPlacedIndex 0
则 lastPlacedIndex = 3;
d节点位置不变

继续遍历剩余newChildren

// 当前oldFiber：abc
// 当前newChildren abc

key === a 在 oldFiber中存在
const oldIndex = a（之前）.index; // 之前节点为 abcd，所以a.index === 0
此时 oldIndex === 0;
比较 oldIndex 与 lastPlacedIndex;
oldIndex 0 < lastPlacedIndex 3
则 a节点需要向右移动

继续遍历剩余newChildren

// 当前oldFiber：bc
// 当前newChildren bc

key === b 在 oldFiber中存在
const oldIndex = b（之前）.index; // 之前节点为 abcd，所以b.index === 1
此时 oldIndex === 1;
比较 oldIndex 与 lastPlacedIndex;
oldIndex 1 < lastPlacedIndex 3
则 b节点需要向右移动

继续遍历剩余newChildren

// 当前oldFiber：c
// 当前newChildren c

key === c 在 oldFiber中存在
const oldIndex = c（之前）.index; // 之前节点为 abcd，所以c.index === 2
此时 oldIndex === 2;
比较 oldIndex 与 lastPlacedIndex;
oldIndex 2 < lastPlacedIndex 3
则 c节点需要向右移动

===第二轮遍历结束===

```

可以看到，我们以为从 abcd 变为 dabc，只需要将 d 移动到前面。

但实际上 React 保持 d 不变，将 abc 分别移动到了 d 的后面。

从这点可以看出，考虑性能，我们要尽量减少将节点从后面移动到前面的操作。
