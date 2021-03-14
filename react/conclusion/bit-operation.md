属性增加

```js
ABC = A | B | C;
```

属性删除

```js
AB = ABC & ~C;
```

属性比较

```js
// AB 当中包含 B
AB & (B === B);
// AB 当中不包含 C
AB & (C === 0);
// A 和 B 相等
A === B;
```

getHighestPriorityLane: 分离出最高优先级

```js
function getHighestPriorityLane(lanes: Lanes) {
  return lanes & -lanes;
}
```

getLowestPriorityLane: 分离出最低优先级

```js
function getLowestPriorityLane(lanes: Lanes): Lane {
  // This finds the most significant non-zero bit.
  const index = 31 - clz32(lanes);
  return index < 0 ? NoLanes : 1 << index;
}
```
