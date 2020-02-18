# wouter

> https://github.com/molefrog/wouter

## 1: 配置一个全局 Router

在配置路由的时候，首先都会有一个 Router 作为外壳。

```javascript
<Router>
  <div>
    <ul>
      <li>
        <Link to="/about">About</Link>
      </li>
      <li>
        <Link to="/dashboard">Dashboard</Link>
      </li>
    </ul>
    <Switch>
      <Route path="/about">
        <About />
      </Route>
      <Route path="/dashboard" component={<Dashboard />} />
    </Switch>
  </div>
</Router>
```

看一下 Router 的创建方法：

```javascript
const RouterCtx = createContext({});

export const Router = props => {
  const ref = useRef(null);

  // 使用 Ref 来缓存 buildRouter 初始化值
  const value = ref.current || (ref.current = { v: buildRouter(props) });

  // Provider 作为壳
  return h(RouterCtx.Provider, {
    value: value,
    children: props.children
  });
};
```

Router 中也需要记录各种信息，如 `base`, `匹配方法`, `获取当前路由的方法`等，这些由一个初始化方法`buildRouter`实现。

```javascript
const buildRouter = ({
  hook = locationHook, // 返回 [当前路径, 跳转方法], 跳转方法类似 history
  base = '', // 路由的 base 属性
  matcher = makeMatcher() // 匹配器，返回 [路由是否相等, /:params 路由中的参数]
} = {}) => ({ hook, base, matcher });
```

> 在 react-router 中，Router 的 Provider 存储的是 `history`, `location`, `match`

## 2: 在 Router 内配置路由

在 1 中可以看到通过 Switch 和 Route 达到路由配置的目的。

先看一下 Route 的实现：

```javascript
// 根据传入的 path 配置与当前路由对比，返回 [是否匹配, 匹配的params参数]
// eg: path=/about/:ids
export const useRoute = pattern => {
  const [path] = useLocation();
  return useRouter().matcher(pattern, path);
};

// 在 Route 上配置 {path, component, children}
export const Route = ({ path, match, component, children }) => {
  const useRouteMatch = useRoute(path);

  // 判断是否匹配路由，match 由 Switch 下发到 Route 上，并不是手动的配置
  const [matches, params] = match || useRouteMatch;

  // 如果没有匹配则返回 null
  if (!matches) return null;

  // React-Router style `component` prop
  if (component) return h(component, { params });

  // support render prop or plain children
  return typeof children === 'function' ? children(params) : children;
};
```

如果一组 Route 在 Switch 中，则 match 是否为 true 交给 Switch 控制，并返回第一个匹配为 true 的 Route。

```javascript
// Switch 下与当前路由匹配的 Route 会被显示
export const Switch = ({ children, location }) => {
  const { matcher } = useRouter();
  const [originalLocation] = useLocation();

  children = Array.isArray(children) ? children : [children];

  for (const element of children) {
    let match = 0;

    if (
      isValidElement(element) &&
      // Switch 的子元素只要有 path 这个prop 就可以了
      // 路由匹配的会被返回渲染
      (match = element.props.path
        ? matcher(element.props.path, location || originalLocation)
        : [true, {}])[0] // 如果没有 path 则默认返回 true 显示
    )
      return cloneElement(element, { match });
  }

  return null;
};
```

通过上面的配置的应用，会检查当前路径与 Route 中的 path 是否匹配，如果匹配则根据 Route 的配置返回 component 或 children 组件。

## 3: 通过 Link 或 history 方法跳转

useLocation 可以获取跳转方法`navigate`，Link 也是通过该方法来跳转并在此基础上加了一些处理。

```javascript
// 如果 有可用的 children 则显示 children， 否则默认使用 a 标签。
// 点击调用 onClick，并且会在 按下 ctrl, alt 等键时忽略 click 跳转。 点击都会调用跳转方法跳转到 href 或 to
export const Link = props => {
  const [, navigate] = useLocation();
  const { base } = useRouter();

  const href = props.href || props.to; // 跳转的目标链接
  const { children, onClick } = props;

  const handleClick = useCallback(
    event => {
      // ignores the navigation when clicked using right mouse button or
      // by holding a special modifier key: ctrl, command, win, alt, shift
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        event.button !== 0
      )
        return;

      event.preventDefault();
      navigate(href);
      onClick && onClick(event);
    },
    [href, onClick, navigate]
  );

  // wraps children in `a` if needed
  const extraProps = { href: base + href, onClick: handleClick, to: null };
  const jsx = isValidElement(children) ? children : h('a', props);

  return cloneElement(jsx, extraProps);
};
```

## other

### 应用是如何知道页面跳转的？

在`buildRouter`的`locationHook`方法中，监听了`popstate`, `pushState`, `replaceState`时间，并在校验路由改变后，更新页面。

```javascript
export default function locationHook =  ({ base = "" } = {}) => {
  const [path, update] = useState(currentPathname(base)); // 获取浏览器当前地址
  const prevPath = useRef(path);

  useEffect(() => {
    patchHistoryEvents();

    // 将获取到的地址，与存在 ref 的地址比较，如果不同则代表发生了改变需要更新页面
    const checkForUpdates = () => {
      const pathname = currentPathname(base);
      prevPath.current !== pathname && update((prevPath.current = pathname));
    };

    const events = ["popstate", "pushState", "replaceState"]; // HTML5 history API 中的方法 https://developer.mozilla.org/zh-CN/docs/Web/API/History
    events.map(e => addEventListener(e, checkForUpdates));

    // it's possible that an update has occurred between render and the effect handler,
    // so we run additional check on mount to catch these updates. Based on:
    // https://gist.github.com/bvaughn/e25397f70e8c65b0ae0d7c90b731b189
    checkForUpdates();

    return () => events.map(e => removeEventListener(e, checkForUpdates));
  }, []);
```
