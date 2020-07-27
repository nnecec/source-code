# lane

lane 模型相对于 expireTime 模型有两个优点：

1. lane 将任务优先级（task A 优先于 task B？）从任务批量处理（task A 属于 task B 的一部分？）中分离
2. lane 可以使用单个 32 位数据类型表示许多不同的任务线程。

在旧模型中，要决定是否在【正在处理的批处理】中包括【给定的工作单元】，我们将比较它们的相对优先级：

```js
const isTaskIncludedInBatch = priorityOfTask >= priorityOfBatch;
```

之所以可行，是因为我们施加了一个约束，即除非还包括较高优先级的任务，否则不允许较低优先级的任务完成。

在给定优先级 A> B> C 的情况下，在对 A 进行处理时，不能对 B 进行处理。 也不能在 B 和 A 上处理的情况下，处理 C。

该约束是在 Suspense 之前设计的，并且在当时是有道理的。当所有的工作都受 CPU 限制时，除了按优先级排序以外，没有太多理由以其他顺序处理任务。但是，当引入受 IO-bound（即挂起）的任务时，可能会遇到一种情况，即较高优先级的 IO-bound 任务会阻止较低优先级的 CPU-bound 任务无法完成。

expireTime 类似的缺陷是它在表达一组多个优先级时受到限制。

就内存或计算而言，使用 Set 对象是不切实际的-我们正在处理的存在性检查非常普遍，因此它们需要快速且尽可能少地使用内存。

作为一种权衡，通常我们要做的是维持一系列优先级：

```js
const isTaskIncludedInBatch =
  taskPriority <= highestPriorityInRange &&
  taskPriority >= lowestPriorityInRange;
```

抛开这需要两个单独的字段，即使这在其表达能力上也相当有限。你可以表达封闭，连续的任务范围。 但是不能代表有限的一组不同任务。例如，给定一系列任务，如何删除位于该范围中间的任务？ 即使在我们设计了一个不错的解决方法的情况下，以这种方式对任务组进行推理也变得极为混乱，并且易于产生缺陷。

最初是出于设计，但后来更多的是出于偶然，旧模型将以下两个概念结合在一起：1）优先级划分 2）批处理为单个数据类型。 除了影响他人外，也限制了我们的表达能力。

在新模型中，我们将这两个概念解耦了。 任务组不是用相对数表示，而是用位掩码表示：

```js
const isTaskIncludedInBatch = (task & batchOfTasks) !== 0;
```

代表任务的位掩码的类型称为 Lane。代表批次的位掩码的类型称为 Lanes。

用更具体的 React 术语来说，由 setState 调度的更新对象包含一个`lane`字段，一个启用了一位的位掩码。 这将替换旧模型中的`update.expirationTime`字段。

另一方面，fiber 不仅与单个更新关联，而且可能与多个更新关联。 因此它具有一个`lanes`字段，一个启用了零个或多个位的位掩码（旧模型中为`fiber.expirationTime`）； 和`childLanes`字段（`fiber.childExpirationTime`）。

Lanes 是一种不透明类型。你只能在 `ReactFiberLane` 模块中执行直接的位掩码操作。在其他地方，必须从该模块导入帮助函数。这是一种权衡，但我认为它最终是值得的，因为处理 Lane 可能非常不明显，将所有逻辑并置在一起将使我们更容易调整启发式方法，而不必每次都进行巨大的重构。

- renderExpirationtime -> renderLanes
- update.expirationTime -> update.lane
- fiber.expirationTime -> fiber.lanes
- fiber.childExpirationTime -> fiber.childLanes
- root.firstPendingTime and root.lastPendingTime -> fiber.pendingLanes

## Reference

1. [Initial Lanes implementation](https://github.com/facebook/react/pull/18796)
