import locationHook from './use-location.js'
import makeMatcher from './matcher.js'

import {
  useRef,
  useLayoutEffect,
  useContext,
  useCallback,
  createContext,
  isValidElement,
  cloneElement,
  createElement as h
} from './react-deps.js.js'

/*
 * Part 1, Hooks API: useRouter, useRoute and useLocation
 */

// 使用 context 作为全局的存储器，来存储路由 Router 所需要的数据
const RouterCtx = createContext({})

const buildRouter = ({
  hook = locationHook, // 返回 [路径, 跳转方法]
  base = '',
  matcher = makeMatcher() // 匹配器，返回 [路由是否相等, /:params 路由中的参数]
} = {}) => ({ hook, base, matcher })

// 获取 Router，如果没有则通过 buildRouter 初始化
export const useRouter = () => {
  const globalRef = useContext(RouterCtx)

  // 获取 RouterContext，如果有 v 则说明已经初始化过
  return globalRef.v || (globalRef.v = buildRouter())
}

// 获取路由信息
export const useLocation = () => {
  const router = useRouter()
  return router.hook(router)
}

// 根据传入的 模版路由 与当前路由对比，返回 [是否匹配, 匹配的params参数]
export const useRoute = pattern => {
  const [path] = useLocation()
  return useRouter().matcher(pattern, path)
}

/*
 * Part 2, Low Carb Router API: Router, Route, Link, Switch
 */

export const Router = props => {
  const ref = useRef(null)

  // 使用 Ref 来缓存 buildRouter 初始化值
  const value = ref.current || (ref.current = { v: buildRouter(props) })

  // Provider 作为壳 将数据传递给内部
  return h(RouterCtx.Provider, {
    value: value,
    children: props.children
  })
}

// 在 Route 上配置 {path, component, children}
export const Route = ({ path, match, component, children }) => {
  const useRouteMatch = useRoute(path)

  // 判断是否匹配路由，match 由 Switch 下发到 Route 上
  const [matches, params] = match || useRouteMatch

  // 如果没有匹配则返回 null
  if (!matches) return null

  // React-Router style `component` prop
  if (component) return h(component, { params })

  // support render prop or plain children
  return typeof children === 'function' ? children(params) : children
}

// 如果 有可用的 children 则显示 children， 否则默认使用 a 标签。
// 点击调用 onClick，并且会在 按下 ctrl, alt 等键时忽略 click。 点击都会调用跳转方法跳转到 href 或 to
export const Link = props => {
  const [, navigate] = useLocation()
  const { base } = useRouter()

  const href = props.href || props.to
  const { children, onClick } = props

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
      ) { return }

      event.preventDefault()
      navigate(href)
      onClick && onClick(event)
    },
    [href, onClick, navigate]
  )

  // wraps children in `a` if needed
  const extraProps = { href: base + href, onClick: handleClick, to: null }
  const jsx = isValidElement(children) ? children : h('a', props)

  return cloneElement(jsx, extraProps)
}

// Switch 下与当前路由匹配的 Route 会被显示
export const Switch = ({ children, location }) => {
  const { matcher } = useRouter()
  const [originalLocation] = useLocation()

  children = Array.isArray(children) ? children : [children]

  for (const element of children) {
    let match = 0

    if (
      isValidElement(element) &&
      // Switch 的子元素只要有 path 这个prop 就可以了
      // 路由匹配的会被返回渲染
      (match = element.props.path
        ? matcher(element.props.path, location || originalLocation)
        : [true, {}]
      )[0]
    ) { return cloneElement(element, { match }) }
  }

  return null
}

// 在加载完成后跳转
export const Redirect = props => {
  const [, push] = useLocation()
  useLayoutEffect(() => {
    push(props.href || props.to)

    // we pass an empty array of dependecies to ensure that
    // we only run the effect once after initial render
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export default useRoute
