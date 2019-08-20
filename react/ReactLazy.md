# ReactLazy

传入一个为方法的参数，返回 LazyComponent。

```javascript
import type { LazyComponent, Thenable } from "shared/ReactLazyComponent";

import { REACT_LAZY_TYPE } from "shared/ReactSymbols";
import warning from "shared/warning";

export function lazy<T, R>(ctor: () => Thenable<T, R>): LazyComponent<T> {
  let lazyType = {
    $$typeof: REACT_LAZY_TYPE,
    _ctor: ctor,
    // React uses these fields to store the result.
    _status: -1,
    _result: null
  };

  return lazyType;
}
```
