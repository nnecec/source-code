# wouter

> https://github.com/molefrog/wouter

## Part 1: 配置一个全局 Router

在 Router 下，配置各个 Route。

Router 中也需要记录各种信息，如 `base`, `匹配方法`, `获取当前路由的方法`等。

Router 和 useRouter 用来实现该功能。

## Part 2: 在页面内通过 Switch 和 Route 配置应用的路由

在 Switch 中校验路径与其内部的 Route 配置是否匹配，如果匹配则显示。

## Part 3: 通过 Link 或 history 方法跳转

useLocation 可以获取跳转方法，Link 也是通过该方法来跳转并在此基础上加了一些处理。
